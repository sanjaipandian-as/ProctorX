from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.services.nvidia_client import nvidia_client
from app.config import settings

app = FastAPI(title="ProctorX AI Service")

class ChatRequest(BaseModel):
    prompt: str
    system_instruction: str = "You are a helpful assistant."

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "ProctorX AI Service"}

@app.post("/api/ai/chat")
async def chat_test(req: ChatRequest):
    try:
        response = await nvidia_client.chat_completion(
            system_instruction=req.system_instruction,
            prompt=req.prompt
        )
        return {
            "model": settings.NVIDIA_CHAT_MODEL,
            "response": response["choices"][0]["message"]["content"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
