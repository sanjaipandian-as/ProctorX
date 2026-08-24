const prisma = require('../config/database');
const { withCache, redis } = require('../config/redis');
const { generateQuizId, generateOTP } = require('../utils/helpers');
const { sendOTPEmail } = require('./email.service');
const logger = require('../utils/logger');

const createQuiz = async (teacherId, { title, durationInMinutes, allowedStudents, classroomId, scheduledAt, endsAt, autoStart, documentId, aiModel, aiPromptVersion, questions }) => {
  const customQuizId = generateQuizId();
  
  // ALL new quizzes should start as PENDING, even manual ones.
  // Manual quizzes will be activated when the teacher clicks 'Go Live' which calls changeQuizStatus.
  // Scheduled quizzes will be activated by the background cron scheduler.
  const initialStatus = 'PENDING';
  const otpCode = null;
  const otpExpiresAt = null;
  const startedAt = null;

  const quiz = await prisma.quiz.create({
    data: {
      quizId: customQuizId,
      title,
      status: initialStatus,
      durationInMinutes,
      allowedStudents: allowedStudents || [],
      otp: otpCode,
      otpExpiresAt,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      autoStart: autoStart !== undefined ? autoStart : true,
      startedAt,
      endsAt: endsAt ? new Date(endsAt) : null,
      createdById: teacherId,
      classroomId: classroomId || null,
      documentId: documentId || null,
      aiModel: aiModel || null,
      aiPromptVersion: aiPromptVersion || null,
      questions: {
        create: questions.map((q, idx) => ({
          questionText: q.questionText,
          options: q.options || [],
          correctAns: q.correctAns !== undefined ? q.correctAns : 0,
          questionType: q.questionType || "mcq",
          descriptiveAnswer: q.descriptiveAnswer || null,
          testcases: q.testcases || null,
          starterCode: q.starterCode || null,
          marks: q.marks !== undefined ? q.marks : 1,
          order: q.order !== undefined ? q.order : idx
        }))
      }
    },
    include: {
      questions: true
    }
  });

  // Save OTP in Redis Cache if active
  if (otpCode) {
    await redis.setex(`otp:${customQuizId}`, 600, otpCode);
  }

  // Invalidate teacher dashboard caches
  await redis.del(`teacher:quizzes:${teacherId}`);
  await redis.del(`admin:stats`);

  return { quizId: quiz.quizId, title: quiz.title, id: quiz.id };
};

const getQuizByQuizId = async (quizId, ignoreCache = false) => {
  const fetchFn = async () => {
    const quiz = await prisma.quiz.findUnique({
      where: { quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });
    if (!quiz) {
      const err = new Error('Quiz not found');
      err.statusCode = 404;
      throw err;
    }
    return quiz;
  };

  if (ignoreCache) {
    return fetchFn();
  }

  // Cache duration reduced to 60s so status changes propagate quickly to students
  return withCache(`quiz:${quizId}`, 60, fetchFn);
};

const getQuizById = async (id) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: 'asc' }
      }
    }
  });
  if (!quiz) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }
  return quiz;
};

const editQuiz = async (teacherId, customQuizId, { title, durationInMinutes, allowedStudents, classroomId, scheduledAt, endsAt, autoStart, documentId, aiModel, aiPromptVersion, questions }) => {
  const existing = await prisma.quiz.findUnique({
    where: { quizId: customQuizId }
  });

  if (!existing) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }

  if (existing.createdById !== teacherId) {
    const err = new Error('Unauthorized to modify this quiz');
    err.statusCode = 403;
    throw err;
  }

  // Update inside a transaction to safely handle replacement of questions
  const updated = await prisma.$transaction(async (tx) => {
    // Delete existing questions
    await tx.question.deleteMany({
      where: { quizId: existing.id }
    });

    // Update quiz details & create new questions
    return tx.quiz.update({
      where: { id: existing.id },
      data: {
        title,
        durationInMinutes,
        allowedStudents: allowedStudents || [],
        classroomId: classroomId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        autoStart: autoStart !== undefined ? autoStart : true,
        documentId: documentId || null,
        aiModel: aiModel || null,
        aiPromptVersion: aiPromptVersion || null,
        questions: {
          create: questions.map((q, idx) => ({
            questionText: q.questionText,
            options: q.options || [],
            correctAns: q.correctAns !== undefined ? q.correctAns : 0,
            questionType: q.questionType || "mcq",
            descriptiveAnswer: q.descriptiveAnswer || null,
            testcases: q.testcases || null,
            starterCode: q.starterCode || null,
            marks: q.marks !== undefined ? q.marks : 1,
            order: q.order !== undefined ? q.order : idx
          }))
        }
      },
      include: {
        questions: true
      }
    });
  });

  // Invalidate Redis Caches
  await redis.del(`quiz:${customQuizId}`);
  await redis.del(`teacher:quizzes:${teacherId}`);

  return updated;
};

