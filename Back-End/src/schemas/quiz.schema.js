const { z } = require('zod');

const testcaseSchema = z.object({
  input: z.string().default(""),
  output: z.string().default(""),
  hidden: z.boolean().optional().default(false)
});

const starterCodeSchema = z.object({
  python: z.string().optional().default(""),
  javascript: z.string().optional().default(""),
  java: z.string().optional().default(""),
  cpp: z.string().optional().default("")
}).optional();

const questionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  questionType: z.enum(['mcq', 'descriptive', 'coding']).default('mcq'),
  options: z.array(z.string()).optional().default([]),
  correctAns: z.number().int().nonnegative().optional().default(0),
  descriptiveAnswer: z.string().optional().nullable(),
  testcases: z.array(testcaseSchema).optional().nullable(),
  starterCode: starterCodeSchema.optional(),
  marks: z.number().int().positive().default(1),
  order: z.number().int().nonnegative()
});

const createQuizSchema = z.object({
  title: z.string().min(2, 'Quiz title must be at least 2 characters'),
  durationInMinutes: z.number().int().positive('Duration must be at least 1 minute').default(60),
  allowedStudents: z.array(z.string().email('Invalid email')).optional().default([]),
  classroomId: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  autoStart: z.boolean().optional(),
  documentId: z.string().nullable().optional(),
  aiModel: z.string().nullable().optional(),
  aiPromptVersion: z.string().nullable().optional(),
  questions: z.array(questionSchema).min(1, 'Quiz must have at least one question')
});

module.exports = {
  createQuizSchema
};
