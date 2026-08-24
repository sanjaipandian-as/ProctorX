const express = require('express');
const router = express.Router();

const resultController = require('../controllers/result.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { submitResultSchema } = require('../schemas/result.schema');

router.use(verifyToken);

// Student endpoints
router.post('/submit', requireRole('student'), validate(submitResultSchema), resultController.submitResult);
router.get('/check/:quizId', requireRole('student'), resultController.checkAttempt);

// Teacher endpoints
router.get('/quiz/:quizId', requireRole('teacher'), resultController.getQuizResults);
router.get('/export/:quizId', requireRole('teacher'), resultController.exportQuizResults);
router.delete('/reset/:quizId/:studentId', requireRole('teacher'), resultController.resetQuizAttempt);
router.put('/responses/:responseId/grade', requireRole('teacher'), resultController.gradeResponse);

// Shared endpoints
router.get('/:resultId', resultController.getResultDetails);

module.exports = router;
