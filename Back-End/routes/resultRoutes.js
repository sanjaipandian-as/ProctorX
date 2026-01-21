import express from 'express';
import mongoose from 'mongoose';
import Result from '../models/Result.js';
import Quiz from '../models/Quiz.js';
import Student from '../models/Student.js';
import { isAuthenticatedUser } from '../controllers/authController.js';

const router = express.Router();

router.post("/submit", isAuthenticatedUser, async (req, res) => {
  try {
    const { quizId, warnings, penalties, answers, violations } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role === "teacher" ? "Teacher" : "Student";

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: "Answers must be an array" });
    }

    const quiz = await Quiz.findOne({ quizId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const existingResult = await Result.findOne({
      quiz: quiz._id,
      user: userId,
      userModel: userRole
    });

    if (existingResult && userRole === "Student") {
      return res.status(400).json({ message: "You have already submitted this quiz." });
    }

    let totalScore = 0;

    const detailedResponses = quiz.questions.map((question, index) => {
      const ans = answers[index];
      const marks = Number(question.marks) || 0;
      let obtained = 0;

      if (question.questionType === "mcq") {
        const studentAnswerIndex = ans ?? null;
        const isCorrect =
          studentAnswerIndex !== null &&
          studentAnswerIndex === question.correctAnswer;

        obtained = isCorrect ? marks : 0;
        totalScore += obtained;

        return {
          questionType: "mcq",
          questionText: question.questionText,
          options: question.options,
          studentAnswer:
            studentAnswerIndex !== null &&
              question.options[studentAnswerIndex] !== undefined
              ? question.options[studentAnswerIndex]
              : "",
          correctAnswer: question.options[question.correctAnswer] ?? "",
          isCorrect,
          marks,
          obtainedMarks: obtained
        };
      }

      if (question.questionType === "descriptive") {
        const descriptiveAns = ans || "";
        return {
          questionType: "descriptive",
          questionText: question.questionText,
          descriptiveAnswer: descriptiveAns,
          studentAnswer: descriptiveAns,
          isCorrect: false,
          marks,
          obtainedMarks: 0
        };
      }

      if (question.questionType === "coding") {
        const submittedCode = ans?.code || "";
        const testcaseResults = [];
        let passedCount = 0;

        // Filter valid testcases just like the frontend
        const validTestcases = (question.testcases || []).filter(tc => tc.input || tc.output);

        validTestcases.forEach((tc, idx) => {
          let output = "";
          // Safe guard against null/undefined 'ans' or missing 'outputs'/'results'
          if (ans && ans.outputs && typeof ans.outputs[tc.input] !== 'undefined') {
            output = String(ans.outputs[tc.input]);
          } else if (ans && ans.results && Array.isArray(ans.results) && ans.results[idx]) {
            output = String(ans.results[idx].output || "");
          }

          const passed = output.trim() === (tc.output || "").trim();
          if (passed) passedCount++;

          testcaseResults.push({
            input: tc.input,
            expectedOutput: tc.output,
            output,
            passed
          });
        });

        const totalTC = testcaseResults.length;

        // Custom marking scheme based on passed test cases
        const markingScheme = {
          0: 0,
          1: 1,
          2: 3,
          3: 4,
          4: 5,
          5: 6,
          6: 8,
          7: 9,
          8: 10
        };

        if (totalTC <= 8) {
          obtained = markingScheme[passedCount] ?? 0;
        } else {
          obtained = totalTC > 0 ? Math.round((passedCount / totalTC) * marks) : 0;
        }

        totalScore += obtained;

        return {
          questionType: "coding",
          questionText: question.questionText,
          language: ans?.language || "python",
          codeSubmitted: submittedCode,
          codeScore: obtained,
          testcases: testcaseResults,
          marks,
          obtainedMarks: obtained,
          isCorrect: totalTC > 0 && passedCount === totalTC
        };
      }

      // Default fallback for descriptive or other types
      return {
        questionType: question.questionType || "descriptive",
        questionText: question.questionText,
        studentAnswer: ans?.answer || ans || "",
        isCorrect: false, // Descriptive is manually graded
        marks,
        obtainedMarks: 0
      };
    });

    const totalQuestions = quiz.questions.length;
    const maxMarks = quiz.questions.reduce((a, b) => a + Number(b.marks || 0), 0);
    const accuracy = maxMarks > 0 ? (totalScore / maxMarks) * 100 : 0;

    const newResult = new Result({
      quiz: quiz._id,
      user: userId,
      userModel: userRole,
      score: totalScore,
      totalQuestions,
      accuracy,
      warnings: warnings || 0,
      penalties: penalties || 0,
      responses: detailedResponses,
      violations: violations || []
    });

    await newResult.save();

    if (userRole === "Student") {
      await Student.findByIdAndUpdate(userId, {
        $push: {
          results: {
            quizId: quiz._id,
            score: totalScore,
            timeTaken: Number(req.body.timeTaken) || 0,
            submittedAt: new Date(),
            totalMarks: maxMarks
          }
        },
        $set: {
          "attemptedQuizzes.$[elem].status": "submitted"
        }
      }, {
        arrayFilters: [{ "elem.quizId": quiz._id }]
      });
    }

    res.status(201).json({
      message: "Result submitted successfully",
      resultId: newResult._id
    });
  } catch (error) {
    console.error("DEBUG: Submit route error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Submission failed.", errors: error.errors });
    }
    res.status(500).json({ message: "Error submitting result", error: error.message });
  }
});

