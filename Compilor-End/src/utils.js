const path = require("path");
const fs = require("fs-extra");

const tmpRoot = process.env.TMP_ROOT;

async function ensureTmpRoot() {
  await fs.ensureDir(tmpRoot);
}

function getTmpDirPath(jobId) {
  return `${tmpRoot}/${jobId}`;
}

module.exports = { ensureTmpRoot, getTmpDirPath };
