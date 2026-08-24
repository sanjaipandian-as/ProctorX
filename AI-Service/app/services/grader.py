import json
import re
from app.services.nvidia_client import nvidia_client
from app.config import settings

SYSTEM_INSTRUCTION = """You are an expert academic grader. Your task is to evaluate a student's answer to a descriptive question based on the expected answer and the grading rubric.

You MUST grade the answer out of the maximum possible marks (max_marks) and assign an integer score.
You MUST evaluate the answer against the following criteria:
1. Accuracy & Correctness (40% of marks)
2. Completeness & Concept Coverage (40% of marks)
3. Clarity & Technical Terminology (20% of marks)

Provide a structured evaluation in JSON format only. The JSON object must contain the following keys exactly:
- "score": (integer) marks awarded to the student (from 0 to max_marks)
- "feedback": (string) detailed paragraph showing the criteria breakdown and explaining the grade
- "strengths": (string) what the student did well
- "suggestions": (string) how the student can improve their answer
- "missing_concepts": (list of strings) key concepts from the expected answer that the student missed

Important: Output ONLY the raw JSON object. Do not wrap it in markdown code blocks.
"""

async def grade_student_response(question_text: str, student_answer: str, expected_answer: str, max_marks: int) -> dict:
    prompt = f"""Question: {question_text}
Expected Answer Guide: {expected_answer}
Student's Answer: {student_answer}
Max Marks: {max_marks}
"""
    # Note: We query the primary chat model (NVIDIA_CHAT_MODEL) directly WITHOUT fallback,
    # ensuring consistent scoring. It will retry using the exponential backoff policy built into nvidia_client.
    response = await nvidia_client.chat_completion(
        system_instruction=SYSTEM_INSTRUCTION,
        prompt=prompt,
        json_mode=True,
        model=settings.NVIDIA_CHAT_MODEL
    )
    
    content = response["choices"][0]["message"]["content"].strip()
    content_clean = re.sub(r"^```(?:json)?\n|```$", "", content, flags=re.MULTILINE)
    result = json.loads(content_clean)
    
    # Validate score bounds
    if "score" in result:
        try:
            result["score"] = max(0, min(int(result["score"]), max_marks))
        except (ValueError, TypeError):
            result["score"] = 0
    else:
        result["score"] = 0
        
    return result
