const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

const getProfile = async (studentId) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      profilePic: true,
      isActive: true,
      createdAt: true
    }
  });

  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }

  return student;
};

const updateProfile = async (studentId, { name, email, password, profilePic }) => {
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (profilePic) updateData.profilePic = profilePic;
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  const student = await prisma.student.update({
    where: { id: studentId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      profilePic: true
    }
  });

  return student;
};

const getDashboard = async (studentId) => {
  const student = await getProfile(studentId);

  // Fetch results sorted by completedAt
  const results = await prisma.result.findMany({
    where: { studentId },
    include: {
      quiz: {
        select: {
          title: true,
          questions: {
            select: {
              id: true
            }
          }
        }
      }
    },
    orderBy: { completedAt: 'desc' }
  });

  const formattedQuizzes = results.map(r => ({
    resultId: r.id,
    quizTitle: r.quiz?.title || 'Deleted Quiz',
    score: r.score,
    totalQuestions: r.totalQuestions,
    accuracy: r.accuracy,
    completedAt: r.completedAt
  }));

  // Fetch enrolled classrooms
  const enrolledClassrooms = await prisma.classroom.findMany({
    where: {
      students: {
        some: { id: studentId }
      }
    },
    select: { id: true }
  });
  const classroomIds = enrolledClassrooms.map(c => c.id);

  // Find all ACTIVE/PENDING quizzes matching this student that haven't been attempted yet
  const attemptedQuizIds = results.map(r => r.quizId);

  const upcomingQuizzes = await prisma.quiz.findMany({
    where: {
      status: { in: ['PENDING', 'ACTIVE'] },
      id: { notIn: attemptedQuizIds },
      OR: [
        { classroomId: { in: classroomIds } },
        { allowedStudents: { has: student.email } }
      ]
    },
    select: {
      id: true,
      quizId: true,
      title: true,
      status: true,
      durationInMinutes: true,
      scheduledAt: true,
      otp: true,
      otpExpiresAt: true
    },
    orderBy: { scheduledAt: 'asc' }
  });

  return {
    profile: {
      name: student.name,
      email: student.email,
      profilePicture: student.profilePic
    },
    quizzes: formattedQuizzes,
    upcomingQuizzes
  };
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboard
};
