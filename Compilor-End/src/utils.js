const path = require("path");
const fs = require("fs-extra");
const crypto = require("crypto");
const config = require("./config");

const tmpRoot = config.tmpRoot;

/**
 * Ensures the temp root directory exists.
 */
async function ensureTmpRoot() {
  await fs.ensureDir(tmpRoot);
}

/**
 * Returns the absolute path for a job's temp directory.
 */
function getJobDir(jobId) {
  return path.join(tmpRoot, jobId);
}

/**
 * Truncates a string to maxBytes to prevent memory bombs.
 */
function truncateOutput(str, maxBytes) {
  if (!str) return "";
  const limit = maxBytes || config.maxOutputBytes;
  if (Buffer.byteLength(str, "utf8") <= limit) return str;
  const buf = Buffer.from(str, "utf8").subarray(0, limit);
  return buf.toString("utf8") + "\n\n--- OUTPUT TRUNCATED (exceeded " + limit + " bytes) ---";
}

/**
 * Generates a SHA-256 hash for deduplication.
 */
function hashRequest(language, code) {
  return crypto.createHash("sha256").update(language + "::" + code).digest("hex").slice(0, 16);
}

/**
 * Safely removes a job directory (fire-and-forget).
 */
async function cleanupJobDir(jobDir) {
  try {
    await fs.remove(jobDir);
  } catch (_) {
    // Best-effort cleanup — don't crash on failure
  }
}

/**
 * Normalizes a Windows path to Docker-compatible mount path.
 * e.g. C:\Users\foo → /c/Users/foo
 */
function toDockerPath(hostPath) {
  let p = hostPath.replace(/\\/g, "/");
  if (p[1] === ":") {
    p = "/" + p[0].toLowerCase() + p.slice(2);
  }
  return p;
}

module.exports = {
  tmpRoot,
  ensureTmpRoot,
  getJobDir,
  truncateOutput,
  hashRequest,
  cleanupJobDir,
  toDockerPath,
};
