const warningService = require('../services/warning.service');
const logger = require('../utils/logger');
const prisma = require('../config/database');

// Store active connections to manage heartbeats & connection statuses
const activeSessions = new Map(); // key: studentId:quizId -> { name, lastHeartbeat, socketId }

const registerExamHandlers = (io, socket) => {
  socket.on('student:join', async ({ quizId, studentId, name }) => {
    if (socket.user.role !== 'student' || socket.user.id !== studentId || typeof quizId !== 'string') return;
    const quiz = await prisma.quiz.findUnique({ where: { quizId }, select: { status: true, endsAt: true, allowedStudents: true, classroomId: true } });
    if (!quiz || quiz.status !== 'ACTIVE' || (quiz.endsAt && quiz.endsAt < new Date()) || (quiz.allowedStudents.length && !quiz.allowedStudents.includes(socket.user.email))) return;
    if (quiz.classroomId) {
      const enrolled = await prisma.classroom.findFirst({ where: { id: quiz.classroomId, students: { some: { id: studentId } } }, select: { id: true } });
      if (!enrolled) return;
    }
    logger.info(`Socket student:join -> student: ${name} (${studentId}), quiz: ${quizId}`);
    
    socket.join(`exam:${quizId}`);
    socket.join(`exam:${quizId}:${studentId}`);

    activeSessions.set(`${studentId}:${quizId}`, {
      name,
      lastHeartbeat: Date.now(),
      socketId: socket.id
    });

    // Notify teacher monitors that a student has joined
    io.to(`exam:${quizId}:teacher`).emit('exam:student-joined', {
      studentId,
      name,
      status: 'active'
    });

    // Broadcast event to admin audit room
    io.to('admin:audit').emit('admin:event', {
      type: 'join',
      timestamp: new Date(),
      message: `Student "${name}" entered Quiz ID "${quizId}"`
    });
  });

  socket.on('student:warning', async ({ quizId, studentId, type }) => {
    if (socket.user.role !== 'student' || socket.user.id !== studentId || typeof quizId !== 'string') return;
    logger.info(`Socket student:warning -> student: ${studentId}, quiz: ${quizId}, type: ${type}`);
    try {
      await warningService.logWarning(studentId, quizId, type, io);
    } catch (err) {
      logger.error('Error logging socket warning:', err);
    }
  });

  socket.on('student:heartbeat', ({ quizId, studentId }) => {
    if (socket.user.role !== 'student' || socket.user.id !== studentId) return;
    const sessionKey = `${studentId}:${quizId}`;
    if (activeSessions.has(sessionKey)) {
      activeSessions.get(sessionKey).lastHeartbeat = Date.now();
    }
  });

  socket.on('student:submitted', ({ quizId, studentId }) => {
    if (socket.user.role !== 'student' || socket.user.id !== studentId) return;
    logger.info(`Socket student:submitted -> student: ${studentId}, quiz: ${quizId}`);
    activeSessions.delete(`${studentId}:${quizId}`);

    io.to(`exam:${quizId}:teacher`).emit('exam:student-submitted', {
      studentId
    });

    // Broadcast event to admin audit room
    io.to('admin:audit').emit('admin:event', {
      type: 'submit',
      timestamp: new Date(),
      message: `Student ID "${studentId}" finished Quiz ID "${quizId}"`
    });
  });

  socket.on('admin:join-audit', () => {
    if (socket.user && socket.user.role === 'admin') {
      logger.info(`Socket admin:join-audit -> admin client joined room`);
      socket.join('admin:audit');
    }
  });

  socket.on('teacher:monitor', async ({ quizId }) => {
    if (socket.user.role !== 'teacher' || typeof quizId !== 'string') return;
    const quiz = await prisma.quiz.findUnique({ where: { quizId }, select: { createdById: true } });
    if (!quiz || quiz.createdById !== socket.user.id) return;
    logger.info(`Socket teacher:monitor -> quiz: ${quizId}`);
    socket.join(`exam:${quizId}:teacher`);

    // Send the teacher the initial state of active student sessions for this quiz
    const activeStudents = [];
    activeSessions.forEach((value, key) => {
      const [sId, qId] = key.split(':');
      if (qId === quizId) {
        activeStudents.push({
          studentId: sId,
          name: value.name,
          status: 'active'
        });
      }
    });

    socket.emit('exam:initial-students', activeStudents);
  });

  socket.on('teacher:force-submit', async ({ quizId, studentId }) => {
    if (socket.user.role !== 'teacher' || typeof quizId !== 'string' || typeof studentId !== 'string') return;
    const quiz = await prisma.quiz.findUnique({ where: { quizId }, select: { createdById: true } });
    if (!quiz || quiz.createdById !== socket.user.id) return;
    logger.info(`Socket teacher:force-submit -> student: ${studentId}, quiz: ${quizId}`);
    io.to(`exam:${quizId}:${studentId}`).emit('student:force-submit', {
      reason: 'Force-submitted by teacher/proctor monitor'
    });
  });

  socket.on('disconnect', () => {
    activeSessions.forEach((value, key) => {
      if (value.socketId === socket.id) {
        const [studentId, quizId] = key.split(':');
        activeSessions.delete(key);
        
        logger.info(`Socket disconnect -> Student: ${value.name} (${studentId}), quiz: ${quizId}`);
        io.to(`exam:${quizId}:teacher`).emit('exam:student-disconnected', {
          studentId
        });
      }
    });
  });
};

// Periodically clean stale connections
setInterval(() => {
  const now = Date.now();
  activeSessions.forEach((value, key) => {
    if (now - value.lastHeartbeat > 45000) { // 45 seconds without heartbeat
      const [studentId, quizId] = key.split(':');
      activeSessions.delete(key);
      logger.info(`Heartbeat timeout -> Student session removed: ${studentId}:${quizId}`);
    }
  });
}, 30000);

module.exports = {
  registerExamHandlers,
  activeSessions
};
