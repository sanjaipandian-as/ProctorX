const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
let studentToken = '';
let teacherToken = '';
let adminToken = '';
let testQuizId = '';
let testResultId = '';
let testTeacherId = '';

const results = [];

function logTestResult(route, method, status, expected, passed, error = '') {
  results.push({
    route,
    method,
    status,
    expected,
    passed: passed ? 'Passed' : 'Failed',
    error
  });
  console.log(`[TEST] ${method} ${route} - Status: ${status} (Expected: ${expected}) -> ${passed ? 'SUCCESS' : 'FAILURE'}`);
}

async function startTests() {
  console.log('Starting automated API route integration tests...');

  // 1. Admin Login
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/admin/login`, {
      // wait, the path in routes is POST /api/admin/login. Let's use the correct routes!
    }).catch(err => err.response);
  } catch (e) {}

  // Let's call the actual routes from the routing registry:
  // POST /api/admin/login
  try {
    const res = await axios.post(`${BASE_URL}/api/admin/login`, {
      username: 'admin',
      password: 'adminpassword'
    });
    adminToken = res.data.token;
    logTestResult('/api/admin/login', 'POST', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/admin/login', 'POST', err.response?.status || 500, 200, false, err.message);
  }

  // 2. Student Signup
  const studentEmail = `student_${Date.now()}@test.com`;
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/signup/student`, {
      name: 'Test Student',
      email: studentEmail,
      password: 'studentpassword'
    });
    logTestResult('/api/auth/signup/student', 'POST', res.status, 201, true);
  } catch (err) {
    logTestResult('/api/auth/signup/student', 'POST', err.response?.status || 500, 201, false, err.message);
  }

  // 3. Student Login
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login/student`, {
      email: studentEmail,
      password: 'studentpassword'
    });
    studentToken = res.data.token;
    logTestResult('/api/auth/login/student', 'POST', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/auth/login/student', 'POST', err.response?.status || 500, 200, false, err.message);
  }

  // 4. Teacher Account Creation by Admin
  const teacherEmail = `teacher_${Date.now()}@test.com`;
  const staffId = `STAFF_${Date.now()}`;
  try {
    const res = await axios.post(`${BASE_URL}/api/admin/teachers`, {
      name: 'Test Teacher',
      email: teacherEmail,
      password: 'teacherpassword',
      staffId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    testTeacherId = res.data.id;
    logTestResult('/api/admin/teachers', 'POST', res.status, 201, true);
  } catch (err) {
    logTestResult('/api/admin/teachers', 'POST', err.response?.status || 500, 201, false, err.message);
  }

  // 5. Admin Approve Teacher (Self-Test via prisma mock first)
  // We can create a dummy unapproved teacher using prisma to test approvals
  let dummyTeacherId = '';
  try {
    const prisma = require('../config/database');
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);
    const dummy = await prisma.teacher.create({
      data: {
        name: 'Pending Teacher',
        email: `pending_${Date.now()}@test.com`,
        passwordHash: hash,
        staffId: `DUMMY_STAFF_${Date.now()}`,
        isApproved: false
      }
    });
    dummyTeacherId = dummy.id;
    const res = await axios.put(`${BASE_URL}/api/admin/teachers/${dummyTeacherId}/approve`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTestResult('/api/admin/teachers/:id/approve', 'PUT', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/admin/teachers/:id/approve', 'PUT', err.response?.status || 500, 200, false, err.message);
  }

  // 6. Teacher Login
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login/teacher`, {
      email: teacherEmail,
      password: 'teacherpassword'
    });
    teacherToken = res.data.token;
    logTestResult('/api/auth/login/teacher', 'POST', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/auth/login/teacher', 'POST', err.response?.status || 500, 200, false, err.message);
  }

  // 7. Student profile - GET /api/students/me
  try {
    const res = await axios.get(`${BASE_URL}/api/students/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    logTestResult('/api/students/me', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/students/me', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 8. Update Student profile - PUT /api/students/me
  try {
    const res = await axios.put(`${BASE_URL}/api/students/me`, {
      name: 'Updated Student Name'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    logTestResult('/api/students/me', 'PUT', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/students/me', 'PUT', err.response?.status || 500, 200, false, err.message);
  }

  // 9. Student Dashboard - GET /api/students/dashboard
  try {
    const res = await axios.get(`${BASE_URL}/api/students/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    logTestResult('/api/students/dashboard', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/students/dashboard', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 10. Teacher profile - GET /api/teachers/me
  try {
    const res = await axios.get(`${BASE_URL}/api/teachers/me`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    logTestResult('/api/teachers/me', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/teachers/me', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 11. Teacher Dashboard - GET /api/teachers/dashboard
  try {
    const res = await axios.get(`${BASE_URL}/api/teachers/dashboard`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    logTestResult('/api/teachers/dashboard', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/teachers/dashboard', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 11a. Create Classroom - POST /api/classrooms
  let testClassroomId = '';
  try {
    const res = await axios.post(`${BASE_URL}/api/classrooms`, {
      name: 'Physics 101'
    }, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    testClassroomId = res.data.id;
    logTestResult('/api/classrooms', 'POST', res.status, 201, true);
  } catch (err) {
    logTestResult('/api/classrooms', 'POST', err.response?.status || 500, 201, false, err.message);
  }

  // 11b. List Classrooms - GET /api/classrooms
  try {
    const res = await axios.get(`${BASE_URL}/api/classrooms`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    logTestResult('/api/classrooms', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/classrooms', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 11c. Add Student to Classroom - POST /api/classrooms/:classroomId/students
  try {
    const res = await axios.post(`${BASE_URL}/api/classrooms/${testClassroomId}/students`, {
      email: studentEmail
    }, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    logTestResult('/api/classrooms/:classroomId/students', 'POST', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/classrooms/:classroomId/students', 'POST', err.response?.status || 500, 200, false, err.message);
  }

  // 11d. Student joins classroom via Code - POST /api/classrooms/join
  try {
    const tClass = await axios.post(`${BASE_URL}/api/classrooms`, {
      name: 'Chemistry 101'
    }, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    
    const res = await axios.post(`${BASE_URL}/api/classrooms/join`, {
      code: tClass.data.code
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    logTestResult('/api/classrooms/join', 'POST', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/classrooms/join', 'POST', err.response?.status || 500, 200, false, err.message);
  }

  // 12. Create Quiz - POST /api/quizzes (linked to classroom)
  try {
    const res = await axios.post(`${BASE_URL}/api/quizzes`, {
      title: 'Science Quiz',
      durationInMinutes: 30,
      classroomId: testClassroomId,
      questions: [
        {
          questionText: 'What is the speed of light?',
          options: ['299,792 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'],
          correctAns: 0,
          order: 0
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    testQuizId = res.data.quizId;
    logTestResult('/api/quizzes', 'POST', res.status, 201, true);
  } catch (err) {
    logTestResult('/api/quizzes', 'POST', err.response?.status || 500, 201, false, err.message);
  }

  // 13. Get all my quizzes - GET /api/quizzes
  try {
    const res = await axios.get(`${BASE_URL}/api/quizzes`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    logTestResult('/api/quizzes', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/quizzes', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 14. Get quiz by ID - GET /api/quizzes/:quizId
  try {
    const res = await axios.get(`${BASE_URL}/api/quizzes/${testQuizId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    logTestResult('/api/quizzes/:quizId', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/quizzes/:quizId', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 15. Edit Quiz - PUT /api/quizzes/:quizId
  try {
    const res = await axios.put(`${BASE_URL}/api/quizzes/${testQuizId}`, {
      title: 'Advanced Science Quiz',
      durationInMinutes: 45,
      questions: [
        {
          questionText: 'What is the speed of light?',
          options: ['299,792 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'],
          correctAns: 0,
          order: 0
        }
      ]
    }, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    logTestResult('/api/quizzes/:quizId', 'PUT', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/quizzes/:quizId', 'PUT', err.response?.status || 500, 200, false, err.message);
  }

  // 16. Generate new OTP - POST /api/quizzes/:quizId/generate-otp
  let generatedOtp = '';
  try {
    const res = await axios.post(`${BASE_URL}/api/quizzes/${testQuizId}/generate-otp`, {}, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    generatedOtp = res.data.otp;
    logTestResult('/api/quizzes/:quizId/generate-otp', 'POST', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/quizzes/:quizId/generate-otp', 'POST', err.response?.status || 500, 200, false, err.message);
  }

  // 17. Change status - PUT /api/quizzes/:quizId/status
  try {
    const res = await axios.put(`${BASE_URL}/api/quizzes/${testQuizId}/status`, {
      status: 'ACTIVE'
    }, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    logTestResult('/api/quizzes/:quizId/status', 'PUT', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/quizzes/:quizId/status', 'PUT', err.response?.status || 500, 200, false, err.message);
  }

  // 18. Verify OTP - POST /api/quizzes/:quizId/verify-otp
  try {
    const res = await axios.post(`${BASE_URL}/api/quizzes/${testQuizId}/verify-otp`, {
      otp: generatedOtp
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    logTestResult('/api/quizzes/:quizId/verify-otp', 'POST', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/quizzes/:quizId/verify-otp', 'POST', err.response?.status || 500, 200, false, err.response?.data?.message || err.message);
  }

  // 19. Check Attempt status - GET /api/results/check/:quizId
  try {
    const res = await axios.get(`${BASE_URL}/api/results/check/${testQuizId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    logTestResult('/api/results/check/:quizId', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/results/check/:quizId', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 20. Submit Quiz Answers - POST /api/results/submit
  try {
    const res = await axios.post(`${BASE_URL}/api/results/submit`, {
      quizId: testQuizId,
      answers: [
        {
          questionText: 'What is the speed of light?',
          studentAnswer: '299,792 km/s'
        }
      ],
      timeTaken: 120,
      warnings: 1,
      penalties: 0
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    testResultId = res.data.id;
    logTestResult('/api/results/submit', 'POST', res.status, 201, true);
  } catch (err) {
    logTestResult('/api/results/submit', 'POST', err.response?.status || 500, 201, false, err.message);
  }

  // 21. Get result detail - GET /api/results/:resultId
  try {
    const res = await axios.get(`${BASE_URL}/api/results/${testResultId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    logTestResult('/api/results/:resultId', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/results/:resultId', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 22. All results for a quiz - GET /api/results/quiz/:quizId
  try {
    const res = await axios.get(`${BASE_URL}/api/results/quiz/${testQuizId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    logTestResult('/api/results/quiz/:quizId', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/results/quiz/:quizId', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 23. Export Results - GET /api/results/export/:quizId
  try {
    const res = await axios.get(`${BASE_URL}/api/results/export/${testQuizId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      responseType: 'arraybuffer'
    });
    logTestResult('/api/results/export/:quizId', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/results/export/:quizId', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 24. Pending approvals - GET /api/admin/teachers/pending
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/teachers/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTestResult('/api/admin/teachers/pending', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/admin/teachers/pending', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 25. System stats - GET /api/admin/stats
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTestResult('/api/admin/stats', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/admin/stats', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 26. All students list - GET /api/admin/students
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTestResult('/api/admin/students', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/admin/students', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 26a. Public list - GET /api/quizzes/public
  try {
    const res = await axios.get(`${BASE_URL}/api/quizzes/public`);
    logTestResult('/api/quizzes/public', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/quizzes/public', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 26b. Public quiz detail - GET /api/quizzes/public/:quizId
  try {
    const res = await axios.get(`${BASE_URL}/api/quizzes/public/${testQuizId}`);
    logTestResult('/api/quizzes/public/:quizId', 'GET', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/quizzes/public/:quizId', 'GET', err.response?.status || 500, 200, false, err.message);
  }

  // 27. Duplicate Quiz - POST /api/quizzes/:quizId/duplicate
  try {
    const res = await axios.post(`${BASE_URL}/api/quizzes/${testQuizId}/duplicate`, {}, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    logTestResult('/api/quizzes/:quizId/duplicate', 'POST', res.status, 201, true);
  } catch (err) {
    logTestResult('/api/quizzes/:quizId/duplicate', 'POST', err.response?.status || 500, 201, false, err.message);
  }

  // 28. Delete Quiz - DELETE /api/quizzes/:quizId
  try {
    const res = await axios.delete(`${BASE_URL}/api/quizzes/${testQuizId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    logTestResult('/api/quizzes/:quizId', 'DELETE', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/quizzes/:quizId', 'DELETE', err.response?.status || 500, 200, false, err.message);
  }

  // 29. Admin Reject Teacher (for testing)
  // Let's create another pending teacher via prisma and reject them
  let tempTeacherId = '';
  try {
    const prisma = require('../config/database');
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);
    const temp = await prisma.teacher.create({
      data: {
        name: 'Temp Teacher',
        email: `temp_teacher_${Date.now()}@test.com`,
        passwordHash: hash,
        staffId: `TEMP_STAFF_${Date.now()}`,
        isApproved: false
      }
    });
    tempTeacherId = temp.id;
    const res = await axios.put(`${BASE_URL}/api/admin/teachers/${tempTeacherId}/reject`, {
      reason: 'Rejected due to duplicate test'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTestResult('/api/admin/teachers/:id/reject', 'PUT', res.status, 200, true);
  } catch (err) {
    logTestResult('/api/admin/teachers/:id/reject', 'PUT', err.response?.status || 500, 200, false, err.message);
  }

  console.log('\n--- TEST RESULTS SUMMARY ---');
  console.log(JSON.stringify(results, null, 2));

  // Write results to tested.md
  const fs = require('fs');
  const path = require('path');
  
  const totalCount = results.length;
  const passedCount = results.filter(r => r.passed === 'Passed').length;
  
  let markdown = `# Route Integration Testing Report\n\n`;
  markdown += `- **Total Routes Count**: ${totalCount}\n`;
  markdown += `- **Tested Routes Count**: ${totalCount}\n`;
  markdown += `- **Passed Tests Count**: ${passedCount}\n`;
  markdown += `- **Status**: ${passedCount === totalCount ? 'All Routes Working Correctly' : 'Some Tests Failed'}\n\n`;
  
  markdown += `## Verification Status Matrix\n\n`;
  markdown += `| Route | Method | Status Code | Expected Code | Outcome | Error Description |\n`;
  markdown += `|---|---|---|---|---|---|\n`;
  
  results.forEach(r => {
    markdown += `| \`${r.route}\` | \`${r.method}\` | ${r.status} | ${r.expected} | ${r.passed} | ${r.error || '-'} |\n`;
  });
  
  fs.writeFileSync(path.join(__dirname, '../../tested.md'), markdown);
  console.log('Test results written to tested.md');
}

startTests();
