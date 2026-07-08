const config = require("./config");
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const { Server: SocketServer } = require("socket.io");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");
const { ensureTmpRoot } = require("./utils");
const { validateRunRequest } = require("./validator");
const { runJob } = require("./runner");
const queue = require("./queue");

// ─────────────────────────────────────────────
//  EXPRESS APP
// ─────────────────────────────────────────────

const app = express();
const server = http.createServer(app);

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (
      config.allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return cb(null, true);
    }
    cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: "1mb" }));

// Rate limiter for /run endpoints
const runLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait before running code again.",
  },
});

// ─────────────────────────────────────────────
//  SOCKET.IO
// ─────────────────────────────────────────────

const io = new SocketServer(server, {
  cors: {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (
        config.allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return cb(null, true);
      }
      cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Track connected sockets by jobId for targeted events
const jobSockets = new Map(); // jobId → Set<socket>

io.on("connection", (socket) => {
  // Client subscribes to a specific job's updates
  socket.on("job:subscribe", (jobId) => {
    if (!jobSockets.has(jobId)) {
      jobSockets.set(jobId, new Set());
    }
    jobSockets.get(jobId).add(socket);

    // If job already completed, send result immediately
    const cached = queue.getResult(jobId);
    if (cached) {
      socket.emit("job:complete", { jobId, result: cached });
    }
  });

  socket.on("disconnect", () => {
    // Clean up subscriptions
    for (const [jobId, sockets] of jobSockets.entries()) {
      sockets.delete(socket);
      if (sockets.size === 0) jobSockets.delete(jobId);
    }
  });
});

// Forward queue events to subscribed sockets
function emitToJob(jobId, event, data) {
  const sockets = jobSockets.get(jobId);
  if (sockets) {
    for (const socket of sockets) {
      socket.emit(event, data);
    }
  }
}

queue.on("job:queued", (data) => emitToJob(data.jobId, "job:queued", data));
queue.on("job:started", (data) => emitToJob(data.jobId, "job:started", data));
queue.on("test:result", (data) => emitToJob(data.jobId, "test:result", data));
queue.on("job:complete", (data) => emitToJob(data.jobId, "job:complete", data));
queue.on("job:error", (data) => emitToJob(data.jobId, "job:error", data));

// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────

// Health check
app.get("/", (_req, res) => {
  res.json({
    service: "ProctorX Compiler",
    status: "running",
    mode: config.executionMode,
    queue: queue.getStatus(),
    uptime: Math.floor(process.uptime()),
  });
});

app.get("/health", (_req, res) => {
  const status = queue.getStatus();
  res.status(status.accepting ? 200 : 503).json({
    healthy: status.accepting,
    mode: config.executionMode,
    queue: status,
  });
});

// ─── Async Run (returns jobId immediately) ───
app.post("/run/async", runLimiter, validateRunRequest, (req, res) => {
  try {
    const jobId = uuidv4();
    const info = queue.enqueue(jobId, req.validatedBody);
    res.status(202).json({
      jobId: info.jobId,
      position: info.position,
      message: "Job queued. Connect via WebSocket to receive real-time results.",
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Sync Run (waits for result — backward compatible) ───
app.post("/run", runLimiter, validateRunRequest, async (req, res) => {
  const status = queue.getStatus();

  // Reject if server is overloaded
  if (!status.accepting) {
    return res.status(503).json({
      error: "Server is busy. Please try again in a few seconds.",
      queue: status,
    });
  }

  try {
    const result = await runJob(req.validatedBody);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Get Job Result (for polling fallback) ───
app.get("/result/:jobId", (req, res) => {
  const result = queue.getResult(req.params.jobId);
  if (!result) {
    return res.status(404).json({ error: "Job not found or expired" });
  }
  res.json(result);
});

// ─── Queue Status ───
app.get("/status", (_req, res) => {
  res.json(queue.getStatus());
});

// ─── Global Error Handler ───
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────

async function start() {
  await ensureTmpRoot();
  console.log("[CONFIG] Execution mode:", config.executionMode);
  console.log("[CONFIG] Max concurrent jobs:", config.maxConcurrentJobs);
  console.log("[CONFIG] Max parallel tests:", config.maxParallelTests);
  console.log("[CONFIG] Temp root:", config.tmpRoot);

  server.listen(config.port, () => {
    console.log(`[SERVER] ProctorX Compiler running on port ${config.port}`);
  });
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing gracefully...`);
  server.close(() => {
    console.log("[SHUTDOWN] Server closed.");
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => process.exit(1), 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start();
