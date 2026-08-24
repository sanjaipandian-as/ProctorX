from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict

class TestCase(BaseModel):
    input: str
    output: str
    hidden: bool = False  # Hidden test cases aren't shown to students during exam

class QuestionSchema(BaseModel):
    questionText: str
    questionType: Literal["mcq", "descriptive", "coding"]
    imageUrl: Optional[str] = Field(None, description="Optional image URL attached to the question")
    options: Optional[List[str]] = Field(None, description="Must have exactly 4 options for mcq, else null")
    correctAns: Optional[int] = Field(0, description="0-based index of correct option for mcq, else 0")
    descriptiveAnswer: Optional[str] = Field(None, description="Expected answer guide for descriptive, else null")
    testcases: Optional[List[TestCase]] = Field(None, description="List of testcases for coding, else null")
    starterCode: Optional[Dict[str, str]] = Field(None, description="Language-specific starter templates {cpp, c, python, java, javascript}")
    language: Optional[str] = Field(None, description="Primary language hint for coding questions")
    marks: int = 1

class GeneratedQuiz(BaseModel):
    subject: str
    difficulty: str
    questions: List[QuestionSchema]

class GradingResult(BaseModel):
    score: int
    feedback: str
    strengths: str
    suggestions: str
    missing_concepts: List[str]

class GroundingCheckResult(BaseModel):
    grounded: bool
    reason: str

