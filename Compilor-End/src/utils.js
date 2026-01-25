const path = require("path");
const fs = require("fs-extra");

const tmpRoot = process.env.TMP_ROOT && !process.env.TMP_ROOT.startsWith("C:")
  ? process.env.TMP_ROOT
  : (process.env.RENDER ? "/tmp/proctorx" : path.join(__dirname, "../tmp"));

async function ensureTmpRoot() {
  await fs.ensureDir(tmpRoot);
}

function getTmpDirPath(jobId) {
  return `${tmpRoot}/${jobId}`;
}

module.exports = { ensureTmpRoot, getTmpDirPath };
