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

  // NOTE: We intentionally do NOT block submissions after endsAt here.
  // Students who were already in the exam when the deadline hit must be able to submit.
  // Access control is enforced at the OTP verify step (quiz.service.js verifyOTP),
  // which prevents new students from joining after endsAt.

  // Calculate score using marks-weighted grading per question type
  const totalQuestions = quiz.questions.length;
  const totalPossibleMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  const aiService = require('./ai/aiService');
  const cleanEnv = require('../config/env');

  const pMap = async (array, mapper, concurrency = 3) => {
    const results = [];
    const executing = new Set();
    for (const item of array) {
      const p = Promise.resolve().then(() => mapper(item));
      results.push(p);
      executing.add(p);
      const clean = () => executing.delete(p);
      p.then(clean, clean);
      if (executing.size >= concurrency) {
        await Promise.race(executing);
      }
    }
    return Promise.all(results);
  };

  const concurrencyLimit = cleanEnv.AI_GRADING_CONCURRENCY || 3;

  const responsesData = await pMap(quiz.questions, async (q) => {
    const questionMarks = q.marks || 1;
    const studentAnsObj = answers.find(a => a.questionText === q.questionText);
    const studentAnswerText = studentAnsObj ? studentAnsObj.studentAnswer : '';

    let isCorrect = false;
    let correctAnswerText = '';
    let marksObtained = 0;
    let aiFeedback = null;
    let aiGraded = false;
    let aiModel = null;
    let aiPromptVersion = null;

    if (q.questionType === 'mcq') {
      // MCQ: auto-grade by comparing option text
      correctAnswerText = q.options[q.correctAns] || '';
      if (studentAnswerText && correctAnswerText) {
        isCorrect = correctAnswerText.trim().toLowerCase() === studentAnswerText.trim().toLowerCase();
      }
      marksObtained = isCorrect ? questionMarks : 0;
    } else if (q.questionType === 'descriptive') {
      // Descriptive: AI auto-graded using Python AI Service
      correctAnswerText = q.descriptiveAnswer || '';
      if (studentAnswerText.trim() && correctAnswerText.trim()) {
        try {
          const gradeResult = await aiService.gradeAnswer(
            q.questionText,
            studentAnswerText,
            correctAnswerText,
            questionMarks
          );
          marksObtained = gradeResult.score;
          aiFeedback = `AI Grade: ${gradeResult.score}/${questionMarks}\nFeedback: ${gradeResult.feedback}\nStrengths: ${gradeResult.strengths}\nSuggestions: ${gradeResult.suggestions}\nMissing Concepts: ${gradeResult.missing_concepts && gradeResult.missing_concepts.length ? gradeResult.missing_concepts.join(', ') : 'None'}`;
          aiGraded = true;
          isCorrect = marksObtained > 0;
          aiModel = gradeResult.model;
          aiPromptVersion = gradeResult.promptVersion;
        } catch (err) {
          logger.error('Failed to auto-grade descriptive answer:', err);
          aiFeedback = `AI auto-grading failed/timed out. Pending teacher review. Error: ${err.message}`;
          aiGraded = false;
          marksObtained = 0;
          isCorrect = false;
        }
      } else {
        marksObtained = 0;
        aiFeedback = 'No response provided by the student.';
        aiGraded = true;
      }
    } else if (q.questionType === 'coding') {
      // Coding: NOT auto-graded here — always 0 marks, marked for manual review
      correctAnswerText = '[Coding - Manual/Test Case Review Required]';
      isCorrect = false;
      marksObtained = 0;
    }

    return {
      questionText: q.questionText,
      studentAnswer: studentAnswerText,
      correctAnswer: correctAnswerText,
      isCorrect,
      marksObtained,
      aiFeedback,
      aiGraded,
      aiModel,
      aiPromptVersion
    };
  }, concurrencyLimit);

  const score = responsesData.reduce((sum, r) => sum + r.marksObtained, 0);
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
  const quiz = await prisma.quiz.findUnique({ where: { quizId } });
  if (!quiz) return { attempted: false, warningCount: 0 };

  const cachedCheck = await redis.get(`result:check:${quizId}:${studentId}`);
  let attempted = false;

  if (cachedCheck === 'true') {
    attempted = true;
  } else {
    const attempt = await prisma.result.findUnique({
      where: {
        quizId_studentId: {
          quizId: quiz.id,
          studentId
        }
      }
    });

    attempted = !!attempt;
    if (attempted) {
      await redis.setex(`result:check:${quizId}:${studentId}`, 86400, 'true');
    }
  }

  const warningCount = await prisma.warning.count({
    where: {
      studentId,
      quizId: quiz.id
    }
  });

  return { attempted, warningCount };
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
              id: true,
              questionText: true,
              options: true,
              questionType: true,
              descriptiveAnswer: true,
              testcases: true,
              starterCode: true,
              marks: true
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

  const totalPossibleMarks = result.quiz?.questions?.reduce((sum, q) => sum + (q.marks || 1), 0) || result.totalQuestions;

  return {
    ...result,
    totalQuestions: totalPossibleMarks,
    warningsList
  };
};

