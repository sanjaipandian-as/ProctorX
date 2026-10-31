const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/database');
const logger = require('../utils/logger');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2 || !parts[1]) {
      return res.status(401).json({ message: 'Invalid authorization header' });
    }
    const decoded = jwt.verify(parts[1], env.JWT_SECRET, { algorithms: ['HS256'] });

    let user = null;

    if (decoded.role === 'student') {
      user = await prisma.student.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, profilePic: true, isActive: true }
      });
      if (user && !user.isActive) {
        return res.status(403).json({ message: 'Your student account has been deactivated' });
      }
    } else if (decoded.role === 'teacher') {
      user = await prisma.teacher.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, staffId: true, isApproved: true, aiAccess: true }
      });
      if (user && !user.isApproved) {
        return res.status(403).json({ message: 'Your teacher account is pending admin approval' });
      }
    } else if (decoded.role === 'admin') {
      user = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true }
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found or session invalid' });
    }

    req.user = {
      ...user,
      role: decoded.role
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    return res.status(401).json({ message: 'Invalid or malformed authorization token' });
  }
};

module.exports = {
  verifyToken
};