router.get("/my-results", isAuthenticatedUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role === "teacher" ? "Teacher" : "Student";

    const results = await Result.find({
      user: userId,
      userModel: userRole
    })
      .populate("quiz", "title quizId")
      .sort({ createdAt: -1 });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Error fetching results", error: error.message });
  }
});

router.get("/teacher-stats", isAuthenticatedUser, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const quizzes = await Quiz.find({ createdBy: teacherId });
    const quizIds = quizzes.map(q => q._id);

    const results = await Result.find({ quiz: { $in: quizIds } });

    const totalAttempts = results.length;

    // Calculate total possible marks across all attempts to get real average %
    let totalMarksObtained = 0;
    let totalPossibleMarksAcrossAttempts = 0;
    let passingAttempts = 0;

    results.forEach(r => {
      totalMarksObtained += (r.score || 0);
      // We need to sum up marks from responses of each result
      const possible = r.responses?.reduce((acc, resp) => acc + (resp.marks || 0), 0) || 100;
      totalPossibleMarksAcrossAttempts += possible;

      if (possible > 0 && (r.score / possible) >= 0.5) {
        passingAttempts++;
      }
    });

    const averageScore = totalPossibleMarksAcrossAttempts > 0
      ? ((totalMarksObtained / totalPossibleMarksAcrossAttempts) * 100).toFixed(1)
      : 0;

    const successRate = totalAttempts > 0
      ? ((passingAttempts / totalAttempts) * 100).toFixed(1)
      : 0;

    // Get stats per quiz
    const quizStats = {};
    quizzes.forEach(q => {
      quizStats[q._id.toString()] = { attempts: 0, totalMarks: 0, totalPossible: 0, passing: 0 };
    });

    results.forEach(r => {
      const qId = r.quiz.toString();
      if (quizStats[qId]) {
        quizStats[qId].attempts++;
        quizStats[qId].totalMarks += (r.score || 0);
        const possible = r.responses?.reduce((acc, resp) => acc + (resp.marks || 0), 0) || 100;
        quizStats[qId].totalPossible += possible;
        if (possible > 0 && (r.score / possible) >= 0.5) {
          quizStats[qId].passing++;
        }
      }
    });

    // Format per-quiz stats
    Object.keys(quizStats).forEach(id => {
      const s = quizStats[id];
      s.avgScore = s.totalPossible > 0 ? ((s.totalMarks / s.totalPossible) * 100).toFixed(0) + "%" : "0%";
      s.successRate = s.attempts > 0 ? ((s.passing / s.attempts) * 100).toFixed(0) + "%" : "0%";
    });

    res.status(200).json({
      totalAttempts,
      averageScore: `${averageScore}%`,
      successRate: `${successRate}%`,
      quizStats
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats", error: error.message });
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
    if (!quizDocument) return res.status(404).json({ message: "Quiz not found" });

    const existingResult = await Result.findOne({
      quiz: quizDocument._id,
      user: req.user.id,
      userModel: req.user.role === "teacher" ? "Teacher" : "Student"
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

    const result = await Result.findById(req.params.id)
      .populate("quiz", "title")
      .populate("user", "name email");

    if (!result) return res.status(404).json({ message: "Result not found" });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching result", error: error.message });
  }
});

router.post("/:id/update-marks", isAuthenticatedUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { responseIndex, marks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid result ID" });
    }

    const result = await Result.findById(id).populate("quiz");
    if (!result) return res.status(404).json({ message: "Result not found" });

    // Authorization check
    if (req.user.role !== "teacher" && result.quiz.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to grade this quiz" });
    }

    if (responseIndex < 0 || responseIndex >= result.responses.length) {
      return res.status(400).json({ message: "Invalid response index" });
    }

    // Update the marks for that specific response
    result.responses[responseIndex].obtainedMarks = marks;
    result.responses[responseIndex].isEvaluated = true;

    // For manual grading, we just mark it as evaluated (we can use isCorrect but for descriptive it's more about marks)
    // If the student gets same as total marks, we can mark as correct
    if (marks === result.responses[responseIndex].marks) {
      result.responses[responseIndex].isCorrect = true;
    } else if (marks === 0) {
      result.responses[responseIndex].isCorrect = false;
    }

    // Recalculate total score
    result.score = result.responses.reduce((acc, r) => acc + (r.obtainedMarks || 0), 0);

    // Recalculate accuracy
    const maxMarks = result.responses.reduce((acc, r) => acc + (r.marks || 0), 0);
    result.accuracy = maxMarks > 0 ? (result.score / maxMarks) * 100 : 0;

    await result.save();

    // Return populated result
    const updatedResult = await Result.findById(id).populate("quiz", "title").populate("user", "name email");
    res.status(200).json(updatedResult);
  } catch (error) {
    res.status(500).json({ message: "Error updating marks", error: error.message });
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
    if (!result) return res.status(404).json({ message: "Result not found" });

    const quiz = await Quiz.findById(result.quiz);
    if (!quiz) return res.status(404).json({ message: "Associated quiz not found" });

    if (!quiz.createdBy || quiz.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Forbidden: You are not the owner of this quiz" });
    }

    const studentId = result.user;
    const quizId = result.quiz;

    await Result.findByIdAndDelete(resultId);

    // Clean up student's attempt history so they can start fresh
    await Student.findByIdAndUpdate(studentId, {
      $pull: {
        results: { quizId: quizId },
        attemptedQuizzes: { quizId: quizId }
      }
    });

    res.status(200).json({ message: "Student result and attempt history deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting result", error: error.message });
  }
});

