FROM eclipse-temurin:17-jdk
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates procps && rm -rf /var/lib/apt/lists/*
RUN groupadd -r runner && useradd -r -g runner -m runner
WORKDIR /workspace
USER runner
CMD ["bash"]
