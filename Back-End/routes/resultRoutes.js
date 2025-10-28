const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
const { isAuthenticatedUser } = require("../controllers/authController");

router.post("/submit", isAuthenticatedUser, async (req, res) => {
  try {
    const { quizId, timeTaken, warnings, penalties, answers } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role === "teacher" ? "Teacher" : "Student";

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers must be an array" });
    }

    const quiz = await Quiz.findOne({ quizId });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    const existingResult = await Result.findOne({
      quiz: quiz._id,
      user: userId,
      userModel: userRole,
    });

    if (existingResult && userRole === "Student") {
      return res.status(400).json({
        message: "You have already submitted this quiz. Please contact your teacher for a retake.",
      });
    }

    let score = 0;
    const detailedResponses = quiz.questions.map((question, index) => {
      const studentAnswerIndex = answers[index] ?? null;
      const isCorrect =
        studentAnswerIndex !== null &&
        studentAnswerIndex === question.correctAnswer;

      if (isCorrect) score++;

      return {
        questionText: question.questionText,
        options: question.options,
        studentAnswer:
          studentAnswerIndex !== null && question.options[studentAnswerIndex] !== undefined
            ? question.options[studentAnswerIndex]
            : "Not Answered",
        correctAnswer: question.options[question.correctAnswer] ?? "N/A",
        isCorrect,
      };
    });

    const totalQuestions = quiz.questions.length;
    const accuracy = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const newResult = new Result({
      quiz: quiz._id,
      user: userId,
      userModel: userRole,
      score,
      totalQuestions,
      accuracy,
      timeTaken,
      warnings,
      penalties,
      responses: detailedResponses,
    });

    await newResult.save();
    res
      .status(201)
      .json({ message: "Result submitted successfully", resultId: newResult._id });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Submission failed due to validation errors.",
        errors: error.errors,
      });
    }
    console.error("Error submitting result:", error);
    res
      .status(500)
      .json({ message: "Error submitting result", error: error.message });
  }
});

router.get("/my-results", isAuthenticatedUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role === "teacher" ? "Teacher" : "Student";

    const results = await Result.find({
      user: userId,
      userModel: userRole,
    })
      .populate("quiz", "title quizId")
      .sort({ createdAt: -1 });

    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching my results:", error);
    res.status(500).json({ message: "Error fetching results", error: error.message });
  }
});



router.get("/quiz/:quizId", isAuthenticatedUser, async (req, res) => {
  try {
    const quizDocument = await Quiz.findOne({ quizId: req.params.quizId });
    if (!quizDocument) return res.status(404).json({ message: "Quiz not found" });
    const results = await Result.find({ quiz: quizDocument._id }).populate("user", "name email");
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Error fetching results", error: error.message });
  }
});

router.get("/user/:userId", isAuthenticatedUser, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId))
      return res.status(400).json({ message: "Invalid user ID" });
    const results = await Result.find({ user: req.params.userId }).populate("quiz", "title");
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user results", error: error.message });
  }
});

router.get("/check/:quizId", isAuthenticatedUser, async (req, res) => {
  try {
    const quizDocument = await Quiz.findOne({ quizId: req.params.quizId });
    if (!quizDocument) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    const existingResult = await Result.findOne({
      quiz: quizDocument._id,
      user: req.user.id,
      userModel: req.user.role === "teacher" ? "Teacher" : "Student",
    });
    if (existingResult) {
      return res.status(200).json({ exists: true, resultId: existingResult._id });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: "Error checking result", error: error.message });
  }
});

router.get("/:id", isAuthenticatedUser, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid result ID" });
    const result = await Result.findById(req.params.id).populate("quiz", "title").populate("user", "name email");
    if (!result)
      return res.status(404).json({ message: "Result not found" });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({ message: "Error fetching result", error: error.message });
  }
});

router.delete("/:id", isAuthenticatedUser, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid result ID" });
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.status(200).json({ message: "Result deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting result", error: error.message });
  }
});

router.delete("/results/:resultId", isAuthenticatedUser, async (req, res) => {
  try {
    const { resultId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return res.status(400).json({ message: "Invalid result ID" });
    }

    const result = await Result.findById(resultId);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    const quiz = await Quiz.findById(result.quiz);
    if (!quiz) {
      return res.status(404).json({ message: "Associated quiz not found" });
    }

    if (quiz.creator.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "Forbidden: You are not the owner of this quiz and cannot delete this result." 
      });
    }

    await Result.findByIdAndDelete(resultId);

    res.status(200).json({ message: "Student result deleted successfully" });

  } catch (error) {
    console.error("Error in deleting result:", error);
    res.status(500).json({ message: "Error deleting result", error: error.message });
  }
});

module.exports = router;