const deleteQuiz = async (teacherId, customQuizId) => {
  const existing = await prisma.quiz.findUnique({
    where: { quizId: customQuizId }
  });

  if (!existing) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }

  if (existing.createdById !== teacherId) {
    const err = new Error('Unauthorized to delete this quiz');
    err.statusCode = 403;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    // Cascade delete is handled by database relation schema for questions, but let's delete manually to be safe or rely on cascade
    await tx.question.deleteMany({ where: { quizId: existing.id } });
    await tx.result.deleteMany({ where: { quizId: existing.id } }); // Delete attempts for this quiz
    await tx.quiz.delete({ where: { id: existing.id } });
  });

  // Invalidate Redis Caches
  await redis.del(`quiz:${customQuizId}`);
  await redis.del(`teacher:quizzes:${teacherId}`);
  await redis.del(`admin:stats`);

  return { message: 'Quiz deleted successfully' };
};

const duplicateQuiz = async (teacherId, customQuizId) => {
  const quiz = await getQuizByQuizId(customQuizId, true);

  const duplicated = await createQuiz(teacherId, {
    title: `${quiz.title} (Clone)`,
    durationInMinutes: quiz.durationInMinutes,
    allowedStudents: quiz.allowedStudents,
    classroomId: quiz.classroomId,
    questions: quiz.questions.map(q => ({
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      correctAns: q.correctAns,
      descriptiveAnswer: q.descriptiveAnswer,
      testcases: q.testcases,
      starterCode: q.starterCode,
      marks: q.marks,
      order: q.order
    }))
  });

  return duplicated;
};

const generateNewOTP = async (teacherId, customQuizId) => {
  const quiz = await prisma.quiz.findUnique({
    where: { quizId: customQuizId }
  });

  if (!quiz) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }

  if (quiz.createdById !== teacherId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }

  const otpCode = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  await prisma.quiz.update({
    where: { id: quiz.id },
    data: { otp: otpCode, otpExpiresAt }
  });

  await redis.setex(`otp:${customQuizId}`, 300, otpCode);
  await redis.del(`quiz:${customQuizId}`);

  return { otp: otpCode, otpExpiresAt };
};

const verifyOTP = async (studentId, studentEmail, studentName, customQuizId, otp) => {
  // Check redis first
  let cachedOtp = await redis.get(`otp:${customQuizId}`);
  let dbQuiz = null;

  if (!cachedOtp) {
    dbQuiz = await prisma.quiz.findUnique({ where: { quizId: customQuizId } });
    if (!dbQuiz) {
      const err = new Error('Quiz not found');
      err.statusCode = 404;
      throw err;
    }
    if (!dbQuiz.otp || !dbQuiz.otpExpiresAt || dbQuiz.otpExpiresAt < new Date()) {
      const err = new Error('OTP has expired or is invalid. Please request a new one.');
      err.statusCode = 400;
      throw err;
    }
    cachedOtp = dbQuiz.otp;
  }

  if (cachedOtp.toString() !== otp.toString()) {
    const err = new Error('Invalid OTP code');
    err.statusCode = 400;
    throw err;
  }

  if (!dbQuiz) {
    dbQuiz = await prisma.quiz.findUnique({ where: { quizId: customQuizId } });
  }

  // Check Classroom membership if classroomId is defined
  if (dbQuiz.classroomId) {
    const isEnrolled = await prisma.classroom.findFirst({
      where: {
        id: dbQuiz.classroomId,
        students: {
          some: { id: studentId }
        }
      }
    });

    if (!isEnrolled) {
      const err = new Error('You are not in classroom please reachout your facalty for te acesss.');
      err.statusCode = 403;
      throw err;
    }
  }

  // Check check allowedStudents if defined
  if (dbQuiz.allowedStudents && dbQuiz.allowedStudents.length > 0) {
    if (!dbQuiz.allowedStudents.includes(studentEmail)) {
      const err = new Error('You are not authorized to attempt this quiz');
      err.statusCode = 403;
      throw err;
    }
  }

  // Block access if exam end time has already passed
  if (dbQuiz.endsAt && new Date() > new Date(dbQuiz.endsAt)) {
    const err = new Error('Test time has ended. This exam is no longer available.');
    err.statusCode = 403;
    throw err;
  }

  // Check if student already attempted the quiz
  const existingResult = await prisma.result.findUnique({
    where: { quizId_studentId: { quizId: dbQuiz.id, studentId } }
  });

  if (existingResult) {
    const err = new Error('You have already attempted this quiz');
    err.statusCode = 400;
    throw err;
  }

  return { success: true, message: 'OTP verified successfully', quiz: dbQuiz };
};

