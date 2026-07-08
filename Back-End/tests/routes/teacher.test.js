/**
 * Teacher Routes Integration Tests
 * Tests: GET /api/teachers/me, GET /api/teachers/dashboard
 */
const { app, request, createTestTeacher, createTestStudent, cleanupTestData } = require('../helpers');

describe('Teacher Routes', () => {
  let teacherToken;
  let studentToken;

  beforeAll(async () => {
    const teacher = await createTestTeacher({ name: 'Prof Smith' });
    teacherToken = teacher.token;

    const student = await createTestStudent();
    studentToken = student.token;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ─── GET /api/teachers/me ──────────────────────────────────────────
  describe('GET /api/teachers/me', () => {
    it('should return teacher profile with valid token', async () => {
      const res = await request(app)
        .get('/api/teachers/me')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Prof Smith');
    });

    it('should return 403 with student token', async () => {
      const res = await request(app)
        .get('/api/teachers/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/teachers/me');
      expect(res.status).toBe(401);
    });
  });

  // ─── GET /api/teachers/dashboard ───────────────────────────────────
  describe('GET /api/teachers/dashboard', () => {
    it('should return teacher dashboard', async () => {
      const res = await request(app)
        .get('/api/teachers/dashboard')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/teachers/dashboard');
      expect(res.status).toBe(401);
    });
  });
});
