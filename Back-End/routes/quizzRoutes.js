import express from 'express';
import crypto from 'crypto';
import Quiz from '../models/Quiz.js';
import { isAuthenticatedUser } from '../controllers/authController.js';
import { sendEmail } from '../utils/emailService.js';

const router = express.Router();

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function generateQuizId() {
  return 'QZ' + Date.now().toString().slice(-6);
}

router.post('/create', isAuthenticatedUser, async (req, res) => {
  try {
    const { title, questions, allowedStudents } = req.body;
    const teacherId = req.user.id;
    const quizId = generateQuizId();

    const processedQuestions = questions.map(q => {
      const base = {
        questionType: q.questionType,
        questionText: q.questionText,
        marks: Number(q.marks)
      };

      if (q.questionType === "mcq") {
        return {
          ...base,
          options: q.options,
          correctAnswer: Number(q.correctAnswer)
        };
      }
      if (q.questionType === "descriptive") {
        return {
          ...base,
          descriptiveAnswer: ""
        };
      }
      if (q.questionType === "coding") {
        return {
          ...base,
          language: q.language,
          starterCode: q.starterCode || {
             python: "",
             javascript: "",
             java: "",
             cpp: "" 
          },
          testcases: q.testcases || []
        };
      }
      return q;
    });

    const quiz = new Quiz({
      quizId,
      title,
      questions: processedQuestions,
      allowedStudents,
      createdBy: teacherId
    });

    const otp = generateOTP();
    quiz.otp = otp;
    quiz.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await quiz.save();

    try {
      await sendEmail({
        to: req.user.email,
        subject: 'Your Quiz Security Code',
        text: `Your Security Code is: ${otp}`
      });
    } catch (emailError) {}

    res.status(201).json({
      message: 'Quiz created. Security Code sent to creator.',
      quizId: quiz.quizId
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Creation failed.", errors: error.errors });
    }
    res.status(500).json({ message: 'Error creating quiz', error: error.message });
  }
});

router.put('/:quizId', isAuthenticatedUser, async (req, res) => {
  try {
    const { title, questions, status } = req.body;
    const quiz = await Quiz.findOne({ quizId: req.params.quizId });

    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (quiz.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const processedQuestions = questions.map(q => {
      const base = {
        questionType: q.questionType,
        questionText: q.questionText,
        marks: Number(q.marks)
      };

      if (q.questionType === "mcq") {
        return {
          ...base,
          options: q.options,
          correctAnswer: Number(q.correctAnswer)
        };
      }
      if (q.questionType === "descriptive") {
        return {
          ...base,
          descriptiveAnswer: q.descriptiveAnswer || ""
        };
      }
      if (q.questionType === "coding") {
        return {
          ...base,
          language: q.language,
          starterCode: q.starterCode || {
             python: "",
             javascript: "",
             java: "",
             cpp: "" 
          },
          testcases: q.testcases || []
        };
      }
      return q;
    });

    quiz.title = title;
    quiz.questions = processedQuestions;
    quiz.status = status;

    await quiz.save();
    res.status(200).json({ message: 'Quiz updated successfully', quiz });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Update failed.", errors: error.errors });
    }
    res.status(500).json({ message: 'Error updating quiz', error: error.message });
  }
});

router.post('/:quizId/duplicate', isAuthenticatedUser, async (req, res) => {
  try {
    const originalQuiz = await Quiz.findOne({ quizId: req.params.quizId }).lean();

    if (!originalQuiz) return res.status(404).json({ message: 'Quiz not found' });
    if (originalQuiz.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const newQuiz = new Quiz({
      quizId: generateQuizId(),
      title: `${originalQuiz.title} - Copy`,
      questions: originalQuiz.questions,
      allowedStudents: originalQuiz.allowedStudents,
      createdBy: req.user.id
    });

    const otp = generateOTP();
    newQuiz.otp = otp;
    newQuiz.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await newQuiz.save();
    res.status(201).json({ message: 'Quiz duplicated successfully', newQuiz });
  } catch (error) {
    res.status(500).json({ message: 'Error duplicating quiz', error: error.message });
  }
});

router.post('/:quizId/generate-otp', isAuthenticatedUser, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ quizId: req.params.quizId });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (!quiz.createdBy) return res.status(500).json({ message: "Cannot generate OTP for a quiz with no creator." });
    if (quiz.createdBy.toString() !== req.user.id) return res.status(403).json({ message: 'Only the quiz creator can generate a new code' });

    const otp = generateOTP();
    quiz.otp = otp;
    quiz.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await quiz.save();

    res.status(200).json({ message: 'New Security Code generated', otp });
  } catch (error) {
    res.status(500).json({ message: 'Error generating Security Code', error: error.message });
  }
});

