const prisma = require('../config/database');
const { redis } = require('../config/redis');
const logger = require('../utils/logger');

const submitQuiz = async (studentId, { quizId, answers, timeTaken, warnings, penalties }) => {
  // Find internal Quiz ID
  const quiz = await prisma.quiz.findUnique({
    where: { quizId },
    include: { questions: { orderBy: { order: 'asc' } } }
  });

  if (!quiz) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }

  // Calculate score using marks-weighted grading per question type
  const totalQuestions = quiz.questions.length;
  const totalPossibleMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  let score = 0;

  const responsesData = quiz.questions.map(q => {
    const questionMarks = q.marks || 1;
    const studentAnsObj = answers.find(a => a.questionText === q.questionText);
    const studentAnswerText = studentAnsObj ? studentAnsObj.studentAnswer : '';

    let isCorrect = false;
    let correctAnswerText = '';

    if (q.questionType === 'mcq') {
      // MCQ: auto-grade by comparing option text
      correctAnswerText = q.options[q.correctAns] || '';
      if (studentAnswerText && correctAnswerText) {
        isCorrect = correctAnswerText.trim().toLowerCase() === studentAnswerText.trim().toLowerCase();
      }
      if (isCorrect) score += questionMarks;
    } else if (q.questionType === 'descriptive') {
      // Descriptive: NOT auto-graded — always 0 marks, marked for manual review
      correctAnswerText = q.descriptiveAnswer || '[Manual Review Required]';
      isCorrect = false;
    } else if (q.questionType === 'coding') {
      // Coding: NOT auto-graded here — always 0 marks, marked for manual review
      correctAnswerText = '[Coding - Manual/Test Case Review Required]';
      isCorrect = false;
    }

    return {
      questionText: q.questionText,
      studentAnswer: studentAnswerText,
      correctAnswer: correctAnswerText,
      isCorrect
    };
  });

  const accuracy = totalPossibleMarks > 0 ? parseFloat(((score / totalPossibleMarks) * 100).toFixed(2)) : 0;

  // Run in database transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. One-attempt check
    const existing = await tx.result.findUnique({
      where: {
        quizId_studentId: {
          quizId: quiz.id,
          studentId
        }
      }
    });

    if (existing) {
      const err = new Error('Quiz already attempted by this student');
      err.statusCode = 409;
      throw err;
    }

    // 2. Create result with responses
    return tx.result.create({
      data: {
        score,
        totalQuestions,
        accuracy,
        timeTaken,
        warnings,
        penalties,
        quizId: quiz.id,
        studentId,
        responses: {
          create: responsesData
        }
      },
      include: {
        responses: true
      }
    });
  });

  // Store in cache to fast check attempts
  await redis.setex(`result:check:${quizId}:${studentId}`, 86400, 'true');
  await redis.del(`admin:stats`);

  return result;
};

const checkAttempt = async (studentId, quizId) => {
  const cachedCheck = await redis.get(`result:check:${quizId}:${studentId}`);
  if (cachedCheck === 'true') return { attempted: true };

  // If cache miss, check database
  const quiz = await prisma.quiz.findUnique({ where: { quizId } });
  if (!quiz) return { attempted: false };

  const attempt = await prisma.result.findUnique({
    where: {
      quizId_studentId: {
        quizId: quiz.id,
        studentId
      }
    }
  });

  const attempted = !!attempt;
  if (attempted) {
    await redis.setex(`result:check:${quizId}:${studentId}`, 86400, 'true');
  }

  return { attempted };
};

const getResult = async (resultId) => {
  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: {
      responses: true,
      quiz: {
        select: {
          title: true,
          quizId: true,
          questions: {
            select: {
              questionText: true,
              options: true
            }
          }
        }
      },
      student: {
        select: {
          name: true,
          email: true,
          profilePic: true
        }
      }
    }
  });

  if (!result) {
    const err = new Error('Result details not found');
    err.statusCode = 404;
    throw err;
  }

  const warningsList = await prisma.warning.findMany({
    where: {
      studentId: result.studentId,
      quizId: result.quizId
    },
    orderBy: { createdAt: 'asc' }
  });

  return {
    ...result,
    warningsList
  };
};

const getQuizResults = async (teacherId, quizId) => {
  const quiz = await prisma.quiz.findUnique({ where: { quizId } });
  if (!quiz) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }

  // Double check authorization
  if (quiz.createdById !== teacherId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }

  const results = await prisma.result.findMany({
    where: { quizId: quiz.id },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { completedAt: 'desc' }
  });

  return results;
};

module.exports = {
  submitQuiz,
  checkAttempt,
  getResult,
  getQuizResults
};
