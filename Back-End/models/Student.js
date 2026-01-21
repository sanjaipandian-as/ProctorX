import mongoose from 'mongoose';

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
        totalMarks: { type: Number }
      }
    ],

    lastLogin: { type: Date },
    profilePicture: { type: String },
    isActive: { type: Boolean, default: true },

    attemptedQuizzes: [
      {
        quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
        status: {
          type: String,
          enum: ['not_started', 'started', 'in_progress', 'submitted'],
          default: 'not_started'
        },
        startedAt: { type: Date },
        lastSync: { type: Date },
        currentWarnings: { type: Number, default: 5 },
        savedAnswers: [mongoose.Schema.Types.Mixed],
        violationLogs: [mongoose.Schema.Types.Mixed]
      }
    ]
  },
  { timestamps: true }
)

export default mongoose.model("Student", studentSchema);