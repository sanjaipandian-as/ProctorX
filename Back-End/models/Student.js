const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "student" },
    registeredExams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }],
    results: [
      {
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
        score: { type: Number },
        timeTaken: { type: Number },
        submittedAt: { type: Date },
      },
    ],
    lastLogin: { type: Date },
    profilePicture: { type: String },
    isActive: { type: Boolean, default: true },
    attemptedQuizzes: [
      {
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
        hasAttempted: { type: Boolean, default: false }
      }
    ]

  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
