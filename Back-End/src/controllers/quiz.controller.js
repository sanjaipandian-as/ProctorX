const quizService = require('../services/quiz.service');

const createQuiz = async (req, res, next) => {
  try {
    const result = await quizService.createQuiz(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getMyQuizzes = async (req, res, next) => {
  try {
    const prisma = require('../config/database');
    const quizzes = await prisma.quiz.findMany({
      where: { createdById: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true, results: true }
        }
      }
    });

    const formatted = quizzes.map(q => ({
      id: q.id,
      quizId: q.quizId,
      title: q.title,
      status: q.status,
      durationInMinutes: q.durationInMinutes,
      totalQuestions: q._count.questions,
      totalAttempts: q._count.results,
      otp: q.otp,
      otpExpiresAt: q.otpExpiresAt,
      createdAt: q.createdAt
    }));

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

const getQuiz = async (req, res, next) => {
  try {
    const prisma = require('../config/database');
    const { redis } = require('../config/redis');

    let quiz = await quizService.getQuizByQuizId(req.params.quizId);

    // Auto-complete: if the quiz is ACTIVE and its duration has elapsed, mark it COMPLETED
    if (quiz.status === 'ACTIVE' && quiz.startedAt && quiz.durationInMinutes) {
      const startedAtMs = new Date(quiz.startedAt).getTime();
      const durationMs = quiz.durationInMinutes * 60 * 1000;
      const nowMs = Date.now();

      if (nowMs >= startedAtMs + durationMs) {
        // Lazily flip to COMPLETED
        const updated = await prisma.quiz.update({
          where: { id: quiz.id },
          data: { status: 'COMPLETED' },
          include: { questions: { orderBy: { order: 'asc' } } }
        });
        // Bust caches so teacher dashboard poll picks this up immediately
        await redis.del(`quiz:${quiz.quizId}`);
        await redis.del(`teacher:quizzes:${quiz.createdById}`);
        quiz = updated;
      }
    }

    res.status(200).json(quiz);
  } catch (error) {
    next(error);
  }
};

const editQuiz = async (req, res, next) => {
  try {
    const result = await quizService.editQuiz(req.user.id, req.params.quizId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteQuiz = async (req, res, next) => {
  try {
    const result = await quizService.deleteQuiz(req.user.id, req.params.quizId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const duplicateQuiz = async (req, res, next) => {
  try {
    const result = await quizService.duplicateQuiz(req.user.id, req.params.quizId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const generateOTP = async (req, res, next) => {
  try {
    const result = await quizService.generateNewOTP(req.user.id, req.params.quizId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const result = await quizService.verifyOTP(
      req.user.id,
      req.user.email,
      req.user.name,
      req.params.quizId,
      otp
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await quizService.changeQuizStatus(req.user.id, req.params.quizId, status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPublicQuizzes = async (req, res, next) => {
  try {
    const result = await quizService.getPublicQuizzes();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPublicQuiz = async (req, res, next) => {
  try {
    const result = await quizService.getPublicQuizByQuizId(req.params.quizId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuiz,
  getMyQuizzes,
  getQuiz,
  editQuiz,
  deleteQuiz,
  duplicateQuiz,
  generateOTP,
  verifyOTP,
  changeStatus,
  getPublicQuizzes,
  getPublicQuiz
};
