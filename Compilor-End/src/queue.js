const { EventEmitter } = require("events");
const config = require("./config");
const { runJob } = require("./runner");

// ─────────────────────────────────────────────
//  JOB QUEUE
//  In-memory concurrent job queue with limits,
//  timeouts, and event-driven progress reporting.
// ─────────────────────────────────────────────

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.pending = [];           // Waiting jobs
    this.active = new Map();     // jobId → { job, timeoutHandle }
    this.completed = new Map();  // jobId → result (kept for 60s for late fetches)
    this.maxConcurrent = config.maxConcurrentJobs;
    this.maxQueueSize = config.maxQueueSize;
    this.jobTimeout = config.jobTimeoutMs;
  }

  /**
   * Returns current queue statistics.
   */
  getStatus() {
    return {
      pending: this.pending.length,
      active: this.active.size,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize,
      accepting: this.pending.length < this.maxQueueSize,
    };
  }

  /**
   * Enqueues a job. Returns { jobId, position } or throws if queue is full.
   */
  enqueue(jobId, payload) {
    if (this.pending.length >= this.maxQueueSize) {
      const err = new Error("Queue is full. Please try again later.");
      err.status = 503;
      throw err;
    }

    const position = this.pending.length + 1;
    this.pending.push({ jobId, payload });

    this.emit("job:queued", { jobId, position });
    this._processNext();

    return { jobId, position };
  }

  /**
   * Processes the next job from the queue if capacity allows.
   */
  _processNext() {
    while (this.active.size < this.maxConcurrent && this.pending.length > 0) {
      const { jobId, payload } = this.pending.shift();
      this._execute(jobId, payload);
    }
  }

  /**
   * Executes a single job with timeout protection.
   */
  async _execute(jobId, payload) {
    // Set up timeout
    const timeoutHandle = setTimeout(() => {
      this.active.delete(jobId);
      const error = { error: "Job timed out", jobId };
      this.emit("job:error", error);
      this._storeCompleted(jobId, error);
      this._processNext();
    }, this.jobTimeout);

    this.active.set(jobId, { payload, timeoutHandle });
    this.emit("job:started", { jobId });

    try {
      // onTestComplete callback — emit per-test results in real-time
      const onTestComplete = (testResult) => {
        this.emit("test:result", { jobId, ...testResult });
      };

      const result = await runJob(payload, onTestComplete);

      clearTimeout(timeoutHandle);
      this.active.delete(jobId);

      this.emit("job:complete", { jobId, result });
      this._storeCompleted(jobId, result);
    } catch (err) {
      clearTimeout(timeoutHandle);
      this.active.delete(jobId);

      const error = { error: String(err), jobId };
      this.emit("job:error", error);
      this._storeCompleted(jobId, error);
    }

    this._processNext();
  }

  /**
   * Stores completed results for 60 seconds (for late HTTP fetches).
   */
  _storeCompleted(jobId, result) {
    this.completed.set(jobId, result);
    setTimeout(() => this.completed.delete(jobId), 60000);
  }

  /**
   * Retrieves a completed job result.
   */
  getResult(jobId) {
    return this.completed.get(jobId) || null;
  }
}

// Singleton instance
const queue = new JobQueue();

module.exports = queue;
