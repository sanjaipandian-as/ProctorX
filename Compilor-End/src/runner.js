const fs = require("fs-extra");
console.log("RUNNER FILE LOADED FROM =", __filename);

const path = require("path");
path.normalize = p => p.replace(/\\/g, "/");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const { getTmpDirPath } = require("./utils");

const DEFAULT_CPU = process.env.DEFAULT_CPU || "0.5";
const DEFAULT_MEMORY_MB = parseInt(process.env.DEFAULT_MEMORY_MB || "256", 10);
const DEFAULT_TIME_MS = parseInt(process.env.DEFAULT_TIME_MS || "3000", 10);

const IMAGE_PY = process.env.DOCKER_IMAGE_PYTHON;
const IMAGE_CPP = process.env.DOCKER_IMAGE_CPP;
const IMAGE_JAVA = process.env.DOCKER_IMAGE_JAVA;
const IMAGE_NODE = process.env.DOCKER_IMAGE_NODE;

async function writeFileSafe(dir, filename, content) {
  await fs.outputFile(path.join(dir, filename), content, { mode: 0o644 });
}

function dockerArgsForRun(jobDir, image, binds = [], memoryMb, cpus, extra = []) {
  const args = [
    "run",
    "--rm",
    "--network", "none",
    "--pids-limit", "64",
    "--security-opt", "no-new-privileges",
    "--cap-drop", "ALL",
    "--memory", `${memoryMb}m`,
    "--cpus", `${cpus}`,
    "--workdir", "/workspace",
    "--user", "runner",
    "--read-only=false"
  ];

  binds.forEach(b => {
    let hostPath = b.host.replace(/\\/g, "/");
    // if (hostPath[1] === ":") {
    //   const drive = hostPath[0].toLowerCase();
    //   hostPath = `/mnt/${drive}${hostPath.slice(2)}`;
    // }

    console.log("DOCKER MOUNT PATH =", `${hostPath}:${b.container}:rw`);
    args.push("-v", `${hostPath}:${b.container}:rw`);
  });

  args.push(image);
  args.push(...extra);

  return args;
}


function execDocker(args, timeoutMs) {
  return new Promise(resolve => {
    const proc = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", d => stdout += d.toString());
    proc.stderr.on("data", d => stderr += d.toString());

    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
    }, timeoutMs);

    proc.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout, stderr, killed });
    });
  });
}

async function runJob(payload) {
  const jobId = uuidv4();
  const jobDir = getTmpDirPath(jobId);

  await fs.ensureDir(jobDir);

  const language = payload.language.toLowerCase();
  const tests = payload.tests?.length ? payload.tests : [{ input: "" }];
  const timeLimitMs = payload.timeLimitMs || DEFAULT_TIME_MS;
  const memoryMb = payload.memoryMb || DEFAULT_MEMORY_MB;
  const cpus = payload.cpus || DEFAULT_CPU;

  let sourceFilename, compileStep, runCmdTemplate, image;

  // PYTHON
  if (language === "python") {
    image = IMAGE_PY;
    sourceFilename = "main.py";
    await writeFileSafe(jobDir, sourceFilename, payload.code || "");
    compileStep = null;
    runCmdTemplate = ["python3", "main.py"];
  }

  // JAVASCRIPT
  else if (language === "javascript" || language === "node") {
    image = IMAGE_NODE;
    sourceFilename = "main.js";
    await writeFileSafe(jobDir, sourceFilename, payload.code || "");
    compileStep = null;
    runCmdTemplate = ["node", "main.js"];
  }

  // C++
  else if (language === "cpp" || language === "c++") {
    image = IMAGE_CPP;
    sourceFilename = "main.cpp";

    console.log("Writing C++ file to:", path.join(jobDir, sourceFilename));
    await writeFileSafe(jobDir, sourceFilename, payload.code || "");
    console.log("C++ file exists?", fs.existsSync(path.join(jobDir, sourceFilename)));

    compileStep = {
      cmd: ["g++", "-O2", "main.cpp", "-std=c++17", "-o", "main.out"],
      out: "main.out"
    };

    runCmdTemplate = ["./main.out"];
  }

  // JAVA
  else if (language === "java") {
    image = IMAGE_JAVA;
    sourceFilename = "Main.java";

    await writeFileSafe(jobDir, sourceFilename, payload.code || "");

    compileStep = {
      cmd: ["javac", "Main.java"],
      out: "Main.class"
    };

    runCmdTemplate = ["java", "-Xss64m", "Main"];
  }

  else {
    throw new Error("Unsupported language");
  }

  const bind = { host: jobDir, container: "/workspace" };
  const results = { jobId, language, tests: [] };

  // COMPILATION
  if (compileStep) {
    const compileCmd = compileStep.cmd.join(" ");
    const args = dockerArgsForRun(
      jobDir,
      image,
      [bind],
      memoryMb,
      cpus,
      ["sh", "-c", compileCmd]
    );

    // Give compilation more time (e.g., 10 seconds or user limit, whichever is higher)
    const compileTimeout = Math.max(timeLimitMs, 10000);
    const compileRes = await execDocker(args, compileTimeout);
    results.compile = compileRes;

    if (compileRes.code !== 0 || compileRes.stderr) {
      await fs.remove(jobDir);
      return results;
    }
  }

  // RUN TESTS
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];

    console.log(`\n=== Running Test ${i + 1} ===`);
    console.log("Input:", t.input);

    await writeFileSafe(jobDir, `input_${i}.txt`, t.input || "");

    const cmdParts = runCmdTemplate;
    const runCmd = cmdParts.map(c => (c.includes(" ") ? `"${c}"` : c)).join(" ");
    const timeoutSec = Math.max(1, Math.ceil(timeLimitMs / 1000));

    const args = dockerArgsForRun(
      jobDir,
      image,
      [bind],
      memoryMb,
      cpus,
      ["sh", "-c", `timeout ${timeoutSec}s ${runCmd} < /workspace/input_${i}.txt`]
    );

    const execRes = await execDocker(args, timeLimitMs + 500);

    console.log(`Test ${i + 1} Output:`, execRes.stdout.trim());
    console.log(`Test ${i + 1} Stderr:`, execRes.stderr);

    results.tests.push({
      index: i,
      input: t.input,
      stdout: execRes.stdout,
      stderr: execRes.stderr,
      code: execRes.code,
      signal: execRes.signal,
      killed: execRes.killed
    });
  }

  await fs.remove(jobDir);
  return results;
}

module.exports = { runJob };
