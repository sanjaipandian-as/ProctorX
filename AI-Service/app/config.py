from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 8001
    NVIDIA_API_KEY: str
    NVIDIA_API_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    # Primary model: Llama 3.3 70B — 128K context, superior JSON output and coding quality
    NVIDIA_CHAT_MODEL: str = "meta/llama-3.3-70b-instruct"
    # Fallback model: smaller, faster — used when primary fails
    NVIDIA_FALLBACK_MODEL: str = "meta/llama-3.1-8b-instruct"
    NVIDIA_EMBED_MODEL: str = "nvidia/llama-nemotron-embed-1b-v2"
    # Quiz generation limits (prevents runaway LLM costs)
    MAX_MCQ: int = 20
    MAX_DESCRIPTIVE: int = 10
    MAX_CODING: int = 5
    AI_PROMPT_VERSION: str = "quiz-generation-v3"

    VECTOR_DATABASE_URL: str = "postgresql://neondb_owner:npg_2i3nbfaXcdgx@ep-patient-hill-ayesw5uc-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
