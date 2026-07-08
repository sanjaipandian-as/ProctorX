const { z } = require('zod');

const submitResultSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
  answers: z.array(
    z.object({
      questionText: z.string().min(1),
      studentAnswer: z.string() // The text of the option chosen by student
    })
  ),
  timeTaken: z.number().int().nonnegative().default(0),
  warnings: z.number().int().nonnegative().default(0),
  penalties: z.number().int().nonnegative().default(0)
});

module.exports = {
  submitResultSchema
};
