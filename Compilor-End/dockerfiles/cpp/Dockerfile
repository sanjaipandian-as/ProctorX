FROM gcc:12

RUN apt-get update && apt-get install -y --no-install-recommends \
    coreutils \
    ca-certificates \
    procps \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r runner && useradd -r -g runner -m runner

USER runner
WORKDIR /workspace
