const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema({
    quizId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    questions: [questionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    allowedStudents: { type: Number, required: true },
    otp: { type: String, length: 6 },
    otpExpiresAt: { type: Date },
    status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

quizSchema.index({ quizId: 1 }, { unique: true });

module.exports = mongoose.model("Quiz", quizSchema);
