require("dotenv").config();

const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  env: process.env.NODE_ENV || "development",

  // ─── Execution ───
  executionMode: process.env.EXECUTION_MODE || "docker",
  maxParallelTests: parseInt(process.env.MAX_PARALLEL_TESTS || "5", 10),
  defaultTimeLimitMs: parseInt(process.env.DEFAULT_TIME_MS || "10000", 10),
  defaultMemoryMb: parseInt(process.env.DEFAULT_MEMORY_MB || "256", 10),
  defaultCpus: process.env.DEFAULT_CPU || "0.5",

  // ─── Limits ───
  maxOutputBytes: parseInt(process.env.MAX_OUTPUT_BYTES || "10240", 10),
  maxCodeLength: parseInt(process.env.MAX_CODE_LENGTH || "51200", 10),
  maxTests: parseInt(process.env.MAX_TESTS || "20", 10),

  // ─── Job Queue ───
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || "4", 10),
  maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE || "50", 10),
  jobTimeoutMs: parseInt(process.env.JOB_TIMEOUT_MS || "60000", 10),

  // ─── Docker Images ───
  images: {
    python: process.env.DOCKER_IMAGE_PYTHON || "proctorx-python",
    cpp: process.env.DOCKER_IMAGE_CPP || "proctorx-cpp",
    java: process.env.DOCKER_IMAGE_JAVA || "proctorx-java",
    node: process.env.DOCKER_IMAGE_NODE || "proctorx-node",
  },

  // ─── Temp Directory ───
  tmpRoot: process.env.TMP_ROOT || "/tmp/proctorx",

  // ─── CORS ───
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:5173,http://localhost:5174,http://localhost:3000,https://proctorxofficial.vercel.app"
  ).split(",").map(s => s.trim()),

  // ─── Rate Limiting ───
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "10", 10),
  },
};

module.exports = config;
