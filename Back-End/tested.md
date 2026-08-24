# Route Integration Testing Report

- **Total Routes Count**: 35
- **Tested Routes Count**: 35
- **Passed Tests Count**: 34
- **Status**: Some Tests Failed

## Verification Status Matrix

| Route | Method | Status Code | Expected Code | Outcome | Error Description |
|---|---|---|---|---|---|
| `/api/admin/login` | `POST` | 200 | 200 | Passed | - |
| `/api/auth/signup/student` | `POST` | 201 | 201 | Passed | - |
| `/api/auth/login/student` | `POST` | 200 | 200 | Passed | - |
| `/api/admin/teachers` | `POST` | 201 | 201 | Passed | - |
| `/api/admin/teachers/:id/approve` | `PUT` | 500 | 200 | Failed | 
Invalid `prisma.teacher.create()` invocation in
D:\Projects\ProctorX\Back-End\src\scripts\test-all-routes.js:98:40

  95 const prisma = require('../config/database');
  96 const bcrypt = require('bcryptjs');
  97 const hash = await bcrypt.hash('password123', 10);
→ 98 const dummy = await prisma.teacher.create(
Can't reach database server at `ep-rapid-resonance-ao44cup4-pooler.c-2.ap-southeast-1.aws.neon.tech:5432`

Please make sure your database server is running at `ep-rapid-resonance-ao44cup4-pooler.c-2.ap-southeast-1.aws.neon.tech:5432`. |
| `/api/auth/login/teacher` | `POST` | 200 | 200 | Passed | - |
| `/api/students/me` | `GET` | 200 | 200 | Passed | - |
| `/api/students/me` | `PUT` | 200 | 200 | Passed | - |
| `/api/students/dashboard` | `GET` | 200 | 200 | Passed | - |
| `/api/teachers/me` | `GET` | 200 | 200 | Passed | - |
| `/api/teachers/dashboard` | `GET` | 200 | 200 | Passed | - |
| `/api/classrooms` | `POST` | 201 | 201 | Passed | - |
| `/api/classrooms` | `GET` | 200 | 200 | Passed | - |
| `/api/classrooms/:classroomId/students` | `POST` | 200 | 200 | Passed | - |
| `/api/classrooms/join` | `POST` | 200 | 200 | Passed | - |
| `/api/quizzes` | `POST` | 201 | 201 | Passed | - |
| `/api/quizzes` | `GET` | 200 | 200 | Passed | - |
| `/api/quizzes/:quizId` | `GET` | 200 | 200 | Passed | - |
| `/api/quizzes/:quizId` | `PUT` | 200 | 200 | Passed | - |
| `/api/quizzes/:quizId/generate-otp` | `POST` | 200 | 200 | Passed | - |
| `/api/quizzes/:quizId/status` | `PUT` | 200 | 200 | Passed | - |
| `/api/quizzes/:quizId/verify-otp` | `POST` | 200 | 200 | Passed | - |
| `/api/results/check/:quizId` | `GET` | 200 | 200 | Passed | - |
| `/api/results/submit` | `POST` | 201 | 201 | Passed | - |
| `/api/results/:resultId` | `GET` | 200 | 200 | Passed | - |
| `/api/results/quiz/:quizId` | `GET` | 200 | 200 | Passed | - |
| `/api/results/export/:quizId` | `GET` | 200 | 200 | Passed | - |
| `/api/admin/teachers/pending` | `GET` | 200 | 200 | Passed | - |
| `/api/admin/stats` | `GET` | 200 | 200 | Passed | - |
| `/api/admin/students` | `GET` | 200 | 200 | Passed | - |
| `/api/quizzes/public` | `GET` | 200 | 200 | Passed | - |
| `/api/quizzes/public/:quizId` | `GET` | 200 | 200 | Passed | - |
| `/api/quizzes/:quizId/duplicate` | `POST` | 201 | 201 | Passed | - |
| `/api/quizzes/:quizId` | `DELETE` | 200 | 200 | Passed | - |
| `/api/admin/teachers/:id/reject` | `PUT` | 200 | 200 | Passed | - |
