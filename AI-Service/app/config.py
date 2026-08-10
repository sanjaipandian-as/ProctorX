from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 8001
    NVIDIA_API_KEY: str
    NVIDIA_API_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_CHAT_MODEL: str = "google/gemma-4-31b-it"
    NVIDIA_EMBED_MODEL: str = "nvidia/embeddings-nv-embed-qa-4"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
