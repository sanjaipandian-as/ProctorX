const express = require('express');
const router = express.Router();

const quizController = require('../controllers/quiz.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createQuizSchema } = require('../schemas/quiz.schema');

// Public search/lookup endpoints (called from searchbar)
router.get('/public', quizController.getPublicQuizzes);
router.get('/public/:quizId', quizController.getPublicQuiz);

router.use(verifyToken);

// Teacher-only endpoints
router.post('/', requireRole('teacher'), validate(createQuizSchema), quizController.createQuiz);
router.get('/', requireRole('teacher'), quizController.getMyQuizzes);
router.put('/:quizId', requireRole('teacher'), validate(createQuizSchema), quizController.editQuiz);
router.delete('/:quizId', requireRole('teacher'), quizController.deleteQuiz);
router.post('/:quizId/duplicate', requireRole('teacher'), quizController.duplicateQuiz);
router.post('/:quizId/generate-otp', requireRole('teacher'), quizController.generateOTP);
router.put('/:quizId/status', requireRole('teacher'), quizController.changeStatus);

// Student-only endpoints
router.post('/:quizId/verify-otp', requireRole('student'), quizController.verifyOTP);

// Shared endpoints
router.get('/:quizId', quizController.getQuiz);

module.exports = router;