// --- Attempt Management ---

// Check attempt status
router.get("/attempt-status/:quizId", isAuthenticatedUser, async (req, res) => {
  try {
    const { quizId } = req.params;
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const quiz = await Quiz.findOne({ quizId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const attempt = student.attemptedQuizzes.find(a => a.quizId.toString() === quiz._id.toString());

    if (!attempt || attempt.status === 'not_started') {
      return res.json({ status: "not_started" });
    }

    if (attempt.status === 'submitted') {
      const resultExists = await Result.findOne({
        quiz: quiz._id,
        user: req.user.id,
        userModel: "Student"
      });

      if (resultExists) {
        return res.json({ status: "completed", resultId: resultExists._id });
      } else {
        // Inconsistency found: Status is submitted but no Result exists.
        // Downgrade to in_progress to allow recovery.
        attempt.status = 'in_progress';
        await student.save();
        // Continue to return in_progress below
      }
    }

    // Fix for missing startedAt (self-healing for old attempts)
    if (attempt.status === 'in_progress' && !attempt.startedAt) {
      attempt.startedAt = new Date();
      await student.save();
    }

    // Status is 'started' or 'in_progress'
    return res.json({
      status: "in_progress",
      startedAt: attempt.startedAt,
      warnings: attempt.currentWarnings,
      answers: attempt.savedAnswers,
      violations: attempt.violationLogs,
      durationInMinutes: quiz.durationInMinutes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start an attempt
router.post("/start-attempt/:quizId", isAuthenticatedUser, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { otp } = req.body;
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const quiz = await Quiz.findOne({ quizId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let attemptIndex = student.attemptedQuizzes.findIndex(a => a.quizId.toString() === quiz._id.toString());
    const isResuming = attemptIndex !== -1 && student.attemptedQuizzes[attemptIndex].status === 'in_progress';

    // If not resuming, we MUST verify OTP
    if (!isResuming) {
      if (!otp) return res.status(400).json({ message: "Security Code is required to start the assessment." });

      const otpString = otp.toString();
      const demoQuizzes = ['QZ708443', 'QZ840043', 'QZ303385', 'QZ588027'];
      const isDemoAccess = demoQuizzes.includes(quizId) && otpString === '000000';

      if (!isDemoAccess) {
        if (!quiz.otp || !quiz.otpExpiresAt) {
          return res.status(400).json({ message: 'A Security Code has not been generated for this quiz.' });
        }
        if (quiz.otpExpiresAt < new Date()) {
          return res.status(400).json({ message: 'The Security Code has expired.' });
        }
        if (quiz.otp.toString() !== otpString) {
          return res.status(400).json({ message: 'Invalid Security Code.' });
        }
      }
    }

    if (attemptIndex !== -1) {
      const currentStatus = student.attemptedQuizzes[attemptIndex].status;

      if (currentStatus === 'submitted') {
        const resultExists = await Result.findOne({
          quiz: quiz._id,
          user: req.user.id,
          userModel: "Student"
        });

        if (resultExists) {
          return res.status(400).json({ message: "Quiz already submitted" });
        } else {
          // Inconsistency: result missing. Allow starting/resuming.
          student.attemptedQuizzes[attemptIndex].status = 'in_progress';
          await student.save();
          // Proceed to return resumption
        }
      }

      // If status is 'not_started', update to 'in_progress'
      if (currentStatus === 'not_started') {
        student.attemptedQuizzes[attemptIndex].status = 'in_progress';
        student.attemptedQuizzes[attemptIndex].startedAt = new Date();
        await student.save();
      }

      return res.json({
        message: currentStatus === 'not_started' ? "Attempt started" : "Attempt resumed",
        startedAt: student.attemptedQuizzes[attemptIndex].startedAt
      });
    }

    // Create new attempt
    student.attemptedQuizzes.push({
      quizId: quiz._id,
      status: 'in_progress',
      startedAt: new Date(),
      currentWarnings: 5,
      savedAnswers: [],
      violationLogs: []
    });

    await student.save();
    res.json({ message: "Attempt started", startedAt: new Date() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync attempt state
router.post("/sync-attempt/:quizId", isAuthenticatedUser, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { warnings, answers, violations } = req.body;
    const student = await Student.findById(req.user.id);

    const quiz = await Quiz.findOne({ quizId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const attemptIndex = student.attemptedQuizzes.findIndex(a => a.quizId.toString() === quiz._id.toString());

    if (attemptIndex === -1) {
      return res.status(400).json({ message: "Attempt not started" });
    }

    student.attemptedQuizzes[attemptIndex].currentWarnings = warnings;
    student.attemptedQuizzes[attemptIndex].savedAnswers = answers;
    student.attemptedQuizzes[attemptIndex].violationLogs = violations;
    student.attemptedQuizzes[attemptIndex].lastSync = new Date();

    await student.save();
    res.json({ message: "State synced" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;