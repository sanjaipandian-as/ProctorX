from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import re

from app.services.nvidia_client import nvidia_client
from app.services.qdrant_client import qdrant_service
from app.services.quiz_gen import generate_quiz_content
from app.config import settings

router = APIRouter(prefix="/api/ai/quiz", tags=["quiz"])

class QuizGenRequest(BaseModel):
    prompt: str
    teacherId: str
    documentId: Optional[str] = None
    numMcq: Optional[int] = None
    numDescriptive: Optional[int] = None
    numCoding: Optional[int] = None
    difficulty: Optional[str] = None  # 'Easy' | 'Medium' | 'Hard'

def is_generic_prompt(prompt: str) -> bool:
    """Detects if the user prompt is a generic request to create a quiz from the document."""
    p = prompt.lower().strip()
    p = re.sub(r'[^\w\s]', '', p)
    words = p.split()
    if not words:
        return True
        
    generic_words = {
        "create", "generate", "make", "build", "compile", "write", "setup",
        "quiz", "test", "exam", "question", "questions", "assessment",
        "from", "on", "of", "about", "for", "with", "in", "to", "by", "at",
        "document", "pdf", "file", "uploaded", "material", "materials",
        "study", "this", "the", "a", "an", "text", "book", "chapter", "some", "any", "all"
    }
    
    return all(w in generic_words for w in words)

@router.post("/generate")
async def generate_quiz(req: QuizGenRequest):
    if not req.teacherId.strip():
        raise HTTPException(status_code=400, detail="teacherId is required for data isolation.")
        
    try:
        context_chunks = None
        source_chunks_metadata = []
        user_prompt = req.prompt
        
        if req.documentId:
            if is_generic_prompt(req.prompt):
                # Retrieve representative chunks spread evenly across the document
                results = qdrant_service.get_representative_chunks(
                    document_id=req.documentId,
                    teacher_id=req.teacherId,
                    limit=8
                )
                # Override the prompt so the LLM knows to write about the actual document subject
                user_prompt = "Create a comprehensive quiz based on the key concepts, topics, and details described in the provided study materials."
            else:
                # Specific topic prompt: perform semantic RAG search
                query_embedding = await nvidia_client.get_embedding(req.prompt)
                results = qdrant_service.search_similar_chunks(
                    document_id=req.documentId,
                    query_embedding=query_embedding,
                    teacher_id=req.teacherId,
                    limit=5
                )
                
            if results:
                context_chunks = [res["text"] for res in results]
                source_chunks_metadata = results
                
        # Generate quiz with question count controls, grounding check, and starter code generation
        quiz = await generate_quiz_content(
            user_prompt=user_prompt,
            context_chunks=context_chunks,
            num_mcq=req.numMcq,
            num_descriptive=req.numDescriptive,
            num_coding=req.numCoding,
            difficulty=req.difficulty,
        )

        return {
            "parsed": quiz.model_dump(),
            "sourceChunks": source_chunks_metadata,
            "model": settings.NVIDIA_CHAT_MODEL,
            "promptVersion": settings.AI_PROMPT_VERSION
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
