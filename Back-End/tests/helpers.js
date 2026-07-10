/**
 * Shared test helpers and factories for ProctorX integration tests.
 * Creates test entities through real API calls (supertest) so the
 * full middleware chain (validation, auth, services) is exercised.
 */
const request = require('supertest');
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');

// We import the Express app (not the HTTP server) to avoid socket/scheduler side effects
const app = require('../src/app');

let counter = 0;

/**
 * Generate a unique email for each test entity to avoid collisions.
 */
function uniqueEmail(prefix = 'test') {
  counter++;
  return `${prefix}_${Date.now()}_${counter}@test.proctorx.com`;
}

/**
 * Generate a unique staff ID for teacher registration.
 */
function uniqueStaffId() {
  counter++;
  return `STAFF_${Date.now()}_${counter}`;
}

/**
 * Create a test student directly via Prisma (bypasses API for speed).
 * Returns { student, token }.
 */
async function createTestStudent(overrides = {}) {
  const email = overrides.email || uniqueEmail('student');
  const passwordHash = await bcrypt.hash(overrides.password || 'Test@123', 10);

  const student = await prisma.student.create({
    data: {
      name: overrides.name || 'Test Student',
      email,
      passwordHash,
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      ...( overrides.profilePic ? { profilePic: overrides.profilePic } : {})
    }
  });

  const token = jwt.sign(
    { id: student.id, name: student.name, email: student.email, role: 'student' },
    env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { student, token };
}

/**
 * Create a test teacher directly via Prisma. Auto-approved by default.
 * Returns { teacher, token }.
 */
async function createTestTeacher(overrides = {}) {
  const email = overrides.email || uniqueEmail('teacher');
  const passwordHash = await bcrypt.hash(overrides.password || 'Test@123', 10);

  const teacher = await prisma.teacher.create({
    data: {
      name: overrides.name || 'Test Teacher',
      email,
      passwordHash,
      staffId: overrides.staffId || uniqueStaffId(),
      isApproved: overrides.isApproved !== undefined ? overrides.isApproved : true,
      aiAccess: overrides.aiAccess || false
    }
  });

  const token = jwt.sign(
    { id: teacher.id, name: teacher.name, email: teacher.email, role: 'teacher' },
    env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { teacher, token };
}

/**
 * Get admin JWT token by logging in as seeded admin.
 */
async function getAdminToken() {
  const res = await request(app)
    .post('/api/admin/login')
    .send({ username: 'admin', password: 'testpassword123' });

  if (res.status !== 200) {
    throw new Error(`Admin login failed: ${res.body.message}`);
  }

  return res.body.token;
}

/**
 * Create a test quiz with sample MCQ questions.
 * Returns the full quiz object from the API response.
 */
async function createTestQuiz(teacherToken, overrides = {}) {
  const quizData = {
    title: overrides.title || 'Test Quiz',
    durationInMinutes: overrides.durationInMinutes || 30,
    allowedStudents: overrides.allowedStudents || [],
    questions: overrides.questions || [
      {
        questionText: 'What is 2 + 2?',
        questionType: 'mcq',
        options: ['1', '2', '3', '4'],
        correctAns: 3,
        order: 0,
        marks: 1
      },
      {
        questionText: 'What is the capital of India?',
        questionType: 'mcq',
        options: ['Mumbai', 'Delhi', 'Chennai', 'Kolkata'],
        correctAns: 1,
        order: 1,
        marks: 1
      }
    ]
  };

  const res = await request(app)
    .post('/api/quizzes')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send(quizData);

  if (res.status !== 201) {
    throw new Error(`Quiz creation failed: ${JSON.stringify(res.body)}`);
  }

  return res.body;
}

/**
 * Clean up test data created during a test suite.
 * Deletes in FK-safe order.
 */
async function cleanupTestData() {
  await prisma.response.deleteMany({});
  await prisma.warning.deleteMany({});
  await prisma.result.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.classroom.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.student.deleteMany({});
}

module.exports = {
  app,
  request,
  prisma,
  uniqueEmail,
  uniqueStaffId,
  createTestStudent,
  createTestTeacher,
  getAdminToken,
  createTestQuiz,
  cleanupTestData
};
