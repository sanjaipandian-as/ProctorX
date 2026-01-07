FROM node:18-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates procps && rm -rf /var/lib/apt/lists/*
RUN groupadd -r runner && useradd -r -g runner -m runner
WORKDIR /workspace
USER runner
CMD ["node"]
