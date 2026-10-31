const prisma = require('../config/database');
const env = require('../config/env');
const logger = require('../utils/logger');

const logWarning = async (studentId, quizId, type, io) => {
  if (!['FULLSCREEN', 'TAB_SWITCH', 'FACE_MISSING', 'OTHER'].includes(type)) {
    const err = new Error('Invalid warning type');
    err.statusCode = 400;
    throw err;
  }
  // Find internal Quiz
  const quiz = await prisma.quiz.findUnique({ where: { quizId } });
  if (!quiz) {
    const err = new Error('Quiz not found');
    err.statusCode = 404;
    throw err;
  }
  if (quiz.status !== 'ACTIVE' || (quiz.endsAt && quiz.endsAt <= new Date())) {
    const err = new Error('Quiz is not active');
    err.statusCode = 403;
    throw err;
  }

  const existingWarningCount = await prisma.warning.count({
    where: {
      studentId,
      quizId: quiz.id
    }
  });

  if (existingWarningCount >= env.MAX_WARNINGS) {
    if (io) {
      io.to(`exam:${quizId}:${studentId}`).emit('student:force-submit', {
        reason: `Exceeded maximum warnings threshold (${env.MAX_WARNINGS})`
      });
    }
    return { warningCount: existingWarningCount, shouldForceSubmit: true };
  }

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

  const warningCount = existingWarningCount + 1;

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
