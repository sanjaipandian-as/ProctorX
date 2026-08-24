const express = require('express');
const router = express.Router();
const multer = require('multer');

const aiController = require('../controllers/ai.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { aiGenerationLimiter } = require('../middleware/rateLimiter');
const { generateQuizSchema, regenerateQuestionSchema, saveQuizSchema } = require('../schemas/ai.schema');
const { questionUpload } = require('../middleware/upload.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All /api/ai/* routes require: valid JWT + teacher role
router.use(verifyToken);
router.use(requireRole('teacher'));

// Document management
router.post('/documents/upload', upload.single('file'), aiController.uploadDocument);
router.get('/documents', aiController.listDocuments);
router.delete('/documents/:documentId', aiController.deleteDocument);

// Draft management
router.get('/draft', aiController.getDraft);
router.post('/draft', aiController.saveDraft);
router.delete('/draft', aiController.deleteDraft);

// Quiz generation — rate limited to 5 requests per 10 min per teacher
router.post('/generate-quiz', aiGenerationLimiter, validate(generateQuizSchema), aiController.generateQuiz);

// Single question regeneration
router.post('/regenerate-question', validate(regenerateQuestionSchema), aiController.regenerateQuestion);

// Question image upload (uploads directly to Cloudinary via questionUpload middleware)
router.post('/upload-image', questionUpload.single('image'), aiController.uploadQuestionImage);

// Save AI-generated quiz to database (after teacher review/edit step)
router.post('/save-quiz', validate(saveQuizSchema), aiController.saveGeneratedQuiz);

module.exports = router;
