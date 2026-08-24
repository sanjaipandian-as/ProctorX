"""
Quiz Generation Service — powered by NVIDIA NIM (Llama 3.3 70B).

Pipeline:
  1. Build context from Qdrant RAG chunks (if documentId provided)
  2. Generate structured JSON quiz via LLM (primary → fallback)
  3. Grounding check: reject questions not supported by context
  4. Duplicate detection: cosine similarity on question embeddings
  5. Starter code generation: for each coding question (parallel)
"""

import json
import math
import asyncio
from fastapi import HTTPException
from app.services.nvidia_client import nvidia_client
from app.schemas.schemas import GeneratedQuiz, QuestionSchema
from app.config import settings

# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

QUIZ_SYSTEM_INSTRUCTION = """You are an academic assessment compiler. Your task is to compile a structured quiz in JSON format based STRICTLY on the user's topic and specifications.

You MUST respond ONLY with a raw JSON object matching this exact schema:
{
  "subject": "<subject topic name>",
  "difficulty": "<Easy | Medium | Hard>",
  "questions": [
    {
      "questionText": "<question text>",
      "questionType": "mcq",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correctAns": 0,
      "marks": 1
    },
    {
      "questionText": "<descriptive question text>",
      "questionType": "descriptive",
      "descriptiveAnswer": "<key assessment points that must be covered>",
      "marks": 5
    },
    {
      "questionText": "<coding problem statement with clear input/output spec>",
      "questionType": "coding",
      "testcases": [
        {"input": "<test input 1>", "output": "<expected output 1>", "hidden": false},
        {"input": "<test input 2>", "output": "<expected output 2>", "hidden": false},
        {"input": "<test input 3>", "output": "<expected output 3>", "hidden": false},
        {"input": "<test input 4>", "output": "<expected output 4>", "hidden": false},
        {"input": "<test input 5>", "output": "<expected output 5>", "hidden": false},
        {"input": "<test input 6>", "output": "<expected output 6>", "hidden": false},
        {"input": "<test input 7>", "output": "<expected output 7>", "hidden": false},
        {"input": "<test input 8>", "output": "<expected output 8>", "hidden": false},
        {"input": "<test input 9>", "output": "<expected output 9>", "hidden": false},
        {"input": "<test input 10>", "output": "<expected output 10>", "hidden": true}
      ],
      "marks": 10
    }
  ]
}

CRITICAL RULES:
1. STRICT TOPIC ALIGNMENT: You must design all questions around the EXACT topic requested in the user prompt. For example, if the prompt is about 'Trees and Graphs', the coding question MUST be about tree/graph traversal, tree height, BST insertion, etc. Do NOT fallback to generic questions like palindromes, fibonacci, or string lengths unless the prompt specifically asks for them. If the topic is broad, select a specific sub-topic that aligns with the requested difficulty.
2. If context is provided, every question MUST be directly answerable from it.
3. MCQ questions must have EXACTLY 4 options. correctAns is the 0-based index (0=A).
4. Coding problems MUST have EXACTLY 10 test cases. Mark the last test case as hidden=true, all others hidden=false. Ensure all 10 test cases match the actual problem input/output specification.
5. Descriptive answers must list key concepts, not just a single phrase.
6. Output ONLY the JSON object — no markdown fences, no explanation text.
"""

GROUNDING_SYSTEM_PROMPT = """You are a RAG grounding validator. Determine if the given question is supported by the context.
Output ONLY a JSON object: {"grounded": true or false, "reason": "brief explanation"}"""

STARTER_CODE_SYSTEM_PROMPT = """You are an expert competitive programming coach.
Generate minimal starter code templates for the given coding problem in 5 languages.
Output ONLY a JSON object with exactly these keys: cpp, c, python, java, javascript.
Each value is a complete, compilable starter template with:
- Correct imports/headers
- The function or main() skeleton appropriate for reading the described input
- A single TODO comment where the solution logic goes
- NO solution logic whatsoever
Keep each template under 15 lines."""


# ---------------------------------------------------------------------------
# Utility: Cosine similarity
# ---------------------------------------------------------------------------

