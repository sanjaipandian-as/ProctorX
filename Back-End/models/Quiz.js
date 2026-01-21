import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    questionType: { type: String, enum: ["mcq", "descriptive", "coding"], required: true },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: Number },
    descriptiveAnswer: { type: String },
    language: { type: String },
    starterCode: {
        python: { type: String, default: "" },
        javascript: { type: String, default: "" },
        java: { type: String, default: "" },
        cpp: { type: String, default: "" }
    },
    marks: { type: Number, required: true },
    testcases: [
        {
            input: { type: String },
            output: { type: String }
        }
    ]
})

const quizSchema = new mongoose.Schema({
    quizId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    questions: [questionSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    allowedStudents: { type: Number, required: true },
    durationInMinutes: { type: Number, default: 60 },
    otp: { type: String, length: 6 },
    otpExpiresAt: { type: Date },
    status: { type: String, enum: ["pending", "active", "completed"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
})

quizSchema.index({ quizId: 1 }, { unique: true })

export default mongoose.model("Quiz", quizSchema);