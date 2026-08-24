const fs = require("fs-extra");
const path = require("path");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const config = require("./config");
const { getJobDir, truncateOutput, cleanupJobDir, toDockerPath } = require("./utils");

// ─────────────────────────────────────────────
//  LANGUAGE DEFINITIONS
// ─────────────────────────────────────────────

const LANGUAGES = {
  python: {
    image: config.images.python,
    filename: "main.py",
    compile: null,
    run: ["python3", "main.py"],
  },
  javascript: {
    image: config.images.node,
    filename: "main.js",
    compile: null,
    run: ["node", "main.js"],
  },
  node: {
    image: config.images.node,
    filename: "main.js",
    compile: null,
    run: ["node", "main.js"],
  },
  cpp: {
    image: config.images.cpp,
    filename: "main.cpp",
    compile: { cmd: "g++ -O2 -std=c++17 main.cpp -o main.out", out: "main.out" },
    run: ["./main.out"],
  },
  "c++": {
    image: config.images.cpp,
    filename: "main.cpp",
    compile: { cmd: "g++ -O2 -std=c++17 main.cpp -o main.out", out: "main.out" },
    run: ["./main.out"],
  },
  java: {
    image: config.images.java,
    filename: "Main.java",
    compile: { cmd: "javac Main.java", out: "Main.class" },
    run: ["java", "-Xss64m", "Main"],
  },
};

// ─────────────────────────────────────────────
//  PROCESS EXECUTION
// ─────────────────────────────────────────────

/**
 * Spawns a process and returns { code, signal, stdout, stderr, killed, durationMs }.
 * Works for both Docker and direct mode.
 */
function execProcess(cmd, args, options, timeoutMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...options });

    let stdout = "";
    let stderr = "";
    let killed = false;

    proc.stdout.on("data", (d) => {
      stdout += d.toString();
      // Live truncation — stop buffering if output exceeds limit
      if (Buffer.byteLength(stdout, "utf8") > config.maxOutputBytes * 2) {
        stdout = truncateOutput(stdout, config.maxOutputBytes);
      }
    });

    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      if (Buffer.byteLength(stderr, "utf8") > config.maxOutputBytes * 2) {
        stderr = truncateOutput(stderr, config.maxOutputBytes);
      }
    });

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
    }, timeoutMs);

    proc.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        code: -1,
        signal: null,
        stdout: "",
        stderr: `Execution Error: ${err.message}`,
        killed: false,
        durationMs: Date.now() - start,
      });
    });

    proc.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({
        code,
        signal,
        stdout: truncateOutput(stdout, config.maxOutputBytes),
        stderr: truncateOutput(stderr, config.maxOutputBytes),
        killed,
        durationMs: Date.now() - start,
      });
    });
  });
}

// ─────────────────────────────────────────────
//  DOCKER COMMAND BUILDER
// ─────────────────────────────────────────────

function buildDockerArgs(image, hostDir, memoryMb, cpus, execCmd) {
  const containerDir = "/workspace";
  return [
    "run", "--rm",
    "--network", "none",
    "--pids-limit", "64",
    "--security-opt", "no-new-privileges",
    "--cap-drop", "ALL",
    "--memory", `${memoryMb}m`,
    "--cpus", `${cpus}`,
    "--workdir", containerDir,
    "--user", "runner",
    "--read-only=false",
    "-v", `${toDockerPath(hostDir)}:${containerDir}:rw`,
    image,
    "sh", "-c", execCmd,
  ];
}

// ─────────────────────────────────────────────
//  SINGLE TEST RUNNER
// ─────────────────────────────────────────────

async function runSingleTest(index, input, jobDir, langDef, timeLimitMs, memoryMb, cpus) {
  const inputFile = `input_${index}.txt`;
  await fs.outputFile(path.join(jobDir, inputFile), input || "", { mode: 0o644 });

  const runCmd = langDef.run.map((c) => (c.includes(" ") ? `"${c}"` : c)).join(" ");
  const timeoutSec = Math.max(1, Math.ceil(timeLimitMs / 1000));

  let result;


  if (config.executionMode === "direct") {
    const isWindows = process.platform === "win32";
    if (isWindows) {
      // Use cmd.exe shell redirection on Windows
      const fullCmd = `${runCmd} < ${inputFile}`;
      result = await execProcess("cmd.exe", ["/c", fullCmd], { cwd: jobDir }, timeLimitMs + 2000);
    } else {
      const fullCmd = `timeout ${timeoutSec}s ${runCmd} < ${inputFile}`;
      result = await execProcess("sh", ["-c", fullCmd], { cwd: jobDir }, timeLimitMs + 2000);
    }
  } else {
    const execCmd = `timeout ${timeoutSec}s ${runCmd} < /workspace/${inputFile}`;
    const args = buildDockerArgs(langDef.image, jobDir, memoryMb, cpus, execCmd);
    result = await execProcess("docker", args, {}, timeLimitMs + 5000);
  }

  return {
    index,
    input,
    stdout: result.stdout,
    stderr: result.stderr,
    code: result.code,
    signal: result.signal,
    killed: result.killed,
    durationMs: result.durationMs,
  };
}

