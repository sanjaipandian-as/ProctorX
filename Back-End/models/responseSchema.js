import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema(
  {
    questionType: { type: String, required: true },
    questionText: { type: String, required: true },
    marks: { type: Number, required: true },
    obtainedMarks: { type: Number, default: 0 },

    options: [{ type: String }],
    studentAnswer: { type: String },
    correctAnswer: { type: String },
    isCorrect: { type: Boolean },

    descriptiveAnswer: { type: String },

    language: { type: String },
    codeSubmitted: { type: String },
    codeScore: { type: Number },

    testcases: [
      {
        input: { type: String },
        expectedOutput: { type: String },
        output: { type: String },
        passed: { type: Boolean }
      }
    ],
    isEvaluated: { type: Boolean, default: false }
  },
  { _id: false }
)

export default responseSchema;