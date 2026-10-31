const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { registerExamHandlers } = require('./exam.socket');
const logger = require('../utils/logger');
const prisma = require('../config/database');

const registerSocketHandlers = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Socket Authentication Error: Token is missing'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
      if (!decoded.id || !['student', 'teacher', 'admin'].includes(decoded.role)) {
        return next(new Error('Socket Authentication Error: invalid claims'));
      }
      const selectors = {
        student: { id: decoded.id, isActive: true },
        teacher: { id: decoded.id, isApproved: true },
        admin: { id: decoded.id }
      };
      const model = decoded.role === 'student' ? prisma.student : decoded.role === 'teacher' ? prisma.teacher : prisma.admin;
      const currentUser = await model.findFirst({ where: selectors[decoded.role] });
      if (!currentUser) return next(new Error('Socket Authentication Error: account is inactive or unavailable'));
      socket.user = {
        id: currentUser.id,
        role: decoded.role,
        name: currentUser.name,
        email: currentUser.email,
        username: currentUser.username
      };
      next();
    } catch (error) {
      logger.error('Socket authentication validation failed:', error.message);
      next(new Error('Socket Authentication Error: Token is invalid'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id} (user: ${socket.user.name || socket.user.username})`);

    // Register exam handlers
    registerExamHandlers(io, socket);

    socket.on('error', (err) => {
      logger.error(`Socket error for client ${socket.id}:`, err);
    });
  });
};

module.exports = registerSocketHandlers;
