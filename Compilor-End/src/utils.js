const path = require("path");
const fs = require("fs-extra");

const tmpRoot = process.env.TMP_ROOT;

console.log("UTILS FILE LOADED FROM =", __filename);
console.log("TMP_ROOT VALUE =", tmpRoot);

async function ensureTmpRoot() {
  await fs.ensureDir(tmpRoot);
}

function getTmpDirPath(jobId) {
  return `${tmpRoot}/${jobId}`;
}

module.exports = { ensureTmpRoot, getTmpDirPath };
