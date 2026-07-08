/**
 * Classroom Routes Integration Tests
 * Tests: POST /, GET /, GET /:id, POST /:id/students, DELETE /:id/students/:sid, POST /join
 */
const { app, request, createTestTeacher, createTestStudent, cleanupTestData, prisma } = require('../helpers');

describe('Classroom Routes', () => {
  let teacherToken, teacherId;
  let studentToken, studentId;
  let student2Token, student2Id;
  let classroomId, classroomCode;

  beforeAll(async () => {
    const teacher = await createTestTeacher({ name: 'Classroom Teacher' });
    teacherToken = teacher.token;
    teacherId = teacher.teacher.id;

    const student = await createTestStudent({ name: 'Classroom Student 1' });
    studentToken = student.token;
    studentId = student.student.id;

    const student2 = await createTestStudent({ name: 'Classroom Student 2' });
    student2Token = student2.token;
    student2Id = student2.student.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ─── POST /api/classrooms ─────────────────────────────────────────
  describe('POST /api/classrooms', () => {
    it('should create a classroom as teacher', async () => {
      const res = await request(app)
        .post('/api/classrooms')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: 'CSE Section A' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('code');
      classroomId = res.body.id;
      classroomCode = res.body.code;
    });

    it('should return 403 for student trying to create', async () => {
      const res = await request(app)
        .post('/api/classrooms')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Student Classroom' });

      expect(res.status).toBe(403);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/classrooms')
        .send({ name: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /api/classrooms ──────────────────────────────────────────
  describe('GET /api/classrooms', () => {
    it('should return teacher classrooms', async () => {
      const res = await request(app)
        .get('/api/classrooms')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── POST /api/classrooms/:id/students ─────────────────────────────
  describe('POST /api/classrooms/:id/students', () => {
    it('should add a student to classroom', async () => {
      const res = await request(app)
        .post(`/api/classrooms/${classroomId}/students`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ studentId });

      expect(res.status).toBe(200);
    });
  });

  // ─── GET /api/classrooms/:id ──────────────────────────────────────
  describe('GET /api/classrooms/:id', () => {
    it('should return classroom details with students', async () => {
      const res = await request(app)
        .get(`/api/classrooms/${classroomId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'CSE Section A');
      expect(res.body).toHaveProperty('students');
    });
  });

  // ─── POST /api/classrooms/join (Student self-enroll) ───────────────
  describe('POST /api/classrooms/join', () => {
    it('should allow student to join with classroom code', async () => {
      const res = await request(app)
        .post('/api/classrooms/join')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ code: classroomCode });

      expect(res.status).toBe(200);
    });

    it('should return 400 without classroom code', async () => {
      const res = await request(app)
        .post('/api/classrooms/join')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should handle invalid classroom code', async () => {
      const res = await request(app)
        .post('/api/classrooms/join')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ code: 'INVALID_CODE_999' });

      expect([400, 404]).toContain(res.status);
    });
  });

  // ─── GET /api/classrooms/students/search ───────────────────────────
  describe('GET /api/classrooms/students/search', () => {
    it('should search students by name', async () => {
      const res = await request(app)
        .get('/api/classrooms/students/search?q=Classroom')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── DELETE /api/classrooms/:id/students/:sid ──────────────────────
  describe('DELETE /api/classrooms/:id/students/:sid', () => {
    it('should remove a student from classroom', async () => {
      const res = await request(app)
        .delete(`/api/classrooms/${classroomId}/students/${studentId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
    });
  });
});
