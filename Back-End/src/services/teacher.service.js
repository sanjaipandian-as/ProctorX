const prisma = require('../config/database');

const getProfile = async (teacherId) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      name: true,
      email: true,
      staffId: true,
      isApproved: true,
      aiAccess: true,
      createdAt: true
    }
  });

  if (!teacher) {
    const err = new Error('Teacher not found');
    err.statusCode = 404;
    throw err;
  }

  return teacher;
};

const getDashboard = async (teacherId) => {
  const quizzes = await prisma.quiz.findMany({
    where: { createdById: teacherId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { results: true, questions: true }
      }
    }
  });

  const totalQuizzes = quizzes.length;
  const activeQuizzes = quizzes.filter(q => q.status === 'ACTIVE').length;
  const totalSubmissions = quizzes.reduce((sum, q) => sum + q._count.results, 0);

  const formattedQuizzes = quizzes.map(q => ({
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

  return {
    stats: {
      totalQuizzes,
      activeQuizzes,
      totalSubmissions
    },
    quizzes: formattedQuizzes
  };
};

module.exports = {
  getProfile,
  getDashboard
};
