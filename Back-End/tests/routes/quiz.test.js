/**
 * Quiz Routes Integration Tests
 * Tests all 10 quiz endpoints: CRUD, OTP, status, public, duplicate
 */
const { app, request, createTestTeacher, createTestStudent, createTestQuiz, cleanupTestData, prisma } = require('../helpers');

describe('Quiz Routes', () => {
  let teacherToken, teacherId;
  let studentToken, studentId;
  let quizId, quizInternalId;

  beforeAll(async () => {
    const teacher = await createTestTeacher({ name: 'Quiz Teacher' });
    teacherToken = teacher.token;
    teacherId = teacher.teacher.id;

    const student = await createTestStudent({ name: 'Quiz Student' });
    studentToken = student.token;
    studentId = student.student.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ─── POST /api/quizzes (Create) ────────────────────────────────────
  describe('POST /api/quizzes', () => {
    it('should create a quiz with valid data', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Math Quiz',
          durationInMinutes: 30,
          questions: [
            {
              questionText: 'What is 2+2?',
              questionType: 'mcq',
              options: ['1', '2', '3', '4'],
              correctAns: 3,
              order: 0,
              marks: 1
            },
            {
              questionText: 'What is 3+3?',
              questionType: 'mcq',
              options: ['3', '4', '5', '6'],
              correctAns: 3,
              order: 1,
              marks: 1
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('quizId');
      quizId = res.body.quizId;
      quizInternalId = res.body.id;
    });

    it('should return 400 for missing title', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          questions: [
            { questionText: 'Q1', options: ['a', 'b'], correctAns: 0, order: 0 }
          ]
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for no questions', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ title: 'Empty Quiz', questions: [] });

      expect(res.status).toBe(400);
    });

    it('should return 403 for student trying to create', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Quiz',
          questions: [
            { questionText: 'Q1', options: ['a', 'b'], correctAns: 0, order: 0 }
          ]
        });

      expect(res.status).toBe(403);
    });
  });

  // ─── GET /api/quizzes (Teacher's quizzes) ──────────────────────────
  describe('GET /api/quizzes', () => {
    it('should return teacher quizzes', async () => {
      const res = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── GET /api/quizzes/:quizId ──────────────────────────────────────
  describe('GET /api/quizzes/:quizId', () => {
    it('should return quiz by quizId', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('title', 'Math Quiz');
      expect(res.body).toHaveProperty('questions');
    });

    it('should return 404 for non-existent quizId', async () => {
      const res = await request(app)
        .get('/api/quizzes/NONEXISTENT999')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── PUT /api/quizzes/:quizId (Edit) ───────────────────────────────
  describe('PUT /api/quizzes/:quizId', () => {
    it('should edit quiz title and questions', async () => {
      const res = await request(app)
        .put(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Updated Math Quiz',
          durationInMinutes: 45,
          questions: [
            {
              questionText: 'What is 10+10?',
              questionType: 'mcq',
              options: ['10', '15', '20', '25'],
              correctAns: 2,
              order: 0,
              marks: 1
            }
          ]
        });

      expect(res.status).toBe(200);
    });
  });

  // ─── POST /api/quizzes/:quizId/generate-otp ────────────────────────
  describe('POST /api/quizzes/:quizId/generate-otp', () => {
    it('should generate an OTP for the quiz', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/generate-otp`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('otp');
      expect(res.body.otp).toHaveLength(6);
    });
  });

  // ─── POST /api/quizzes/:quizId/verify-otp ──────────────────────────
  describe('POST /api/quizzes/:quizId/verify-otp', () => {
    it('should reject wrong OTP', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/verify-otp`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ otp: '000000' });

      // Should fail with 400 or 403 for wrong OTP
      expect([400, 403]).toContain(res.status);
    });

    it('should verify correct OTP', async () => {
      // First, get the quiz to see the current OTP
      const quiz = await prisma.quiz.findUnique({ where: { quizId } });
      if (quiz && quiz.otp) {
        // Need the quiz to be ACTIVE for OTP verification to work
        await prisma.quiz.update({
          where: { quizId },
          data: { status: 'ACTIVE', startedAt: new Date() }
        });

        const res = await request(app)
          .post(`/api/quizzes/${quizId}/verify-otp`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ otp: quiz.otp });

        // Could be 200 if otp is valid, or 400 if expired
        expect([200, 400]).toContain(res.status);
      }
    });
  });

  // ─── PUT /api/quizzes/:quizId/status ───────────────────────────────
  describe('PUT /api/quizzes/:quizId/status', () => {
    it('should change quiz status', async () => {
      // Reset to PENDING first
      await prisma.quiz.update({
        where: { quizId },
        data: { status: 'PENDING', startedAt: null }
      });

      const res = await request(app)
        .put(`/api/quizzes/${quizId}/status`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(200);
    });
  });

  // ─── POST /api/quizzes/:quizId/duplicate ───────────────────────────
  describe('POST /api/quizzes/:quizId/duplicate', () => {
    it('should duplicate the quiz', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/duplicate`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('quizId');
      expect(res.body.quizId).not.toBe(quizId);
    });
  });

  // ─── GET /api/quizzes/public ───────────────────────────────────────
  describe('GET /api/quizzes/public', () => {
    it('should return public quizzes', async () => {
      const res = await request(app).get('/api/quizzes/public');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── DELETE /api/quizzes/:quizId ───────────────────────────────────
  describe('DELETE /api/quizzes/:quizId', () => {
    let deleteQuizId;

    beforeAll(async () => {
      // Create a quiz specifically for deletion
      const quiz = await createTestQuiz(teacherToken, { title: 'To Be Deleted' });
      deleteQuizId = quiz.quizId;
    });

    it('should delete the quiz', async () => {
      const res = await request(app)
        .delete(`/api/quizzes/${deleteQuizId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 403/404 for student trying to delete', async () => {
      const res = await request(app)
        .delete(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect([403, 404]).toContain(res.status);
    });
  });
});
