/**
 * Result Routes Integration Tests
 * Tests: POST /submit, GET /check/:quizId, GET /:resultId, GET /quiz/:quizId, GET /export/:quizId
 */
const { app, request, createTestTeacher, createTestStudent, createTestQuiz, cleanupTestData, prisma } = require('../helpers');

describe('Result Routes', () => {
  let teacherToken;
  let studentToken, studentId;
  let student2Token, student2Id;
  let quizId, quizInternalId;
  let resultId;

  beforeAll(async () => {
    const teacher = await createTestTeacher({ name: 'Result Teacher' });
    teacherToken = teacher.token;

    const student = await createTestStudent({ name: 'Result Student' });
    studentToken = student.token;
    studentId = student.student.id;

    const student2 = await createTestStudent({ name: 'Result Student 2' });
    student2Token = student2.token;
    student2Id = student2.student.id;

    // Create a quiz and activate it
    const quiz = await createTestQuiz(teacherToken, { title: 'Result Quiz' });
    quizId = quiz.quizId;

    // Get the internal ID and activate
    const quizRecord = await prisma.quiz.findUnique({ where: { quizId } });
    quizInternalId = quizRecord.id;
    await prisma.quiz.update({
      where: { quizId },
      data: { status: 'ACTIVE', startedAt: new Date() }
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // ─── GET /api/results/check/:quizId ────────────────────────────────
  describe('GET /api/results/check/:quizId', () => {
    it('should return not attempted for fresh student', async () => {
      const res = await request(app)
        .get(`/api/results/check/${quizId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('attempted', false);
    });
  });

  // ─── POST /api/results/submit ──────────────────────────────────────
  describe('POST /api/results/submit', () => {
    it('should submit quiz answers and get result', async () => {
      // Get the quiz questions
      const quizRes = await request(app)
        .get(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      const questions = quizRes.body.questions;

      const answers = questions.map(q => ({
        questionText: q.questionText,
        studentAnswer: q.options ? q.options[q.correctAns] || q.options[0] : 'answer'
      }));

      const res = await request(app)
        .post('/api/results/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          quizId,
          answers,
          timeTaken: 120,
          warnings: 0,
          penalties: 0
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      resultId = res.body.id;
    });

    it('should return 409 for duplicate submission', async () => {
      const res = await request(app)
        .post('/api/results/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          quizId,
          answers: [{ questionText: 'What is 10+10?', studentAnswer: '20' }],
          timeTaken: 60,
          warnings: 0,
          penalties: 0
        });

      // Should fail because student already attempted
      expect([409, 400]).toContain(res.status);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/results/submit')
        .send({ quizId, answers: [], timeTaken: 0, warnings: 0, penalties: 0 });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /api/results/check/:quizId (after submission) ─────────────
  describe('GET /api/results/check/:quizId (after submission)', () => {
    it('should return attempted=true after submission', async () => {
      const res = await request(app)
        .get(`/api/results/check/${quizId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('attempted', true);
    });
  });

  // ─── GET /api/results/:resultId ────────────────────────────────────
  describe('GET /api/results/:resultId', () => {
    it('should return result details', async () => {
      if (!resultId) return; // Skip if submit failed

      const res = await request(app)
        .get(`/api/results/${resultId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('score');
      expect(res.body).toHaveProperty('totalQuestions');
      expect(res.body).toHaveProperty('accuracy');
    });
  });

  // ─── GET /api/results/quiz/:quizId (Teacher) ──────────────────────
  describe('GET /api/results/quiz/:quizId', () => {
    it('should return all results for teacher', async () => {
      const res = await request(app)
        .get(`/api/results/quiz/${quizId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 403 for student', async () => {
      const res = await request(app)
        .get(`/api/results/quiz/${quizId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── GET /api/results/export/:quizId (Teacher) ────────────────────
  describe('GET /api/results/export/:quizId', () => {
    it('should return Excel file for teacher', async () => {
      const res = await request(app)
        .get(`/api/results/export/${quizId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/spreadsheetml|octet-stream/);
    });
  });
});
