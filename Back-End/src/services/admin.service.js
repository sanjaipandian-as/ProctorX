const prisma = require('../config/database');
const env = require('../config/env');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendApprovalEmail } = require('./email.service');
const { withCache, redis } = require('../config/redis');

const loginAdmin = async (username, password) => {
  // Query admin database record
  const admin = await prisma.admin.findUnique({
    where: { username }
  });

  if (!admin) {
    const err = new Error('Invalid admin credentials');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid admin credentials');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: 'admin' },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, admin: { username: admin.username } };
};

const getPendingTeachers = async () => {
  return prisma.teacher.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: 'desc' }
  });
};

const approveTeacher = async (teacherId) => {
  const teacher = await prisma.teacher.update({
    where: { id: teacherId },
    data: { isApproved: true }
  });

  // Send approval email async
  sendApprovalEmail(teacher.email, teacher.name, true).catch(err => {
    console.error('Failed to send teacher approval email:', err.message);
  });

  await redis.del('admin:stats');

  return { message: 'Teacher approved successfully', teacher };
};

const rejectTeacher = async (teacherId, reason) => {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) {
    const err = new Error('Teacher not found');
    err.statusCode = 404;
    throw err;
  }

  // Delete registration record
  await prisma.teacher.delete({ where: { id: teacherId } });

  // Send rejection email async
  sendApprovalEmail(teacher.email, teacher.name, false, reason).catch(err => {
    console.error('Failed to send teacher rejection email:', err.message);
  });

  await redis.del('admin:stats');

  return { message: 'Teacher registration rejected' };
};

const getSystemStats = async () => {
  const fetchStats = async () => {
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    const approvedTeachers = await prisma.teacher.count({ where: { isApproved: true } });
    const pendingTeachers = totalTeachers - approvedTeachers;
    const totalQuizzes = await prisma.quiz.count();
    const totalResults = await prisma.result.count();

    return {
      totalStudents,
      totalTeachers,
      approvedTeachers,
      pendingTeachers,
      totalQuizzes,
      totalResults
    };
  };

  return withCache('admin:stats', 60, fetchStats);
};

const getAllStudents = async () => {
  return prisma.student.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      lastLogin: true,
      createdAt: true
    }
  });
};

const createTeacherByAdmin = async ({ name, email, password, staffId }) => {
  const existingEmail = await prisma.teacher.findUnique({ where: { email } });
  if (existingEmail) {
    const err = new Error('Email is already registered');
    err.statusCode = 400;
    throw err;
  }

  const existingStaff = await prisma.teacher.findUnique({ where: { staffId } });
  if (existingStaff) {
    const err = new Error('Staff ID is already registered');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const teacher = await prisma.teacher.create({
    data: {
      name,
      email,
      passwordHash,
      staffId,
      isApproved: true
    }
  });

  await redis.del('admin:stats');
  return { message: 'Teacher account created successfully', id: teacher.id, name: teacher.name };
};

const toggleAiAccess = async (teacherId, enabled) => {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) {
    const err = new Error('Teacher not found');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.teacher.update({
    where: { id: teacherId },
    data: { aiAccess: enabled }
  });
  return { message: `AI access ${enabled ? 'enabled' : 'disabled'} for ${updated.name}`, aiAccess: updated.aiAccess };
};

module.exports = {
  loginAdmin,
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  getSystemStats,
  getAllStudents,
  createTeacherByAdmin,
  toggleAiAccess
};
