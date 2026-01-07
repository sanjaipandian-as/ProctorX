FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
RUN groupadd -r runner && useradd -r -g runner -m runner
WORKDIR /workspace
USER runner
ENV PATH="/workspace:${PATH}"
CMD ["python3"]
