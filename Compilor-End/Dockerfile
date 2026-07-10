# ──────────────────────────────────────────────
#  ProctorX Compiler — Production Dockerfile
#  Includes all compilers + the Node.js service
# ──────────────────────────────────────────────

FROM node:18-bullseye-slim AS base

# Install compilers and runtimes
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    openjdk-17-jdk-headless \
    g++ \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# Create non-root runner user for sandboxed execution
RUN useradd --no-create-home --shell /bin/false runner

# ──── Build Stage ────
FROM base AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ──── Production Stage ────
FROM base AS production

WORKDIR /app

# Copy node_modules from build stage
COPY --from=build /app/node_modules ./node_modules
COPY . .

# Create temp directory with correct permissions
RUN mkdir -p /tmp/proctorx && chmod 777 /tmp/proctorx

# Environment
ENV NODE_ENV=production
ENV PORT=4000
ENV EXECUTION_MODE=direct
ENV TMP_ROOT=/tmp/proctorx

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http=require('http');http.get('http://localhost:4000/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

EXPOSE 4000

# Use node directly (not npm) for proper signal handling
CMD ["node", "src/index.js"]
