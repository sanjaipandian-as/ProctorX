const mongoose = require("mongoose");

const warningSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
        type: String, 
        enum: ["cheating", "late", "distraction", "other"], // predefined types
        required: true 
    },
    count: { type: Number, default: 1 },
    lastWarningAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Warning", warningSchema);