const changeQuizStatus = async (teacherId, customQuizId, status) => {
  const quiz = await prisma.quiz.findUnique({ where: { quizId: customQuizId } });

  if (!quiz) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }

  if (quiz.createdById !== teacherId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }

  const updateData = { status };
  if (status === 'ACTIVE') {
    const activatedAt = new Date();
    updateData.startedAt = activatedAt;
    // Auto-compute endsAt if teacher did not set one explicitly
    if (!quiz.endsAt) {
      updateData.endsAt = new Date(activatedAt.getTime() + quiz.durationInMinutes * 60 * 1000);
    }
    if (!quiz.otp) {
      const otpCode = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
      updateData.otp = otpCode;
      updateData.otpExpiresAt = otpExpiresAt;
      await redis.setex(`otp:${customQuizId}`, 600, otpCode);
    }
  }

  const updated = await prisma.quiz.update({
    where: { id: quiz.id },
    data: updateData,
    include: { questions: true }
  });

  // Invalidate Redis Caches
  await redis.del(`quiz:${customQuizId}`);
  await redis.del(`teacher:quizzes:${teacherId}`);

  return updated;
};

const getPublicQuizzes = async () => {
  const quizzes = await prisma.quiz.findMany({
    select: {
      quizId: true,
      title: true,
      createdAt: true,
      createdBy: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  return quizzes.map(q => ({
    quizId: q.quizId,
    title: q.title,
    createdAt: q.createdAt,
    createdBy: q.createdBy
  }));
};

const getPublicQuizByQuizId = async (quizId) => {
  const quiz = await prisma.quiz.findUnique({
    where: { quizId },
    include: {
      questions: {
        select: {
          questionText: true,
          options: true,
          order: true
        },
        orderBy: { order: 'asc' }
      },
      createdBy: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  if (!quiz) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    quizId: quiz.quizId,
    title: quiz.title,
    status: quiz.status,
    createdAt: quiz.createdAt,
    createdBy: quiz.createdBy,
    questions: quiz.questions
  };
};

const ensureActiveQuizOTP = async (quiz) => {
  if (quiz.status !== 'ACTIVE') return quiz;

  // ── Check Redis first (single-threaded, no race condition) ──
  // If the key still exists in Redis the OTP is still valid.
  const cachedOtp = await redis.get(`otp:${quiz.quizId}`);
  if (cachedOtp) {
    // Keep quiz object in sync with what's in Redis/DB
    quiz.otp = cachedOtp;
    return quiz;
  }

  // Redis key expired → OTP window has ended → generate a fresh OTP
  const now = new Date();
  if (!quiz.otp || !quiz.otpExpiresAt || new Date(quiz.otpExpiresAt) < now) {
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await prisma.quiz.update({
      where: { id: quiz.id },
      data: { otp: otpCode, otpExpiresAt }
    });

    // Store in Redis with 5-min TTL — this is the single source of truth
    await redis.setex(`otp:${quiz.quizId}`, 300, otpCode);
    await redis.del(`quiz:${quiz.quizId}`);

    quiz.otp = otpCode;
    quiz.otpExpiresAt = otpExpiresAt;
  }

  return quiz;
};

module.exports = {
  createQuiz,
  getQuizByQuizId,
  getQuizById,
  editQuiz,
  deleteQuiz,
  duplicateQuiz,
  generateNewOTP,
  verifyOTP,
  changeQuizStatus,
  getPublicQuizzes,
  getPublicQuizByQuizId,
  ensureActiveQuizOTP
};