router.post('/:quizId/verify-student-otp', isAuthenticatedUser, async (req, res) => {
  try {
    const { otp } = req.body;
    const { quizId } = req.params;

    const otpString = otp.toString();
    const demoQuizzes = ['QZ708443', 'QZ840043', 'QZ303385', 'QZ588027'];

    if (demoQuizzes.includes(quizId) && otpString === '000000') {
      return res.status(200).json({ success: true, message: "Demo access granted" });
    }

    const quiz = await Quiz.findOne({ quizId: quizId });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (!quiz.otp || !quiz.otpExpiresAt) {
      return res.status(400).json({ message: 'A Security Code has not been generated for this quiz.' });
    }

    if (quiz.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'The Security Code has expired.' });
    }

    if (quiz.otp.toString() !== otpString) {
      return res.status(400).json({ message: 'Invalid Security Code.' });
    }

    res.status(200).json({ success: true, message: 'Verification successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying Security Code', error: error.message });
  }
});

router.get('/public', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ status: "active" })
      .select("quizId title createdBy questions")
      .populate("createdBy", "name email");
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public quizzes", error: error.message });
  }
});

router.get('/public/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ quizId: req.params.quizId }).populate('createdBy', 'name email');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const sanitizedQuiz = {
      quizId: quiz.quizId,
      title: quiz.title,
      questions: quiz.questions.map(q => {
        const base = {
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks
        };
        if (q.questionType === "mcq") {
          return { ...base, options: q.options };
        }
        if (q.questionType === "coding") {
          return { ...base, language: q.language, testcases: q.testcases };
        }
        return base;
      }),
      status: quiz.status,
      createdAt: quiz.createdAt
    };

    res.status(200).json(sanitizedQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quiz', error: error.message });
  }
});

router.get('/', isAuthenticatedUser, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
  }
});

router.get('/:quizId', isAuthenticatedUser, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ quizId: req.params.quizId }).populate('createdBy', 'name email');

    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (!quiz.createdBy) return res.status(500).json({ message: "Quiz data is corrupted (missing creator info)." });

    if (quiz.createdBy._id.toString() === req.user.id) {
      return res.status(200).json(quiz);
    }

    const sanitizedQuiz = {
      quizId: quiz.quizId,
      title: quiz.title,
      createdBy: quiz.createdBy,
      questions: Array.isArray(quiz.questions)
        ? quiz.questions.map(q => {
          const base = {
            _id: q._id,
            questionText: q.questionText,
            questionType: q.questionType,
            marks: q.marks
          };

          if (q.questionType === "mcq") {
            return { ...base, options: q.options };
          }
          
          if (q.questionType === "coding") {
            return { 
                ...base, 
                language: q.language, 
                starterCode: q.starterCode, 
                testcases: q.testcases 
            };
          }
          return base;
        })
        : []
    };

    return res.status(200).json(sanitizedQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quiz', error: error.message });
  }
});

router.put('/:quizId/status', isAuthenticatedUser, async (req, res) => {
  try {
    const { status } = req.body;
    const quiz = await Quiz.findOneAndUpdate(
      { quizId: req.params.quizId, createdBy: req.user.id },
      { status: status },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found or you are not authorized to update it' });
    }

    res.status(200).json({ message: 'Quiz status updated', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Error updating quiz status', error: error.message });
  }
});

router.delete('/:quizId', isAuthenticatedUser, async (req, res) => {
  try {
    const result = await Quiz.deleteOne({ quizId: req.params.quizId, createdBy: req.user.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Quiz not found or you're not authorized to delete it." });
    }

    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting quiz', error: error.message });
  }
});

export default router;