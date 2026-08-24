from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.nvidia_client import nvidia_client
from app.config import settings
from app.routers import documents, quiz, grading, documents_list, regenerate

app = FastAPI(title="ProctorX AI Service")

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(documents_list.router)
app.include_router(quiz.router)
app.include_router(regenerate.router)
app.include_router(grading.router)

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
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
