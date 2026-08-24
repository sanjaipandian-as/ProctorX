"""
Question Regeneration Router.

POST /api/ai/quiz/regenerate-question -> updates a single question based on teacher instructions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.quiz_gen import regenerate_single_question
from app.services.qdrant_client import qdrant_service

router = APIRouter(prefix="/api/ai/quiz", tags=["quiz"])

class QuestionRegenRequest(BaseModel):
    question: Dict[str, Any]
    prompt: str
    difficulty: Optional[str] = None
    documentId: Optional[str] = None
    teacherId: str

@router.post("/regenerate-question")
async def regenerate_question(req: QuestionRegenRequest):
    try:
        context_chunks = None
        if req.documentId:
            # Fetch relevant context from Qdrant if document is attached
            results = qdrant_service.search_chunks(
                document_id=req.documentId,
                query_text=req.prompt,
                limit=3,
                teacher_id=req.teacherId
            )
            if results:
                context_chunks = [res["text"] for res in results]

        updated_question = await regenerate_single_question(
            question_data=req.question,
            prompt=req.prompt,
            difficulty=req.difficulty,
            context_chunks=context_chunks
        )

        return updated_question.model_dump()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
