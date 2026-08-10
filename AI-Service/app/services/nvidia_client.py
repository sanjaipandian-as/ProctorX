import httpx
from app.config import settings

class NvidiaClient:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
            "Content-Type": "application/json"
        }

    async def chat_completion(self, system_instruction: str, prompt: str, json_mode: bool = False) -> dict:
        payload = {
            "model": settings.NVIDIA_CHAT_MODEL,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 2048
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.NVIDIA_API_BASE_URL}/chat/completions",
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def get_embedding(self, text: str) -> list[float]:
        payload = {
            "input": [text],
            "model": settings.NVIDIA_EMBED_MODEL,
            "encoding_format": "float"
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.NVIDIA_API_BASE_URL}/embeddings",
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()["data"][0]["embedding"]

nvidia_client = NvidiaClient()