// ─────────────────────────────────────────────
//  MAIN JOB RUNNER
// ─────────────────────────────────────────────

/**
 * Runs a complete code execution job.
 * @param {Object} payload - { language, code, tests, timeLimitMs, memoryMb, cpus }
 * @param {Function} onTestComplete - Optional callback: (testResult) => void
 * @returns {Object} - { jobId, language, compile?, tests[] }
 */
async function runJob(payload, onTestComplete) {
  const jobId = uuidv4();
  const jobDir = getJobDir(jobId);
  await fs.ensureDir(jobDir);

  const language = payload.language.toLowerCase();
  const langDef = LANGUAGES[language];

  if (!langDef) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const tests = payload.tests?.length ? payload.tests : [{ input: "" }];
  const timeLimitMs = payload.timeLimitMs || config.defaultTimeLimitMs;
  const memoryMb = payload.memoryMb || config.defaultMemoryMb;
  const cpus = payload.cpus || config.defaultCpus;

  // Write source code
  await fs.outputFile(path.join(jobDir, langDef.filename), payload.code || "", { mode: 0o644 });

  const results = { jobId, language, tests: [] };

  // ─── Compilation (if needed) ───
  if (langDef.compile) {
    let compileResult;
    const compileTimeout = Math.max(timeLimitMs, 15000);

    if (config.executionMode === "direct") {
      const isWindows = process.platform === "win32";

      // On Windows direct mode, check if the compiler binary is available first
      if (isWindows) {
        const compilerBin = langDef.compile.cmd.split(" ")[0]; // e.g. "g++" or "javac"
        const checkResult = await execProcess("cmd.exe", ["/c", `where ${compilerBin}`], { cwd: jobDir }, 5000);
        if (checkResult.code !== 0) {
          await cleanupJobDir(jobDir);
          results.compile = {
            code: 1,
            stdout: "",
            stderr: `Compilation Error:\n'${compilerBin}' is not recognized as an internal or external command,\noperable program or batch file.\n\nTo run ${language.toUpperCase()} code locally on Windows, please install the required compiler:\n${compilerBin === "g++" ? "• MinGW-w64: https://www.mingw-w64.org/\n• Or enable WSL2 and install build-essential" : "• JDK: https://adoptium.net/"}`,
            killed: false,
            durationMs: 0,
          };
          return results;
        }
        compileResult = await execProcess("cmd.exe", ["/c", langDef.compile.cmd], { cwd: jobDir }, compileTimeout);
      } else {
        compileResult = await execProcess("sh", ["-c", langDef.compile.cmd], { cwd: jobDir }, compileTimeout);
      }
    } else {
      const args = buildDockerArgs(langDef.image, jobDir, memoryMb, cpus, langDef.compile.cmd);
      compileResult = await execProcess("docker", args, {}, compileTimeout);
    }

    results.compile = {
      code: compileResult.code,
      stdout: compileResult.stdout,
      stderr: compileResult.stderr,
      killed: compileResult.killed,
      durationMs: compileResult.durationMs,
    };

    if (compileResult.code !== 0 || compileResult.killed) {
      await cleanupJobDir(jobDir);
      return results;
    }
  }

  // ─── Run Tests in Parallel ───
  const parallelLimit = Math.min(config.maxParallelTests, tests.length);

  // Semaphore-based parallel execution
  let running = 0;
  let nextIndex = 0;
  const testResults = new Array(tests.length);

  await new Promise((resolve) => {
    function launchNext() {
      while (running < parallelLimit && nextIndex < tests.length) {
        const i = nextIndex++;
        running++;

        runSingleTest(i, tests[i].input, jobDir, langDef, timeLimitMs, memoryMb, cpus)
          .then((result) => {
            testResults[i] = result;
            if (onTestComplete) onTestComplete(result);
            running--;
            if (nextIndex >= tests.length && running === 0) {
              resolve();
            } else {
              launchNext();
            }
          })
          .catch((err) => {
            testResults[i] = {
              index: i,
              input: tests[i].input,
              stdout: "",
              stderr: `Internal Error: ${err.message}`,
              code: -1,
              signal: null,
              killed: false,
              durationMs: 0,
            };
            if (onTestComplete) onTestComplete(testResults[i]);
            running--;
            if (nextIndex >= tests.length && running === 0) {
              resolve();
            } else {
              launchNext();
            }
          });
      }
    }

    launchNext();
  });

  results.tests = testResults;

  // ─── Cleanup ───
  await cleanupJobDir(jobDir);

  return results;
}

module.exports = { runJob, LANGUAGES };
