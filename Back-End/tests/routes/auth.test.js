/**
 * Auth Routes Integration Tests
 * Tests: POST /api/auth/signup/student, POST /api/auth/login/student, POST /api/auth/login/teacher
 */
const { app, request, prisma, uniqueEmail, cleanupTestData } = require('../helpers');
const bcrypt = require('bcryptjs');

describe('Auth Routes', () => {
  afterAll(async () => {
    await cleanupTestData();
  });

  // ─── Student Signup ────────────────────────────────────────────────
  describe('POST /api/auth/signup/student', () => {
    it('should register a new student with valid data', async () => {
      const email = uniqueEmail('signup');
      const res = await request(app)
        .post('/api/auth/signup/student')
        .send({
          name: 'John Doe',
          email,
          password: 'Test@123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('student');
      expect(res.body.student.email).toBe(email);
      expect(res.body.student.name).toBe('John Doe');
    });

    it('should return 409 for duplicate email', async () => {
      const email = uniqueEmail('dup');
      // First registration
      await request(app)
        .post('/api/auth/signup/student')
        .send({ name: 'Student A', email, password: 'Test@123' });

      // Duplicate registration
      const res = await request(app)
        .post('/api/auth/signup/student')
        .send({ name: 'Student B', email, password: 'Test@456' });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already/i);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/signup/student')
        .send({ name: 'No Email Student' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/validation/i);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/signup/student')
        .send({ name: 'Bad Email', email: 'not-an-email', password: 'Test@123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/signup/student')
        .send({ name: 'Short Pass', email: uniqueEmail('shortpass'), password: '12' });

      expect(res.status).toBe(400);
    });
  });

  // ─── Student Login ─────────────────────────────────────────────────
  describe('POST /api/auth/login/student', () => {
    const loginEmail = `login_student_${Date.now()}@test.proctorx.com`;

    beforeAll(async () => {
      // Pre-create a student for login tests
      const passwordHash = await bcrypt.hash('LoginPass123', 10);
      await prisma.student.create({
        data: { name: 'Login Student', email: loginEmail, passwordHash }
      });
    });

    it('should login with valid credentials and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login/student')
        .send({ email: loginEmail, password: 'LoginPass123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('student');
      expect(res.body.student.email).toBe(loginEmail);
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login/student')
        .send({ email: loginEmail, password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login/student')
        .send({ email: 'ghost@nowhere.com', password: 'anything' });

      expect(res.status).toBe(401);
    });
  });

  // ─── Teacher Login ─────────────────────────────────────────────────
  describe('POST /api/auth/login/teacher', () => {
    const approvedEmail = `teacher_approved_${Date.now()}@test.proctorx.com`;
    const unapprovedEmail = `teacher_pending_${Date.now()}@test.proctorx.com`;

    beforeAll(async () => {
      const hash = await bcrypt.hash('TeacherPass1', 10);
      await prisma.teacher.create({
        data: { name: 'Approved Teacher', email: approvedEmail, passwordHash: hash, staffId: `STAFF_A_${Date.now()}`, isApproved: true }
      });
      await prisma.teacher.create({
        data: { name: 'Pending Teacher', email: unapprovedEmail, passwordHash: hash, staffId: `STAFF_P_${Date.now()}`, isApproved: false }
      });
    });

    it('should login an approved teacher', async () => {
      const res = await request(app)
        .post('/api/auth/login/teacher')
        .send({ email: approvedEmail, password: 'TeacherPass1' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('teacher');
    });

    it('should return 403 for unapproved teacher', async () => {
      const res = await request(app)
        .post('/api/auth/login/teacher')
        .send({ email: unapprovedEmail, password: 'TeacherPass1' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/pending|approval/i);
    });

    it('should return 401 for wrong credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login/teacher')
        .send({ email: approvedEmail, password: 'WrongPassword' });

      expect(res.status).toBe(401);
    });
  });
});
