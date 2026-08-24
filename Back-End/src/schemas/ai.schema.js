const { z } = require('zod');

// ---------------------------------------------------------------------------
// Shared question schema used in both generate-quiz and save-quiz flows
// ---------------------------------------------------------------------------

const testCaseSchema = z.object({
  input: z.string(),
  output: z.string(),
  hidden: z.boolean().optional().default(false),
});

const questionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  questionType: z.enum(['mcq', 'descriptive', 'coding']),
  imageUrl: z.string().url('Invalid image URL format').optional().nullable(),
  options: z.array(z.string()).length(4).optional().nullable(),
  correctAns: z.number().int().min(0).max(3).optional().nullable(),
  descriptiveAnswer: z.string().optional().nullable(),
  testcases: z.array(testCaseSchema).optional().nullable(),
  starterCode: z.record(z.string()).optional().nullable(), // { cpp, c, python, java, javascript }
  language: z.string().optional().nullable(),
  marks: z.number().int().min(1).max(100).default(1),
});

// ---------------------------------------------------------------------------
// POST /api/ai/generate-quiz
// ---------------------------------------------------------------------------

const generateQuizSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(1000, 'Prompt must not exceed 1000 characters'),
  documentId: z.string().uuid('Invalid documentId format').optional().nullable(),
  numMcq: z.number().int().min(0).max(20).optional(),
  numDescriptive: z.number().int().min(0).max(10).optional(),
  numCoding: z.number().int().min(0).max(5).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/ai/regenerate-question
// ---------------------------------------------------------------------------

const regenerateQuestionSchema = z.object({
  question: questionSchema,
  prompt: z
    .string()
    .min(3, 'Refinement instruction is too short')
    .max(500, 'Refinement instruction must not exceed 500 characters'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().nullable(),
  documentId: z.string().uuid('Invalid documentId format').optional().nullable(),
});

// ---------------------------------------------------------------------------
// POST /api/ai/save-quiz
// ---------------------------------------------------------------------------

const saveQuizSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  durationInMinutes: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(360, 'Duration cannot exceed 6 hours'),
  questions: z
    .array(questionSchema)
    .min(1, 'At least 1 question is required')
    .max(50, 'Maximum 50 questions per quiz'),
  documentId: z.string().uuid().optional().nullable(),
  aiModel: z.string().optional().nullable(),
  aiPromptVersion: z.string().optional().nullable(),
  allowedStudents: z.array(z.string().email()).optional(),
  classroomId: z.string().uuid().optional().nullable(),
});

module.exports = { generateQuizSchema, regenerateQuestionSchema, saveQuizSchema, questionSchema };