def _cosine_similarity(v1: list[float], v2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    mag1 = math.sqrt(sum(a * a for a in v1))
    mag2 = math.sqrt(sum(b * b for b in v2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)


# ---------------------------------------------------------------------------
# Step 3: Grounding check
# ---------------------------------------------------------------------------

async def check_question_grounding(question_text: str, context_chunks: list[str]) -> bool:
    """Uses LLM to verify if a question is supported by the RAG context chunks."""
    if not context_chunks:
        return True

    context_str = "\n---\n".join(context_chunks)
    user_prompt = f"Context:\n{context_str}\n\nQuestion:\n{question_text}"
    try:
        response = await nvidia_client.chat_completion_with_fallback(
            system_instruction=GROUNDING_SYSTEM_PROMPT,
            prompt=user_prompt,
            json_mode=True,
            allow_fallback=True
        )
        content = response["choices"][0]["message"]["content"].strip()
        data = json.loads(content)
        return bool(data.get("grounded", False))
    except Exception as e:
        print(f"[quiz_gen] Grounding check error: {e}")
        return True  # Fail open: don't discard questions on checker failure


# ---------------------------------------------------------------------------
# Step 4: Duplicate detection
# ---------------------------------------------------------------------------

async def filter_duplicate_questions(questions: list[QuestionSchema]) -> list[QuestionSchema]:
    """Removes semantically duplicate questions using embedding cosine similarity (> 0.85)."""
    if not questions:
        return []

    texts = [q.questionText for q in questions]
    try:
        embeddings = await nvidia_client.get_embeddings(texts)
    except Exception as e:
        print(f"[quiz_gen] Embeddings failed for duplicate detection: {e}")
        return questions

    unique_questions: list[QuestionSchema] = []
    unique_embeddings: list[list[float]] = []

    for q, emb in zip(questions, embeddings):
        is_dup = any(_cosine_similarity(emb, saved) > 0.85 for saved in unique_embeddings)
        if is_dup:
            print(f"[quiz_gen] Duplicate detected: '{q.questionText[:60]}...'")
        else:
            unique_questions.append(q)
            unique_embeddings.append(emb)

    return unique_questions


# ---------------------------------------------------------------------------
# Step 5: Starter code generation (for coding questions)
# ---------------------------------------------------------------------------

_STARTER_CODE_DEFAULTS = {
    "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // TODO: read input and implement solution\n    return 0;\n}",
    "c": "#include <stdio.h>\n\nint main() {\n    // TODO: read input and implement solution\n    return 0;\n}",
    "python": "# TODO: read input and implement solution\nimport sys\ninput = sys.stdin.readline\n",
    "java": "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // TODO: read input and implement solution\n    }\n}",
    "javascript": "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n// TODO: parse lines and implement solution\n"
}

async def generate_starter_code(question_text: str, sample_input: str, sample_output: str) -> dict[str, str]:
    """Generates language-specific starter code templates for a coding question."""
    user_prompt = (
        f"Problem: {question_text}\n"
        f"Sample Input: {sample_input}\n"
        f"Sample Output: {sample_output}"
    )
    try:
        response = await nvidia_client.chat_completion_with_fallback(
            system_instruction=STARTER_CODE_SYSTEM_PROMPT,
            prompt=user_prompt,
            json_mode=True,
            allow_fallback=True
        )
        content = response["choices"][0]["message"]["content"].strip()
        data = json.loads(content)
        # Ensure all 5 keys exist — fill with defaults for any missing language
        result = {}
        for lang in ["cpp", "c", "python", "java", "javascript"]:
            result[lang] = data.get(lang) or _STARTER_CODE_DEFAULTS[lang]
        return result
    except Exception as e:
        print(f"[quiz_gen] Starter code generation failed: {e}. Using defaults.")
        return _STARTER_CODE_DEFAULTS.copy()


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

MCQ_DESC_SYSTEM_PROMPT = """You are an academic assessment compiler. Your task is to compile MCQs and descriptive questions in JSON format based on the topic.

You are ONLY allowed to generate quizzes on academic, descriptive, and programming topics.
CRITICAL SAFETY & CONTEXT RULE:
If the user's prompt is completely unrelated to quiz generation, or is asking generic questions, conversational questions, or is out of context for an academic quiz (for example, "how do I bake a cake", "tell me a joke", "write a poem", "who are you", etc.), you MUST return a JSON object with this exact structure and NOTHING else:
{
  "out_of_context": true,
  "reason": "This request is out of context. I can only assist with academic, descriptive, and programming quiz generation."
}

Otherwise, you MUST respond ONLY with a raw JSON object matching this exact schema:
{
  "subject": "<specific academic subject name, e.g., 'Operating Systems' or 'Linear Algebra' or 'Data Structures'. Must be a clean, clear, descriptive, professional title directly representing the core academic topic of the source content, NOT a generic placeholder like 'AI Quiz' or 'Study Material Quiz'>",
  "difficulty": "<Easy | Medium | Hard>",
  "questions": [
    {
      "questionText": "<question text>",
      "questionType": "mcq",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correctAns": 0,
      "marks": 1
    },
    {
      "questionText": "<descriptive question text>",
      "questionType": "descriptive",
      "descriptiveAnswer": "<key assessment points that must be covered>",
      "marks": 5
    }
  ]
}

Important Rules:
1. STRICT TOPIC ALIGNMENT: Align all questions with the user's prompt.
2. MCQ must have exactly 4 options. correctAns is 0-based index.
3. Descriptive answers must list key concepts.
4. Output ONLY the JSON object — no markdown formatting.
"""

SINGLE_CODING_SYSTEM_PROMPT = """You are an academic assessment compiler. Your task is to generate a SINGLE coding question in JSON format based on the topic.

You are ONLY allowed to generate quizzes on academic, descriptive, and programming topics.
CRITICAL SAFETY & CONTEXT RULE:
If the user's prompt is completely unrelated to quiz generation, or is asking generic questions, conversational questions, or is out of context for an academic quiz (for example, "how do I bake a cake", "tell me a joke", "write a poem", "who are you", etc.), you MUST return a JSON object with this exact structure and NOTHING else:
{
  "out_of_context": true,
  "reason": "This request is out of context. I can only assist with academic, descriptive, and programming quiz generation."
}

Otherwise, you MUST respond ONLY with a raw JSON object matching this exact schema:
{
  "subject": "<specific academic subject name, e.g., 'Operating Systems' or 'Linear Algebra' or 'Data Structures'. Must be a clean, clear, descriptive, professional title directly representing the core academic topic of the source content, NOT a generic placeholder like 'AI Quiz' or 'Study Material Quiz'>",
  "questionText": "<coding problem statement with clear input/output spec>",
  "questionType": "coding",
  "testcases": [
    {"input": "<test input 1>", "output": "<expected output 1>", "hidden": false},
    {"input": "<test input 2>", "output": "<expected output 2>", "hidden": false},
    {"input": "<test input 3>", "output": "<expected output 3>", "hidden": false},
    {"input": "<test input 4>", "output": "<expected output 4>", "hidden": false},
    {"input": "<test input 5>", "output": "<expected output 5>", "hidden": false},
    {"input": "<test input 6>", "output": "<expected output 6>", "hidden": false},
    {"input": "<test input 7>", "output": "<expected output 7>", "hidden": false},
    {"input": "<test input 8>", "output": "<expected output 8>", "hidden": false},
    {"input": "<test input 9>", "output": "<expected output 9>", "hidden": false},
    {"input": "<test input 10>", "output": "<expected output 10>", "hidden": true}
  ],
  "marks": 10
}

Important Rules:
1. STRICT TOPIC ALIGNMENT: Align the question with the user's prompt.
2. You MUST write EXACTLY 10 test cases. Mark the last test case as hidden=true, all others hidden=false.
3. Test case inputs and outputs must represent valid, correct scenarios for the problem.
4. Output ONLY the JSON object — no markdown formatting.
"""


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def generate_quiz_content(
    user_prompt: str,
    context_chunks: list[str] | None = None,
    num_mcq: int | None = None,
    num_descriptive: int | None = None,
    num_coding: int | None = None,
    difficulty: str | None = None,
) -> GeneratedQuiz:
    """
    Modular quiz generation pipeline:
    1. Generates MCQ & Descriptive questions in one LLM call
    2. Generates Coding questions individually in parallel (prevents output token limits from truncating JSON)
    3. Runs grounding validation
    4. Runs duplicate filtering
    5. Generates starter templates for coding tasks in parallel
    """
    subject = "AI Generated Quiz"
    target_difficulty = difficulty or "Medium"
    final_questions = []

    # 1. Base Prompt Construction
    base_prompt = ""
    if context_chunks:
        base_prompt += "Context from study materials (use this as the primary source):\n"
        for i, chunk in enumerate(context_chunks):
            base_prompt += f"--- Source {i + 1} ---\n{chunk}\n"
        base_prompt += "\n"
    base_prompt += f"Topic/Prompt: {user_prompt}\n"
    if difficulty:
        base_prompt += f"Difficulty: {difficulty}\n"

    # 2. Phase A: MCQ & Descriptive Generation
    mcq_limit = min(num_mcq or 0, settings.MAX_MCQ)
    desc_limit = min(num_descriptive or 0, settings.MAX_DESCRIPTIVE)
    if mcq_limit > 0 or desc_limit > 0:
        mcq_desc_prompt = base_prompt + f"\nRequirements:\n- Generate exactly {mcq_limit} MCQ questions.\n- Generate exactly {desc_limit} Descriptive questions."
        try:
            res = await nvidia_client.chat_completion_with_fallback(
                system_instruction=MCQ_DESC_SYSTEM_PROMPT,
                prompt=mcq_desc_prompt,
                json_mode=True,
                allow_fallback=True
            )
            content = res["choices"][0]["message"]["content"].strip()
            data = json.loads(content)
        except Exception as e:
            print(f"[quiz_gen] MCQ/Desc generation failed: {e}")
            data = {}

        if data.get("out_of_context") is True:
            raise HTTPException(
                status_code=400,
                detail=data.get("reason", "This request is out of context. I can only assist with academic, descriptive, and programming quiz generation.")
            )

        subject = data.get("subject") or subject
        target_difficulty = data.get("difficulty") or target_difficulty
        if data.get("questions"):
            for q_data in data["questions"]:
                final_questions.append(QuestionSchema.model_validate(q_data))

    # 3. Phase B: Coding Questions Generation (Executed individually in parallel)
    coding_limit = min(num_coding or 0, settings.MAX_CODING)
    if coding_limit > 0:
        async def _gen_single_coding(index: int) -> tuple[QuestionSchema | None, str | None]:
            coding_prompt = base_prompt + f"\nRequirements:\n- Generate exactly 1 coding question (Problem #{index+1}).\n- Must contain exactly 10 test cases."
            try:
                res = await nvidia_client.chat_completion_with_fallback(
                    system_instruction=SINGLE_CODING_SYSTEM_PROMPT,
                    prompt=coding_prompt,
                    json_mode=True,
                    allow_fallback=True
                )
                content = res["choices"][0]["message"]["content"].strip()
                data = json.loads(content)
            except Exception as e:
                print(f"[quiz_gen] Coding question #{index+1} generation failed: {e}")
                data = {}

            if data.get("out_of_context") is True:
                raise HTTPException(
                    status_code=400,
                    detail=data.get("reason", "This request is out of context. I can only assist with academic, descriptive, and programming quiz generation.")
                )

            if not data:
                return None, None
            extracted_subject = data.get("subject")
            return QuestionSchema.model_validate(data), extracted_subject

        coding_tasks = [_gen_single_coding(i) for i in range(coding_limit)]
        coding_results = await asyncio.gather(*coding_tasks)
        for q, ext_subject in coding_results:
            if q:
                final_questions.append(q)
                if subject == "AI Generated Quiz" and ext_subject:
                    subject = ext_subject

    # Combine into GeneratedQuiz structure
    quiz = GeneratedQuiz(
        subject=subject,
        difficulty=target_difficulty,
        questions=final_questions
    )

    # 4. Grounding Check (if context present)
    if context_chunks:
        grounded_questions = []
        for q in quiz.questions:
            is_grounded = await check_question_grounding(q.questionText, context_chunks)
            if is_grounded:
                grounded_questions.append(q)
            else:
                print(f"[quiz_gen] Rejected (not grounded): '{q.questionText[:60]}...'")
        quiz.questions = grounded_questions

    # 5. Duplicate Detection
    quiz.questions = await filter_duplicate_questions(quiz.questions)

    # 6. Generate starter code templates for all coding questions in parallel
    coding_questions = [q for q in quiz.questions if q.questionType == "coding"]
    if coding_questions:
        async def _enrich_with_starter(q: QuestionSchema) -> None:
            sample_input = q.testcases[0].input if q.testcases else ""
            sample_output = q.testcases[0].output if q.testcases else ""
            q.starterCode = await generate_starter_code(q.questionText, sample_input, sample_output)

        await asyncio.gather(*[_enrich_with_starter(q) for q in coding_questions])

    return quiz


# ---------------------------------------------------------------------------
# Step 6: Individual Question Regeneration
# ---------------------------------------------------------------------------

REGEN_SYSTEM_PROMPT = """You are an academic assessment editor. Your task is to update or edit the given question JSON according to the teacher's instructions.

You MUST respond ONLY with a raw JSON object matching this schema:
{
  "questionText": "<question text>",
  "questionType": "<mcq | descriptive | coding>",
  "imageUrl": "<optional existing image URL or null>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "correctAns": 0,
  "descriptiveAnswer": "<key assessment points>",
  "testcases": [
    {"input": "<test input 1>", "output": "<expected output 1>", "hidden": false},
    {"input": "<test input 10>", "output": "<expected output 10>", "hidden": true}
  ],
  "marks": 5
}

Important Rules:
1. STRICT ADHERENCE TO INSTRUCTION: You must modify the question details (problem description, options, correct answer, or test cases) to strictly match the teacher's edit instructions. If the instruction says "change to a binary tree question" or "make it about matrix multiplication", you MUST completely overwrite the questionText, options, and testcases with the new binary tree or matrix multiplication question. Do NOT retain any of the old topic's question text.
2. If MCQ: options must have EXACTLY 4 strings, correctAns must be 0-based index (0-3).
3. If Descriptive: descriptiveAnswer must cover key assessment criteria.
4. If Coding: testcases MUST have EXACTLY 10 test cases; the last one marked hidden=true. Ensure the inputs/outputs represent valid scenarios for the newly generated question.
5. Output ONLY the JSON object — no markdown formatting or extra explanation text.
"""

async def regenerate_single_question(
    question_data: dict,
    prompt: str,
    difficulty: str | None = None,
    context_chunks: list[str] | None = None
) -> QuestionSchema:
    """Uses LLM to edit/regenerate a single question based on teacher instructions."""
    
    # Build prompt
    full_prompt = f"Original Question JSON:\n{json.dumps(question_data, indent=2)}\n\n"
    
    if context_chunks:
        full_prompt += "Context from study materials:\n"
        for i, chunk in enumerate(context_chunks):
            full_prompt += f"--- Source {i + 1} ---\n{chunk}\n"
        full_prompt += "\n"
        
    if difficulty:
        full_prompt += f"Target Difficulty: {difficulty}\n"
        
    full_prompt += f"Teacher Instruction for Edit: {prompt}"
    
    response = await nvidia_client.chat_completion_with_fallback(
        system_instruction=REGEN_SYSTEM_PROMPT,
        prompt=full_prompt,
        json_mode=True,
        allow_fallback=True
    )
    
    content = response["choices"][0]["message"]["content"].strip()
    updated_data = json.loads(content)
    updated_q = QuestionSchema.model_validate(updated_data)
    
    # If coding question, enrich with starter code templates
    if updated_q.questionType == "coding":
        sample_input = updated_q.testcases[0].input if updated_q.testcases else ""
        sample_output = updated_q.testcases[0].output if updated_q.testcases else ""
        updated_q.starterCode = await generate_starter_code(updated_q.questionText, sample_input, sample_output)
        
    return updated_q

