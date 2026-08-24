from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.grader import grade_student_response

router = APIRouter(prefix="/api/ai/grade", tags=["grading"])

class GradeRequest(BaseModel):
    questionText: str
    studentAnswer: str
    expectedAnswer: str
    maxMarks: int

@router.post("")
async def grade_answer(req: GradeRequest):
    try:
        grading_result = await grade_student_response(
            question_text=req.questionText,
            student_answer=req.studentAnswer,
            expected_answer=req.expectedAnswer,
            max_marks=req.maxMarks
        )
        return grading_result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
