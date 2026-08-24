import httpx
import asyncio
from app.config import settings

class NvidiaClient:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
            "Content-Type": "application/json"
        }

    async def _post_request_with_retry(self, url: str, payload: dict, timeout: float = 180.0, max_retries: int = 3, initial_delay: float = 1.0, backoff_factor: float = 2.0) -> dict:
        delay = initial_delay
        last_error = None
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(url, json=payload, headers=self.headers)
                    response.raise_for_status()
                    return response.json()
            except httpx.HTTPStatusError as e:
                # Retry on rate limit (429) or server errors (5xx)
                if e.response.status_code in [429, 500, 502, 503, 504]:
                    last_error = e
                    print(f"NVIDIA API temporary error {e.response.status_code} (attempt {attempt+1}/{max_retries}). Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                    delay *= backoff_factor
                else:
                    # Client errors (400, 401, 403, 404), do not retry
                    raise e
            except (httpx.RequestError, asyncio.TimeoutError) as e:
                last_error = e
                print(f"NVIDIA API network/timeout error: {str(e)} (attempt {attempt+1}/{max_retries}). Retrying in {delay}s...")
                await asyncio.sleep(delay)
                delay *= backoff_factor
        raise last_error

    async def chat_completion(self, system_instruction: str, prompt: str, json_mode: bool = False, model: str = None) -> dict:
        chat_model = model or settings.NVIDIA_CHAT_MODEL
        payload = {
            "model": chat_model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 4096
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        url = f"{settings.NVIDIA_API_BASE_URL}/chat/completions"
        return await self._post_request_with_retry(url, payload)

    async def chat_completion_with_fallback(self, system_instruction: str, prompt: str, json_mode: bool = False, allow_fallback: bool = True) -> dict:
        """Tries to query the primary chat model. If it fails and allow_fallback is True, queries the fallback model."""
        try:
            return await self.chat_completion(system_instruction, prompt, json_mode, model=settings.NVIDIA_CHAT_MODEL)
        except Exception as e:
            if allow_fallback and settings.NVIDIA_CHAT_MODEL != settings.NVIDIA_FALLBACK_MODEL:
                print(f"Primary model {settings.NVIDIA_CHAT_MODEL} failed: {str(e)}. Falling back to {settings.NVIDIA_FALLBACK_MODEL}...")
                return await self.chat_completion(system_instruction, prompt, json_mode, model=settings.NVIDIA_FALLBACK_MODEL)
            else:
                raise e

    async def get_embedding(self, text: str) -> list[float]:
        payload = {
            "input": [text],
            "model": settings.NVIDIA_EMBED_MODEL,
            "encoding_format": "float",
            "input_type": "query"
        }
        url = f"{settings.NVIDIA_API_BASE_URL}/embeddings"
        res = await self._post_request_with_retry(url, payload, timeout=30.0)
        return res["data"][0]["embedding"]

    async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        payload = {
            "input": texts,
            "model": settings.NVIDIA_EMBED_MODEL,
            "encoding_format": "float",
            "input_type": "passage"
        }
        url = f"{settings.NVIDIA_API_BASE_URL}/embeddings"
        res = await self._post_request_with_retry(url, payload, timeout=60.0)
        data = res["data"]
        data_sorted = sorted(data, key=lambda x: x.get("index", 0))
        return [item["embedding"] for item in data_sorted]

nvidia_client = NvidiaClient()
