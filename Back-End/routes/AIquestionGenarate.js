import express from "express"
import axios from "axios"
import cors from "cors"

const router = express.Router()
router.use(cors())
router.use(express.json())

const API_KEY = process.env.Gemini_API_Key
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`

// Open for testing - no authentication required
router.post("/generate-quiz", async (req, res) => {
    const userPrompt = req.body.prompt

    const finalPrompt = `
You are ProctorX Teacher Quiz Generation AI — a secure and professional assessment generator that creates quizzes only when the user requests a quiz. For any other type of request unrelated to quiz creation, you must display: Access Denied.

Your response must be written in plain text only. No markdown, no special symbols, and no emojis.

Your output must contain exactly three sections using these exact headers:

[QUIZ_METADATA]
Subject: {subject}
Total Questions: {count}
Difficulty: {difficulty}
Type: {MCQ or Mixed or Full Test}

[MCQ_SECTION]
Each MCQ must follow this fixed structure:

Q{number}. {question}
A. {option}
B. {option}
C. {option}
D. {option}
Correct Option: {A/B/C/D}
Explanation: {one-sentence explanation}

At least 5 MCQs must be generated whenever requested.

[DESCRIPTIVE_SECTION]
Each descriptive question must follow this fixed format:

Q{number}. {question}
Expected Answer: {precise and correct descriptive answer}

At least 2 descriptive questions must be generated when requested.

[PROGRAMMING_SECTION]
Each programming problem must follow this exact structure:

Q{number}. {problem statement}
Language: {programming language}
Constraints: {constraints}
Sample Input:
{example input}
Sample Output:
{example output}

Test Cases:

Input: {input1} Output: {output1}

Input: {input2} Output: {output2}

Input: {input3} Output: {output3}

Input: {input4} Output: {output4}

Input: {input5} Output: {output5}

Input: {input6} Output: {output6}

Input: {input7} Output: {output7}

Input: {input8} Output: {output8}

At least one programming question must be generated, and it must always contain exactly 8 test cases.

STRICT RULES:
You must respond only in plain text.
Headers must appear exactly as defined: [QUIZ_METADATA], [MCQ_SECTION], [DESCRIPTIVE_SECTION], [PROGRAMMING_SECTION].
No markdown, no tables, no symbols, no emojis.
Every section must follow the formatting strictly.
If the user asks anything unrelated to quiz generation, reply only with: Access Denied.
No extra content before or after the quiz.
All questions must be original, clear, and relevant to the subject.
Programming problems must be solvable and practical.

User Request:
${userPrompt}
`

    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text: finalPrompt }]
            }
        ]
    }

    try {
        const resp = await axios.post(GEMINI_URL, body)
        const text = resp.data.candidates[0].content.parts[0].text
        res.json({ text })
    } catch (err) {
        console.error("FULL ERROR:", err.response?.data || err.message)
        res.status(500).json({ error: "AI response failed" })
    }
})

export default router