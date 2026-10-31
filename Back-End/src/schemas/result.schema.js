const { z } = require('zod');

const submitResultSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
  answers: z.array(
    z.object({
      questionText: z.string().min(1).max(5000),
      studentAnswer: z.string().max(10000) // The text of the option chosen by student
    })
  ).max(100),
  timeTaken: z.number().int().nonnegative().max(86400).default(0),
  warnings: z.number().int().nonnegative().max(1000).optional(),
  penalties: z.number().int().nonnegative().max(1000).optional()
});

const gradeResponseSchema = z.object({
  marksObtained: z.coerce.number().int().nonnegative().max(1000)
});

module.exports = {
  submitResultSchema,
  gradeResponseSchema
};