const getQuizResults = async (teacherId, quizId) => {
  const quiz = await prisma.quiz.findUnique({
    where: { quizId },
    include: { questions: { select: { marks: true } } }
  });
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

  const totalPossibleMarks = quiz.questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  return results.map(r => ({
    ...r,
    totalQuestions: totalPossibleMarks
  }));
};

const resetQuizAttempt = async (teacherId, quizId, studentId) => {
  // 1. Fetch internal Quiz ID and verify ownership
  const quiz = await prisma.quiz.findUnique({ where: { quizId } });
  if (!quiz) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }
  if (quiz.createdById !== teacherId) {
    const err = new Error('Unauthorized to reset this quiz attempt');
    err.statusCode = 403;
    throw err;
  }

  // 2. Perform transactions to clean attempt data
  await prisma.$transaction(async (tx) => {
    // Delete responses for this result
    await tx.response.deleteMany({
      where: {
        result: {
          quizId: quiz.id,
          studentId: studentId
        }
      }
    });

    // Delete the result itself
    await tx.result.deleteMany({
      where: {
        quizId: quiz.id,
        studentId: studentId
      }
    });

    // Delete warnings logged for this quiz/student
    await tx.warning.deleteMany({
      where: {
        quizId: quiz.id,
        studentId: studentId
      }
    });
  });

  // 3. Clear Redis attempt caching so the student can re-attempt instantly
  await redis.del(`result:check:${quizId}:${studentId}`);
  await redis.del(`admin:stats`);

  logger.info(`Teacher ${teacherId} reset attempt of student ${studentId} for quiz ${quizId}`);
  return { success: true, message: 'Quiz attempt reset successfully' };
};

const gradeResponse = async (teacherId, responseId, rawMarksObtained) => {
  const marksObtained = parseInt(rawMarksObtained, 10);
  if (isNaN(marksObtained)) {
    const err = new Error('Marks must be a valid integer');
    err.statusCode = 400;
    throw err;
  }
  // 1. Fetch response and its associated result and quiz
  const responseObj = await prisma.response.findUnique({
    where: { id: responseId },
    include: {
      result: {
        include: {
          quiz: true
        }
      }
    }
  });

  if (!responseObj) {
    const err = new Error('Response not found');
    err.statusCode = 404;
    throw err;
  }

  const { result } = responseObj;
  const { quiz } = result;

  // 2. Verify authorization: the teacher must own the quiz
  if (quiz.createdById !== teacherId) {
    const err = new Error('Unauthorized to grade this response');
    err.statusCode = 403;
    throw err;
  }

  // 3. Find corresponding question to validate marks range
  const question = await prisma.question.findFirst({
    where: {
      quizId: quiz.id,
      questionText: responseObj.questionText
    }
  });

  const maxMarks = question ? (question.marks || 1) : 1;
  if (marksObtained < 0 || marksObtained > maxMarks) {
    const err = new Error(`Marks obtained must be between 0 and ${maxMarks}`);
    err.statusCode = 400;
    throw err;
  }

  // 4. Perform transaction to update response marks and update result total score
  const updatedResult = await prisma.$transaction(async (tx) => {
    // Update the specific response
    await tx.response.update({
      where: { id: responseId },
      data: {
        marksObtained,
        isCorrect: marksObtained > 0 // if it has points, mark as correct (helps accuracy/score counts)
      }
    });

    // Fetch all responses for this result to compute total score
    const allResponses = await tx.response.findMany({
      where: { resultId: result.id }
    });

    // Fetch all questions to compute total possible marks
    const allQuestions = await tx.question.findMany({
      where: { quizId: quiz.id }
    });

    // Auto-repair legacy MCQ responses if they have isCorrect: true but marksObtained: 0
    for (const resp of allResponses) {
      const question = allQuestions.find(q => q.questionText === resp.questionText);
      if (question && question.questionType === 'mcq' && resp.isCorrect && resp.marksObtained === 0) {
        const questionMarks = question.marks || 1;
        await tx.response.update({
          where: { id: resp.id },
          data: { marksObtained: questionMarks }
        });
        resp.marksObtained = questionMarks; // Update in-memory for the reduce calculation below
      }
    }

    const newScore = allResponses.reduce((sum, res) => sum + res.marksObtained, 0);

    const totalPossibleMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const newAccuracy = totalPossibleMarks > 0 ? parseFloat(((newScore / totalPossibleMarks) * 100).toFixed(2)) : 0;

    // Update the result
    return tx.result.update({
      where: { id: result.id },
      data: {
        score: newScore,
        accuracy: newAccuracy
      },
      include: {
        responses: true
      }
    });
  });

  // Clear cache if needed (optional)
  await redis.del(`admin:stats`);

  logger.info(`Teacher ${teacherId} updated response ${responseId} grade to ${marksObtained}`);
  return updatedResult;
};

module.exports = {
  submitQuiz,
  checkAttempt,
  getResult,
  getQuizResults,
  resetQuizAttempt,
  gradeResponse
};
