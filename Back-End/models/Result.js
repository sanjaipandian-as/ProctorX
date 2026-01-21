import mongoose from 'mongoose';
import responseSchema from './responseSchema.js';

const resultSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userModel"
    },
    userModel: {
      type: String,
      required: true,
      enum: ["Student", "Teacher"]
    },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    warnings: { type: Number, default: 0 },
    penalties: { type: Number, default: 0 },
    responses: [responseSchema],
    violations: [{
      type: { type: String },
      message: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
)

export default mongoose.model("Result", resultSchema);