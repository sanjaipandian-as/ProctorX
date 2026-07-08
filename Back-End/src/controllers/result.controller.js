const resultService = require('../services/result.service');
const exportService = require('../services/export.service');

const submitResult = async (req, res, next) => {
  try {
    const result = await resultService.submitQuiz(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const checkAttempt = async (req, res, next) => {
  try {
    const check = await resultService.checkAttempt(req.user.id, req.params.quizId);
    res.status(200).json(check);
  } catch (error) {
    next(error);
  }
};

const getResultDetails = async (req, res, next) => {
  try {
    const result = await resultService.getResult(req.params.resultId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getQuizResults = async (req, res, next) => {
  try {
    const results = await resultService.getQuizResults(req.user.id, req.params.quizId);
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

const exportQuizResults = async (req, res, next) => {
  try {
    const buffer = await exportService.exportQuizResultsToExcel(req.params.quizId);
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=quiz-results-${req.params.quizId}.xlsx`
    );
    
    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitResult,
  checkAttempt,
  getResultDetails,
  getQuizResults,
  exportQuizResults
};
