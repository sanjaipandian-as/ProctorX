/**
 * Student Routes Integration Tests
 * Tests: GET /api/students/me, PUT /api/students/me, GET /api/students/dashboard
 */
const { app, request, createTestStudent, createTestTeacher, cleanupTestData } = require('../helpers');

describe('Student Routes', () => {
  let studentToken;
  let teacherToken;

  beforeAll(async () => {
    const student = await createTestStudent({ name: 'Dashboard Student' });
    studentToken = student.token;

    const teacher = await createTestTeacher();
    teacherToken = teacher.token;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ─── GET /api/students/me ──────────────────────────────────────────
  describe('GET /api/students/me', () => {
    it('should return student profile with valid token', async () => {
      const res = await request(app)
        .get('/api/students/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Dashboard Student');
      expect(res.body).toHaveProperty('email');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/students/me');
      expect(res.status).toBe(401);
    });

    it('should return 403 with teacher token', async () => {
      const res = await request(app)
        .get('/api/students/me')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── PUT /api/students/me ──────────────────────────────────────────
  describe('PUT /api/students/me', () => {
    it('should update student name', async () => {
      const res = await request(app)
        .put('/api/students/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put('/api/students/me')
        .send({ name: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /api/students/dashboard ───────────────────────────────────
  describe('GET /api/students/dashboard', () => {
    it('should return dashboard data', async () => {
      const res = await request(app)
        .get('/api/students/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      // Dashboard may return profile + results
      expect(res.body).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/students/dashboard');
      expect(res.status).toBe(401);
    });
  });
});
