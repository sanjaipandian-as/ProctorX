const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { registerExamHandlers } = require('./exam.socket');
const logger = require('../utils/logger');

const registerSocketHandlers = (io) => {
  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Socket Authentication Error: Token is missing'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
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
