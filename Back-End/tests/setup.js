/**
 * Global test setup and teardown for ProctorX integration tests.
 * Seeds the admin user and cleans up all test data after completion.
 */
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  // Seed default admin if not exists
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const passwordHash = await bcrypt.hash('testpassword123', 10);
    await prisma.admin.create({
      data: {
        username: 'admin',
        passwordHash
      }
    });
  }
});

afterAll(async () => {
  // Clean up all test data in FK-safe order
  try {
    await prisma.response.deleteMany({});
    await prisma.warning.deleteMany({});
    await prisma.result.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.quiz.deleteMany({});
    await prisma.classroom.deleteMany({});
    await prisma.teacher.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.admin.deleteMany({});
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
  
  await prisma.$disconnect();
});
