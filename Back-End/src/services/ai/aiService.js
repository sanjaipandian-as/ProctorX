const axios = require('axios');
const cleanEnv = require('../../config/env');
const logger = require('../../utils/logger');

const AI_SERVICE_URL = cleanEnv.AI_SERVICE_URL;

// ---------------------------------------------------------------------------
// Document Management
// ---------------------------------------------------------------------------

const uploadDocument = async (fileBuffer, filename, mimetype, teacherId) => {
  try {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimetype });
    formData.append('file', blob, filename);
    formData.append('teacherId', teacherId);

    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/documents`, formData, { timeout: 30000, maxContentLength: 12 * 1024 * 1024 });
    return response.data;
  } catch (error) {
    logger.error('Error uploading document to AI Service:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to upload document to AI Service');
  }
};

const listDocuments = async (teacherId) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/ai/documents/list`, {
      timeout: 10000,
      params: { teacherId }
    });
    return response.data;
  } catch (error) {
    logger.error('Error listing documents from AI Service:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to list documents from AI Service');
  }
};

const deleteDocument = async (documentId, teacherId) => {
  try {
    const response = await axios.delete(`${AI_SERVICE_URL}/api/ai/documents/${documentId}`, {
      timeout: 10000,
      params: { teacherId }
    });
    return response.data;
  } catch (error) {
    logger.error('Error deleting document from AI Service:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to delete document from AI Service');
  }
};

// ---------------------------------------------------------------------------
// Quiz Generation
// ---------------------------------------------------------------------------

const generateQuiz = async (prompt, documentId = null, teacherId, options = {}) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/quiz/generate`, {
      prompt,
      documentId,
      teacherId,
      numMcq: options.numMcq ?? null,
      numDescriptive: options.numDescriptive ?? null,
      numCoding: options.numCoding ?? null,
      difficulty: options.difficulty ?? null,
    }, { timeout: 60000 });
    return response.data;
  } catch (error) {
    logger.error('Error generating quiz from AI Service:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to generate quiz from AI Service');
  }
};

// ---------------------------------------------------------------------------
// Descriptive Answer Grading
// ---------------------------------------------------------------------------

const gradeAnswer = async (questionText, studentAnswer, expectedAnswer, maxMarks) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/grade`, {
      questionText,
      studentAnswer,
      expectedAnswer,
      maxMarks
    }, { timeout: 30000 });

    return {
      ...response.data,
      model: cleanEnv.NVIDIA_CHAT_MODEL || 'meta/llama-3.3-70b-instruct',
      promptVersion: 'descriptive-grading-v1'
    };
  } catch (error) {
    logger.error('Error grading answer via AI Service:', error.response?.data || error.message);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Question Regeneration
// ---------------------------------------------------------------------------

const regenerateQuestion = async (question, prompt, difficulty = null, documentId = null, teacherId) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/quiz/regenerate-question`, {
      question,
      prompt,
      difficulty,
      documentId,
      teacherId
    }, { timeout: 30000 });
    return response.data;
  } catch (error) {
    logger.error('Error regenerating question from AI Service:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to regenerate question from AI Service');
  }
};

module.exports = {
  uploadDocument,
  listDocuments,
  deleteDocument,
  generateQuiz,
  gradeAnswer,
  regenerateQuestion
};
