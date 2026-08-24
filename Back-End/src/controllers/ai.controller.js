const aiService = require('../services/ai/aiService');
const quizService = require('../services/quiz.service');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Security helper: enforce aiAccess flag
// ---------------------------------------------------------------------------

const requireAiAccess = (req, res) => {
  if (!req.user?.aiAccess) {
    res.status(403).json({
      error: 'AI access not enabled for your account. Please contact your administrator.'
    });
    return false;
  }
  return true;
};

// ---------------------------------------------------------------------------
// POST /api/ai/documents/upload
// ---------------------------------------------------------------------------

const uploadDocument = async (req, res, next) => {
  try {
    if (!requireAiAccess(req, res)) return;

    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded' });
    }

    // 1. Restrict file format (Only PDF, DOC, DOCX allowed. Block ZIP or others)
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ];
    const allowedExtensions = /\.(pdf|doc|docx)$/i;

    if (!allowedMimeTypes.includes(req.file.mimetype) || !allowedExtensions.test(req.file.originalname)) {
      return res.status(400).json({ error: 'Only PDF, DOC, and DOCX documents are allowed.' });
    }

    // 2. Enforce 10 document upload limit per teacher
    const currentDocs = await aiService.listDocuments(req.user.id);
    if (currentDocs?.documents && currentDocs.documents.length >= 10) {
      return res.status(400).json({
        error: 'Upload limit reached. You can have a maximum of 10 documents indexed. Please delete an existing document first.'
      });
    }

    const result = await aiService.uploadDocument(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user.id // teacherId always from JWT
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/ai/documents
// ---------------------------------------------------------------------------

const listDocuments = async (req, res, next) => {
  try {
    if (!requireAiAccess(req, res)) return;

    const result = await aiService.listDocuments(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/ai/documents/:documentId
// ---------------------------------------------------------------------------

const deleteDocument = async (req, res, next) => {
  try {
    if (!requireAiAccess(req, res)) return;

    const { documentId } = req.params;
    const result = await aiService.deleteDocument(documentId, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/ai/generate-quiz
// ---------------------------------------------------------------------------

const generateQuiz = async (req, res, next) => {
  try {
    if (!requireAiAccess(req, res)) return;

    const { prompt, documentId, numMcq, numDescriptive, numCoding, difficulty } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await aiService.generateQuiz(
      prompt.trim(),
      documentId || null,
      req.user.id, // teacherId always from JWT
      { numMcq, numDescriptive, numCoding, difficulty }
    );

    // Auto-cache generated quiz
    try {
      const { redis } = require('../config/redis');
      const normalizedQuestions = result.parsed?.questions?.map(q => ({
        questionText: q.questionText || '',
        questionType: q.questionType || 'mcq',
        options: q.options || (q.questionType === 'mcq' ? ['', '', '', ''] : null),
        correctAns: q.correctAns !== undefined ? q.correctAns : 0,
        descriptiveAnswer: q.descriptiveAnswer || null,
        testcases: q.testcases || null,
        starterCode: q.starterCode || null,
        marks: q.marks || 1,
      })) || [];

      const draft = {
        questions: normalizedQuestions,
        metadata: {
          subject: result.parsed?.subject || '',
          difficulty: result.parsed?.difficulty || difficulty || 'Medium'
        },
        sourceChunks: result.sourceChunks || [],
        aiMeta: {
          model: result.model,
          promptVersion: result.promptVersion,
          documentId: documentId || null
        }
      };
      await redis.setex(`ai-quiz-draft:${req.user.id}`, 86400, JSON.stringify(draft));
    } catch (cacheError) {
      logger.error('Failed to auto-cache generated quiz:', cacheError);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/ai/save-quiz
// Saves AI-generated (and optionally teacher-edited) quiz to the database
// ---------------------------------------------------------------------------

const saveGeneratedQuiz = async (req, res, next) => {
  try {
    if (!requireAiAccess(req, res)) return;

    const {
      title,
      durationInMinutes,
      questions,
      documentId,
      aiModel,
      aiPromptVersion,
      allowedStudents,
      classroomId,
    } = req.body;

    if (!title || !durationInMinutes || !questions?.length) {
      return res.status(400).json({ error: 'title, durationInMinutes, and questions are required' });
    }

    // Map AI question schema to quiz.service expected format
    const mappedQuestions = questions.map((q, idx) => ({
      questionText: q.questionText,
      questionType: q.questionType || 'mcq',
      options: q.options || [],
      correctAns: q.correctAns !== undefined ? q.correctAns : 0,
      descriptiveAnswer: q.descriptiveAnswer || null,
      testcases: q.testcases || null,
      starterCode: q.starterCode || null,
      marks: q.marks !== undefined ? q.marks : 1,
      order: idx,
    }));

    const quiz = await quizService.createQuiz(req.user.id, {
      title: title.trim(),
      durationInMinutes: parseInt(durationInMinutes, 10),
      allowedStudents: allowedStudents || [],
      classroomId: classroomId || null,
      documentId: documentId || null,
      aiModel: aiModel || null,
      aiPromptVersion: aiPromptVersion || null,
      questions: mappedQuestions,
    });

    logger.info(`AI quiz saved: ${quiz.quizId} by teacher ${req.user.id} (model: ${aiModel})`);

    // Clear draft cache upon saving permanently
    try {
      const { redis } = require('../config/redis');
      await redis.del(`ai-quiz-draft:${req.user.id}`);
    } catch (cacheError) {
      logger.error('Failed to clear draft cache after saving:', cacheError);
    }

    res.status(201).json({
      success: true,
      quizId: quiz.quizId,
      title: quiz.title,
      id: quiz.id,
      message: 'AI-generated quiz saved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/ai/regenerate-question
// ---------------------------------------------------------------------------

const regenerateQuestion = async (req, res, next) => {
  try {
    if (!requireAiAccess(req, res)) return;

    const { question, prompt, difficulty, documentId } = req.body;

    if (!question || !prompt) {
      return res.status(400).json({ error: 'question and prompt are required' });
    }

    const result = await aiService.regenerateQuestion(
      question,
      prompt.trim(),
      difficulty || null,
      documentId || null,
      req.user.id
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/ai/upload-image
// Uploads question image to Cloudinary and returns URL
// ---------------------------------------------------------------------------

const uploadQuestionImage = async (req, res, next) => {
  try {
    if (!requireAiAccess(req, res)) return;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Return the secure URL from Cloudinary storage
    res.status(200).json({
      success: true,
      imageUrl: req.file.path || req.file.secure_url
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Draft Caching Endpoints
// ---------------------------------------------------------------------------

const getDraft = async (req, res, next) => {
  try {
    if (!requireAiAccess(req, res)) return;
    const { redis } = require('../config/redis');
    const cached = await redis.get(`ai-quiz-draft:${req.user.id}`);
    if (cached) {
      const draft = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.status(200).json(draft);
    }
    return res.status(200).json(null);
  } catch (error) {
    next(error);
  }
};

const saveDraft = async (req, res, next) => {
  try {
    if (!requireAiAccess(req, res)) return;
    const { questions, metadata, sourceChunks, aiMeta } = req.body;
    const { redis } = require('../config/redis');

    const draft = {
      questions: questions || [],
      metadata: metadata || null,
      sourceChunks: sourceChunks || [],
      aiMeta: aiMeta || null
    };

    await redis.setex(`ai-quiz-draft:${req.user.id}`, 86400, JSON.stringify(draft));
    return res.status(200).json({ success: true, message: 'Draft saved successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteDraft = async (req, res, next) => {
  try {
    if (!requireAiAccess(req, res)) return;
    const { redis } = require('../config/redis');
    await redis.del(`ai-quiz-draft:${req.user.id}`);
    return res.status(200).json({ success: true, message: 'Draft cleared successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  listDocuments,
  deleteDocument,
  generateQuiz,
  saveGeneratedQuiz,
  regenerateQuestion,
  uploadQuestionImage,
  getDraft,
  saveDraft,
  deleteDraft,
};
