const prisma = require('../config/database');
const env = require('../config/env');
const logger = require('../utils/logger');

const logWarning = async (studentId, quizId, type, io) => {
  // Find internal Quiz
  const quiz = await prisma.quiz.findUnique({ where: { quizId } });
  if (!quiz) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }

  // Create warning
  const warning = await prisma.warning.create({
    data: {
      type,
      studentId,
      quizId: quiz.id
    },
    include: {
      student: {
        select: {
          name: true
        }
      }
    }
  });

  // Count total warnings for this student in this quiz
  const warningCount = await prisma.warning.count({
    where: {
      studentId,
      quizId: quiz.id
    }
  });

  const shouldForceSubmit = warningCount >= env.MAX_WARNINGS;

  // Emit real-time warnings to teacher monitor namespace/room
  if (io) {
    io.to(`exam:${quizId}:teacher`).emit('exam:warning', {
      studentId,
      name: warning.student.name,
      type,
      count: warningCount
    });

    // Broadcast system warning event to admins
    io.to('admin:audit').emit('admin:event', {
      type: 'warning',
      timestamp: new Date(),
      message: `Student "${warning.student.name}" triggered a "${type}" violation in Quiz "${quiz.title}" (warnings: ${warningCount}/${env.MAX_WARNINGS})`
    });

    if (shouldForceSubmit) {
      // Emit force-submit command to the student socket room
      io.to(`exam:${quizId}:${studentId}`).emit('student:force-submit', {
        reason: `Exceeded maximum warnings threshold (${env.MAX_WARNINGS})`
      });
    }
  }

  return { warningCount, shouldForceSubmit };
};

module.exports = {
  logWarning
};
