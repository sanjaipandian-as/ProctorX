const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: [{ type: String }],
    studentAnswer: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userModel", 
    },
    userModel: {
      type: String,
      required: true,
      enum: ["Student", "Teacher"], 
    },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    warnings: { type: Number, default: 0 },
    penalties: { type: Number, default: 0 },
    responses: [responseSchema],
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Result", resultSchema);
