const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const env = require('../config/env');
const { sendWelcomeEmail } = require('./email.service');

const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
};

const signupStudent = async ({ name, email, password, profilePic }) => {
  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.student.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const student = await prisma.student.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      profilePic
    }
  });

  const payload = { id: student.id, name: student.name, email: student.email, role: 'student' };
  const token = generateToken(payload);

  // Send email asynchronously
  sendWelcomeEmail(student.email, student.name, 'student').catch(err => {
    console.error('Failed to send welcome email to student:', err.message);
  });

  return {
    token,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      profilePic: student.profilePic
    }
  };
};

const loginStudent = async (email, password) => {
  const normalizedEmail = email.toLowerCase();
  const student = await prisma.student.findUnique({ where: { email: normalizedEmail } });
  if (!student) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, student.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (!student.isActive) {
    const err = new Error('Your account has been deactivated');
    err.statusCode = 403;
    throw err;
  }

  // Update lastLogin
  await prisma.student.update({
    where: { id: student.id },
    data: { lastLogin: new Date() }
  });

  const payload = { id: student.id, name: student.name, email: student.email, role: 'student' };
  const token = generateToken(payload);

  return {
    token,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      profilePic: student.profilePic
    }
  };
};

const signupTeacher = async ({ name, email, password, staffId, profilePic }) => {
  const normalizedEmail = email.toLowerCase();
  const existingEmail = await prisma.teacher.findUnique({ where: { email: normalizedEmail } });
  if (existingEmail) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const existingStaff = await prisma.teacher.findUnique({ where: { staffId } });
  if (existingStaff) {
    const err = new Error('Staff ID already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const teacher = await prisma.teacher.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      staffId,
      isApproved: false // Requires admin approval
    }
  });

  // Send welcome email
  sendWelcomeEmail(teacher.email, teacher.name, 'teacher').catch(err => {
    console.error('Failed to send welcome email to teacher:', err.message);
  });

  return {
    message: 'Registration successful. Waiting for admin approval.',
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      staffId: teacher.staffId,
      isApproved: teacher.isApproved
    }
  };
};

const loginTeacher = async (email, password) => {
  const normalizedEmail = email.toLowerCase();
  const teacher = await prisma.teacher.findUnique({ where: { email: normalizedEmail } });
  if (!teacher) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, teacher.passwordHash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (!teacher.isApproved) {
    const err = new Error('Your account is pending administrator approval');
    err.statusCode = 403;
    throw err;
  }

  const payload = { id: teacher.id, name: teacher.name, email: teacher.email, role: 'teacher', aiAccess: teacher.aiAccess };
  const token = generateToken(payload);

  return {
    token,
    teacher: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      staffId: teacher.staffId,
      aiAccess: teacher.aiAccess
    }
  };
};

module.exports = {
  signupStudent,
  loginStudent,
  signupTeacher,
  loginTeacher
};
