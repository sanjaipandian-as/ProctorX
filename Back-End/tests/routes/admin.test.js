/**
 * Admin Routes Integration Tests
 * Tests: POST /login, GET /teachers/pending, PUT /approve, PUT /reject, GET /stats, GET /students, POST /teachers
 */
const { app, request, createTestStudent, cleanupTestData, prisma, uniqueEmail, uniqueStaffId } = require('../helpers');
const bcrypt = require('bcryptjs');

describe('Admin Routes', () => {
  let adminToken;
  let pendingTeacherId;

  beforeAll(async () => {
    // Ensure admin exists (setup.js seeds it)
    // Login as admin
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'testpassword123' });

    adminToken = res.body.token;

    // Create a pending teacher for approval/reject tests
    const hash = await bcrypt.hash('TeacherPending1', 10);
    const teacher = await prisma.teacher.create({
      data: {
        name: 'Pending Teacher',
        email: uniqueEmail('pendingteacher'),
        passwordHash: hash,
        staffId: uniqueStaffId(),
        isApproved: false
      }
    });
    pendingTeacherId = teacher.id;

    // Create some students for listing tests
    await createTestStudent({ name: 'Admin View Student 1' });
    await createTestStudent({ name: 'Admin View Student 2' });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ─── POST /api/admin/login ─────────────────────────────────────────
  describe('POST /api/admin/login', () => {
    it('should login admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'testpassword123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('admin');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent admin', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'ghost_admin', password: 'anything' });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /api/admin/teachers/pending ───────────────────────────────
  describe('GET /api/admin/teachers/pending', () => {
    it('should return pending teachers list', async () => {
      const res = await request(app)
        .get('/api/admin/teachers/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/admin/teachers/pending');
      expect(res.status).toBe(401);
    });
  });

  // ─── PUT /api/admin/teachers/:id/approve ───────────────────────────
  describe('PUT /api/admin/teachers/:id/approve', () => {
    it('should approve a pending teacher', async () => {
      const res = await request(app)
        .put(`/api/admin/teachers/${pendingTeacherId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/approved/i);

      // Verify in DB
      const teacher = await prisma.teacher.findUnique({ where: { id: pendingTeacherId } });
      expect(teacher.isApproved).toBe(true);
    });
  });

  // ─── PUT /api/admin/teachers/:id/reject ────────────────────────────
  describe('PUT /api/admin/teachers/:id/reject', () => {
    let rejectTeacherId;

    beforeAll(async () => {
      const hash = await bcrypt.hash('RejectMe123', 10);
      const teacher = await prisma.teacher.create({
        data: {
          name: 'Reject Teacher',
          email: uniqueEmail('rejectteacher'),
          passwordHash: hash,
          staffId: uniqueStaffId(),
          isApproved: false
        }
      });
      rejectTeacherId = teacher.id;
    });

    it('should reject a teacher with reason', async () => {
      const res = await request(app)
        .put(`/api/admin/teachers/${rejectTeacherId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Invalid staff credentials' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/rejected/i);
    });
  });

  // ─── GET /api/admin/stats ──────────────────────────────────────────
  describe('GET /api/admin/stats', () => {
    it('should return system stats', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalStudents');
      expect(res.body).toHaveProperty('totalTeachers');
      expect(res.body).toHaveProperty('totalQuizzes');
    });
  });

  // ─── GET /api/admin/students ───────────────────────────────────────
  describe('GET /api/admin/students', () => {
    it('should return all students', async () => {
      const res = await request(app)
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── POST /api/admin/teachers ──────────────────────────────────────
  describe('POST /api/admin/teachers', () => {
    it('should create a teacher as admin (auto-approved)', async () => {
      const res = await request(app)
        .post('/api/admin/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created Teacher',
          email: uniqueEmail('admincreated'),
          password: 'AdminCreated1',
          staffId: uniqueStaffId()
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/created/i);
    });

    it('should return 400 for duplicate email', async () => {
      const email = uniqueEmail('dupteacher');
      // Create first
      await request(app)
        .post('/api/admin/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'T1', email, password: 'Pass123', staffId: uniqueStaffId() });

      // Duplicate
      const res = await request(app)
        .post('/api/admin/teachers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'T2', email, password: 'Pass456', staffId: uniqueStaffId() });

      expect(res.status).toBe(400);
    });
  });
});
