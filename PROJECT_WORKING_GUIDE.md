# ProctorX — Complete Project Working Guide

## 1. What ProctorX is

ProctorX is an AI-assisted online examination and proctoring platform. It allows:

- Students to register, join authorized exams, answer MCQ/descriptive/coding questions, and view results.
- Teachers to create, edit, duplicate, publish, monitor, and evaluate exams.
- Administrators to approve teachers, manage access, and view system statistics.
- Teachers to generate quizzes with AI and use uploaded documents as source material.
- Students to solve programming questions through a sandboxed compiler service.
- The system to monitor exam activity through browser events and Socket.IO real-time events.

The repository is a multi-service application:

```text
ProctorX/
├── Back-End/       Express API, Prisma/PostgreSQL, authentication, exams, Socket.IO
├── Front-End/      React/Vite web application
├── AI-Service/     FastAPI service for document processing, question generation, and grading
├── Compilor-End/   Node.js + Docker code execution service
└── *.md            Architecture, compiler, setup, and project documentation
```

The main application is JavaScript-based. The AI service is Python because it uses FastAPI and Python AI/document-processing libraries.

---

## 2. High-level architecture

```text
Browser
  │
  ├── HTTP/JSON + multipart requests
  │       │
  │       ▼
  │   Back-End Express API
  │       ├── JWT authentication and role checks
  │       ├── Controllers → Services → Prisma
  │       ├── PostgreSQL database
  │       ├── Redis cache / OTP support
  │       ├── Email and Cloudinary integrations
  │       └── Socket.IO real-time exam events
  │
  ├── Socket.IO connection ───────────────► Back-End
  │
  ├── AI actions ─────────────────────────► Back-End ──► AI-Service/FastAPI
  │                                             │
  │                                             └── AI provider, vector/document services
  │
  └── Coding question execution ─────────► Compilor-End ──► isolated Docker containers
```

### Main responsibilities

| Service | Responsibility | Main technology |
|---|---|---|
| Front-End | User interface, routing, forms, exam screen, dashboards, charts | React 19, Vite, React Router |
| Back-End | Authentication, business rules, persistence, exports, proctoring events | Express 5, Prisma, PostgreSQL, Socket.IO |
| AI-Service | Document ingestion, AI quiz generation, regeneration, grading, chat | FastAPI, Pydantic, Python |
| Compilor-End | Compile and run student code safely | Node.js, Docker |

---

## 3. How the application starts

### Back-End startup

The entry point is `Back-End/server.js`.

1. Express is created from `Back-End/src/app.js`.
2. Helmet, CORS, compression, JSON parsing, URL-encoded parsing, static uploads, and routes are registered.
3. An HTTP server is created.
4. Socket.IO is attached to the HTTP server.
5. Socket handlers are registered from `Back-End/src/sockets/index.js`.
6. Prisma connects to PostgreSQL.
7. A default admin is seeded if the admin table is empty.
8. The scheduler starts for exam lifecycle/automatic status work.
9. The server listens on `PORT` and accepts HTTP and WebSocket traffic.

If environment validation or the database connection fails, startup stops. This is intentional: the backend should not run with invalid security or database configuration.

### Express middleware order

The order in `Back-End/src/app.js` is important:

1. `helmet()` adds security headers.
2. `cors()` allows the configured front-end origin.
3. `compression()` compresses responses.
4. `express.json()` parses JSON bodies.
5. `express.urlencoded()` parses form bodies.
6. `/uploads` serves uploaded profile/question files.
7. API routes are mounted.
8. `errorMiddleware` handles errors last.

### Front-End startup

The entry point is `Front-End/src/main.jsx`. It mounts React and loads `App.jsx`.

`App.jsx`:

- Wraps the application in `ErrorBoundary`.
- Wraps the application in `AuthProvider`.
- Displays global toast notifications.
- Lazy-loads large dashboard, exam, result, AI, and admin pages.
- Defines public, student, teacher, monitor, and admin routes.

---

## 4. Authentication and authorization

### Login flow

1. A student or teacher submits an email and password.
2. The front end sends the request to the Back-End auth route.
3. Zod validates the request body.
4. The auth service finds the user by email.
5. `bcryptjs` compares the submitted password with `passwordHash`.
6. The backend creates a JWT containing the user identity and role.
7. The response returns the token and user information.
8. `AuthContext` stores the token in `localStorage` and decodes it with `jwt-decode`.
9. The user is redirected to the appropriate dashboard.

### JWT-protected request flow

```text
Browser request
  → Authorization: Bearer <JWT>
  → auth.middleware.js verifies signature and expiry
  → req.user is attached
  → role.middleware.js checks student/teacher/admin role
  → validation middleware checks input
  → controller calls service
```

The token is currently stored in browser local storage. This is convenient for the demo/application flow, but production deployments should also evaluate an HttpOnly cookie strategy and a refresh-token rotation strategy.

### Roles

- `student`: joins exams, submits answers, sees personal results, joins classrooms.
- `teacher`: creates exams, manages classrooms, changes exam status, monitors students, grades answers, exports results, and uses authorized AI features.
- `admin`: approves/rejects teachers, controls AI access, manages system-level views, and sees statistics.

### Authentication routes

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login/student` | Student login |
| POST | `/api/auth/login/teacher` | Teacher login |
| POST | `/api/auth/signup/student` | Student registration, optional profile upload |
| POST | `/api/auth/signup/teacher` | Teacher registration, optional profile upload |
| POST | `/api/admin/login` | Admin login |

Login and signup routes use rate limiting. Signup/profile image requests use Multer-based upload handling.

---

## 5. Database and Prisma model

The schema is in `Back-End/prisma/schema.prisma`. PostgreSQL is the source of truth for users, quizzes, questions, results, responses, classrooms, and warnings.

### User models

#### Student

Stores name, unique email, password hash, profile picture, active state, last login, results, warnings, and classroom membership.

#### Teacher

Stores name, unique email, password hash, unique staff ID, approval state, AI access state, created quizzes, and classrooms.

#### Admin

Stores unique username and password hash. The default admin is created during backend bootstrap when no admin exists.

### Quiz model

A quiz contains:

- Internal UUID `id`.
- Human-readable unique `quizId` such as `QZ123456`.
- Title and status (`PENDING`, `ACTIVE`, or `COMPLETED`).
- `allowedStudents` email list.
- `durationInMinutes`.
- OTP and expiry data.
- Optional schedule/start/end timestamps.
- Optional AI document/model/prompt metadata.
- Teacher ownership.
- Questions, results, and optional classroom ownership.

`durationInMinutes` is critical: the front end uses it for exam timing and the backend persists it so the server can enforce the exam boundary.

### Question model

Questions support more than MCQ:

- `questionType`: `mcq`, `descriptive`, or `coding`.
- Text and optional image.
- MCQ options and correct answer index.
- Descriptive expected answer.
- Coding test cases and starter code as JSON.
- Marks per question.
- Ordering within a quiz.

### Result and Response models

`Result` stores score, total questions, accuracy, time taken, warning count, penalties, completion time, quiz, student, and responses.

`Response` stores a snapshot of the question and answer, correctness, marks, AI feedback, AI grading state, and grading metadata.

The database constraint `@@unique([quizId, studentId])` enforces one result per student per quiz. This protects against duplicate submissions even if two requests arrive at nearly the same time.

### Classroom model

Classrooms let teachers group students and associate quizzes with a class. A classroom has a unique join code, teacher ownership, students, and quizzes.

### Warning model

Warnings record quiz ID, student ID, warning type, and timestamp. Supported warning types are:

- `FULLSCREEN`
- `TAB_SWITCH`
- `FACE_MISSING`
- `OTHER`

### Indexing

The schema indexes login/filter/join paths, including user active/approval state, quiz owner/status/expiry, question order, result lookup fields, completion date, and warning student/quiz combinations. The unique constraints also create useful unique indexes.

---

## 6. Teacher workflow: create and run an exam

### Create a standard quiz

1. The teacher signs in.
2. The teacher opens `/create-quiz`.
3. The form collects title, duration, allowed students/classroom, and question data.
4. The front end submits `POST /api/quizzes`.
5. The route checks the teacher role and validates the body with Zod.
6. `quiz.service.js` generates a human-readable quiz ID and OTP.
7. Prisma creates the quiz and nested questions in PostgreSQL.
8. The OTP may be sent through the email service.
9. The teacher sees the quiz in the staff dashboard.

### Edit, duplicate, delete, and publish

Teacher quiz routes include:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/quizzes` | Create a quiz |
| GET | `/api/quizzes` | List the teacher's quizzes |
| GET | `/api/quizzes/:quizId` | Load a quiz |
| PUT | `/api/quizzes/:quizId` | Edit a quiz |
| DELETE | `/api/quizzes/:quizId` | Delete a quiz |
| POST | `/api/quizzes/:quizId/duplicate` | Clone a quiz |
| POST | `/api/quizzes/:quizId/generate-otp` | Generate a new OTP |
| PUT | `/api/quizzes/:quizId/status` | Change pending/active/completed state |

When the teacher changes a quiz to `ACTIVE`, the scheduler and/or status logic can apply scheduling/end-time rules. The student join path also checks that the quiz is active and has not expired.

---

## 7. Student workflow: join and complete an exam

### Eligibility checks

Before a student can join through the real-time channel, the backend checks:

- The socket is authenticated as a student.
- The supplied student ID matches the JWT identity.
- The quiz exists and is `ACTIVE`.
- The quiz has not passed `endsAt`.
- If `allowedStudents` is non-empty, the student email is included.
- If the quiz belongs to a classroom, the student is enrolled in that classroom.

### OTP flow

1. The student enters a quiz ID and OTP.
2. The front end calls `POST /api/quizzes/:quizId/verify-otp`.
3. The backend checks the OTP and expiration.
4. The OTP/cache entry is invalidated or treated as consumed according to the service logic.
5. The student can load the exam screen.

### Exam screen

The main exam-related pages are:

- `/exam/:quizId` — proctored attempt flow.
- `/quiz/:quizId/answer` — answering interface.
- `/results/:resultId` — result details.

The exam UI displays questions, answer controls, time remaining, question navigation, and submission controls. Coding questions can open the compiler experience and descriptive answers can be sent for later/AI-assisted grading.

### Timer rules

The timer should be treated as server-bounded, not only as a browser countdown. The quiz stores `durationInMinutes`, `startedAt`, and optional `endsAt`. The client may render the countdown, but the backend must reject late joins/submissions or apply the configured completion behavior when the server deadline is reached.

### Submit flow

1. The student submits answers to `POST /api/results/submit`.
2. The result controller validates the payload.
3. The result service checks for an existing `(quizId, studentId)` result.
4. The service calculates score, accuracy, time, warnings, penalties, and response records.
5. A Prisma transaction creates the result and nested responses.
6. Descriptive/coding responses can remain pending or be sent through AI/manual grading paths.
7. The result is returned to the client.
8. The teacher monitor receives `exam:student-submitted`.

Result routes:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/results/submit` | Submit an attempt |
| GET | `/api/results/check/:quizId` | Check whether a student attempted |
| GET | `/api/results/:resultId` | Get result details |
| GET | `/api/results/quiz/:quizId` | Teacher views quiz results |
| GET | `/api/results/export/:quizId` | Download Excel results |
| DELETE | `/api/results/reset/:quizId/:studentId` | Teacher resets an attempt |
| PUT | `/api/results/responses/:responseId/grade` | Teacher grades a response |

---

## 8. Proctoring and Socket.IO

Socket.IO is attached to the same HTTP server as Express. Connections authenticate with a JWT in the socket auth payload.

### Rooms

```text
exam:{quizId}                 Student exam room
exam:{quizId}:teacher         Teacher monitoring room
exam:{quizId}:{studentId}     Individual student control room
```

### Student events

| Event | Meaning |
|---|---|
| `student:join` | Student attempts to enter an active exam |
| `student:warning` | Browser detects fullscreen/tab/face/other warning |
| `student:heartbeat` | Student proves the browser is still connected |
| `student:submitted` | Student informs the monitor that submission completed |

### Teacher events

| Event | Meaning |
|---|---|
| `teacher:monitor` | Teacher subscribes to a quiz monitor room |
| `teacher:force-submit` | Teacher asks the server to force a student's submission |

### Server events

| Event | Meaning |
|---|---|
| `exam:student-joined` | A student became active |
| `exam:warning` | A warning was logged and counted |
| `exam:student-disconnected` | A student's connection ended or heartbeat expired |
| `exam:student-submitted` | A student finished |
| `student:force-submit` | The student's client must submit immediately |
| `exam:started` | A teacher/exam lifecycle event unlocked the exam |

### Warning flow

1. The browser detects an event such as leaving fullscreen or switching tabs.
2. `QuizAttempt` sends `student:warning`.
3. The socket handler calls `warning.service.js`.
4. The warning is persisted and the student's warning total is calculated.
5. The teacher room receives `exam:warning` with student, type, and count.
6. If the count reaches `MAX_WARNINGS`, the server emits `student:force-submit`.
7. The client submits or locks the attempt according to the exam flow.

The monitor page is `/monitor/:quizId`. It subscribes to live student joins, warnings, disconnects, and submissions.

---

## 9. AI features

AI functionality has two layers.

### Back-End AI routes

The Back-End exposes `/api/ai` routes for the authenticated application. These routes handle access control, persistence, validation, image uploads, and communication with the AI service.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/ai/documents/upload` | Upload source document |
| GET | `/api/ai/documents` | List documents |
| DELETE | `/api/ai/documents/:documentId` | Delete a document |
| GET/POST/DELETE | `/api/ai/draft` | Read, save, or delete quiz draft |
| POST | `/api/ai/generate-quiz` | Generate quiz content |
| POST | `/api/ai/regenerate-question` | Regenerate one question |
| POST | `/api/ai/upload-image` | Upload a question image |
| POST | `/api/ai/save-quiz` | Save generated quiz content |

Teacher AI access is controlled by admin approval/access state and route-level authorization.

### AI-Service

`AI-Service/app/main.py` starts a FastAPI application and registers routers for:

- Documents.
- Document listing.
- Quiz generation.
- Question regeneration.
- Grading.

The service also exposes:

- `GET /` health endpoint.
- `POST /api/ai/chat` for a generic model chat request.

The AI service reads provider/model configuration from its settings and calls the configured NVIDIA/AI client. Document and vector-related logic lives under `AI-Service/app/services/`.

### AI grading

Descriptive answers may be graded by the AI service. The result/response model stores `aiFeedback`, `aiGraded`, `aiModel`, and `aiPromptVersion` so grading is traceable and can be reviewed or reproduced.

---

## 10. Coding/compiler workflow

Coding questions are executed by `Compilor-End`, not directly inside the API process.

### Supported languages

- Python.
- JavaScript/Node.js.
- Java.
- C++.

### Execution flow

1. The student writes code in the Monaco-based compiler UI.
2. The front end sends code, language, and test inputs to the compiler service.
3. The compiler creates a unique temporary job directory.
4. Source code is written to that directory.
5. Compiled languages are compiled in a controlled container.
6. Each test case runs in a separate Docker container.
7. Output, error output, exit code, signal, and timeout state are captured per test.
8. Containers are removed after execution.
9. The frontend compares actual output with expected output and displays per-test status.

### Isolation controls

The compiler design uses controls such as:

- `--rm` to remove containers.
- `--network none` to disable network access.
- Memory and CPU limits.
- Process count limits.
- Dropped Linux capabilities.
- Non-root execution.
- Per-test timeout.

Docker must be installed and running for this feature. The compiler service is a separate deployable process and should not be given unrestricted host permissions in production.

---

## 11. Classrooms

Classroom routes support teacher-created groups and student enrollment:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/classrooms` | Teacher creates a classroom |
| POST | `/api/classrooms/join` | Student joins with a code |
| GET | `/api/classrooms` | Teacher/admin lists classrooms |
| GET | `/api/classrooms/students/search` | Search students |
| GET | `/api/classrooms/:classroomId` | Get classroom details |
| POST | `/api/classrooms/:classroomId/students` | Add a student |
| DELETE | `/api/classrooms/:classroomId/students/:studentId` | Remove a student |

Classroom membership affects quiz eligibility when a quiz is linked to a classroom.

---

## 12. Dashboards and front-end routes

### Public routes

- `/` — landing/dashboard entry.
- `/student-login` — student login.
- `/student-signup` — student registration.
- `/staff-login` — teacher login.
- `/admin/login` — admin login.

### Student routes

- `/student-profile` — student dashboard, profile, performance.
- `/exam/:quizId` — exam attempt.
- `/quiz/:quizId/answer` — quiz answering.
- `/results/:resultId` — result detail.

### Teacher routes

- `/staff-dashboard` — teacher overview, quizzes, results, and actions.
- `/create-quiz` — create a quiz.
- `/ai-quiz` — AI quiz creation/editor flow.
- `/edit-quiz/:quizId` — edit an existing quiz.
- `/monitor/:quizId` — live exam monitor.

### Admin routes

- `/admin/dashboard` — teacher approval, AI access, statistics, and student views.

`ErrorBoundary` prevents an uncaught React error from blanking the entire application. `SkeletonLoader` and lazy loading improve perceived performance while dashboard/page data is loading.

---

## 13. Backend service boundaries

Business logic is kept in `Back-End/src/services/` so controllers remain thin.

| Service | Responsibility |
|---|---|
| `auth.service.js` | Login, registration, password hashing, JWT creation |
| `student.service.js` | Student profile and dashboard |
| `teacher.service.js` | Teacher profile and dashboard |
| `quiz.service.js` | Quiz CRUD, OTP, status, duplication, questions |
| `result.service.js` | Submission, score calculation, result reads, grading |
| `warning.service.js` | Warning persistence, counts, force-submit decision |
| `admin.service.js` | Teacher approval/rejection, AI access, stats, users |
| `email.service.js` | OTP, approval, welcome, and notification email |
| `export.service.js` | ExcelJS result export |
| `classroom.service.js` | Classroom membership and access |
| `services/ai/aiService.js` | Back-End integration with AI-Service |

A normal request should follow:

```text
route → middleware → controller → service → Prisma/external service → response
```

Routes should only register endpoints and middleware. Controllers should translate HTTP input/output. Services should own business rules.

---

## 14. Caching and external integrations

### Redis

`Back-End/src/config/redis.js` configures Upstash Redis when credentials are available. Intended cache areas include:

- Quiz data for repeated student reads.
- OTP values and expiry support.
- Attempt checks.

Quiz and OTP caches must be invalidated when quiz content changes or an OTP is consumed. Redis is an optimization; PostgreSQL remains the durable source of truth.

### Email

Nodemailer sends OTP and account/approval messages through the configured SMTP provider.

### Cloudinary/uploads

Profile pictures and question images can be uploaded through Multer and Cloudinary configuration. Local uploads are also served from `/uploads` for the current deployment setup.

### Excel export

Teacher result exports are generated by `export.service.js` using ExcelJS and returned from `/api/results/export/:quizId`.

---

## 15. Environment configuration

Do not commit real secrets. Use `.env.example` files as templates.

### Back-End variables

Important backend variables include:

```env
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@host:5432/proctorx
JWT_SECRET=at-least-32-characters-in-production
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM=noreply@example.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
MAX_WARNINGS=5
AI_SERVICE_URL=http://localhost:8001
AI_GRADING_CONCURRENCY=3
```

`Back-End/src/config/env.js` validates these variables at startup. Production requires stronger values and valid URLs.

### Front-End variables

Typical values are:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=http://localhost:8000
```

### AI-Service variables

The AI service needs its provider/API credentials, model names, CORS configuration, document/vector settings, and any storage configuration required by the service modules. Keep these in `AI-Service/.env` and do not commit them.

### Compiler variables

The compiler service needs its port and Docker runtime configuration. Docker image names and execution limits are configured in `Compilor-End/src/config.js` and related runner code.

---

## 16. Local development setup

### Prerequisites

- Node.js and npm.
- PostgreSQL.
- Redis/Upstash credentials for cache features, if enabled.
- Docker Desktop for compiler execution.
- Python 3.10+ for AI-Service.

### Install dependencies

```powershell
cd Back-End
npm install

cd ..\Front-End
npm install

cd ..\Compilor-End
npm install

cd ..\AI-Service
pip install -r requirements.txt
```

### Prepare the database

```powershell
cd Back-End
npm run prisma:generate
npm run prisma:migrate
```

For inspection:

```powershell
npm run prisma:studio
```

### Start services

Use separate terminals:

```powershell
# Terminal 1
cd Back-End
npm run dev

# Terminal 2
cd Front-End
npm run dev

# Terminal 3, if AI features are being tested
cd AI-Service
uvicorn app.main:app --reload --port 8001

# Terminal 4, if coding questions are being tested
cd Compilor-End
npm run dev
```

The backend health check is:

```text
GET http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```

---

## 17. Testing and verification

### Backend tests

```powershell
cd Back-End
npm test
npm run test:coverage
npm run test:watch
```

The backend test suite contains route tests for authentication, students, teachers, quizzes, results, classrooms, and admin behavior.

### Frontend checks

```powershell
cd Front-End
npm run lint
npm run build
```

### Compiler checks

```powershell
cd Compilor-End
npm run docker:build-images
npm run docker:build
```

Verify that:

- Python, JavaScript, Java, and C++ submissions run.
- Compilation errors are returned clearly.
- Timeouts terminate execution.
- A test cannot access the network.
- Temporary files and containers are cleaned up.

### Manual end-to-end test

1. Start PostgreSQL and the backend.
2. Confirm `/health` returns `ok`.
3. Register a student and teacher.
4. Approve the teacher through the admin dashboard or database seed/admin flow.
5. Create a classroom and enroll the student, or use an allowed-student email list.
6. Create a quiz with a short duration and at least one question.
7. Activate the quiz and generate/verify the OTP.
8. Open the student exam in one browser and the teacher monitor in another.
9. Trigger a tab/fullscreen warning and confirm the teacher receives it.
10. Submit the exam and confirm a result is created.
11. Open the result and export the quiz results.
12. Repeat with a coding question if Docker is available.

---

## 18. Security model

The project applies several layers:

- Helmet security headers.
- CORS restricted to the configured frontend origin.
- Login, OTP, and AI generation rate limits.
- Zod request validation and field whitelisting.
- JWT authentication.
- Role-based authorization.
- bcrypt password hashing.
- Prisma parameterized database access.
- OTP expiry and regeneration.
- Database-level one-attempt uniqueness.
- Socket identity and room checks.
- Docker isolation for arbitrary code.

Production requirements:

- Use a long random JWT secret.
- Use a strong admin password and rotate it.
- Use HTTPS/WSS.
- Restrict CORS to the real frontend domain.
- Do not expose PostgreSQL or Redis publicly without network controls.
- Store uploads in controlled object storage and validate file types/sizes.
- Add audit logging for admin actions and force submissions.
- Add retention/deletion rules for profile pictures, exam attempts, warnings, and uploaded documents.
- Run the compiler service with the smallest possible host permissions.
- Review the local-storage token strategy before handling sensitive production exams.

---

## 19. Deployment model

The intended deployment split is:

```text
Frontend  → Vercel or another static/Node-compatible frontend host
Backend   → Railway/Render/VM with WebSocket support
Database  → Neon or managed PostgreSQL
Redis     → Upstash Redis
AI        → Python-capable service/container
Compiler  → Docker-capable VM/container host
```

Important deployment checks:

1. Set production environment variables in each service.
2. Run `prisma generate` during build and `prisma migrate deploy` during release.
3. Set frontend API and WebSocket URLs to the deployed backend.
4. Configure backend CORS with the deployed frontend URL.
5. Confirm the hosting platform supports long-lived Socket.IO connections.
6. Confirm the AI service URL is reachable only as intended.
7. Confirm the compiler host can run Docker and has resource limits.
8. Configure logs, health checks, backups, and database connection pooling.

---

## 20. Common failure points

### Backend will not start

Check `DATABASE_URL`, `JWT_SECRET`, required email/cloud credentials, and the PostgreSQL server. The environment validator intentionally exits on invalid values.

### Browser gets CORS errors

Check that `FRONTEND_URL` exactly matches the browser origin, including protocol and port. Also check that the frontend API URL points to the backend.

### Socket events do not arrive

Check `VITE_WS_URL`, the Socket.IO CORS configuration, the JWT passed in socket auth, and whether the user joined the correct room.

### Student cannot join a quiz

Check that the quiz is `ACTIVE`, the OTP is valid, the student is allowed, the classroom membership is correct, and `endsAt` has not passed.

### Duplicate result error

The student already has a result for that quiz. This is expected protection from the unique `(quizId, studentId)` constraint. A teacher can use the reset endpoint when policy allows.

### AI generation fails

Check `AI_SERVICE_URL`, provider credentials, teacher AI access, request size limits, and AI-Service logs.

### Compiler fails

Check that Docker is running, required images exist, the compiler service is reachable, and the host permits the configured container operations.

### Uploads do not display

Check the upload middleware, Cloudinary credentials or local upload directory, static `/uploads` serving, and cross-origin resource policy settings.

---

## 21. File ownership map

### Back-End

```text
Back-End/
├── prisma/schema.prisma          Database models and indexes
├── server.js                     HTTP/Socket.IO bootstrap
├── src/app.js                    Express application and middleware
├── src/config/                   Environment, Prisma, Redis, Cloudinary, scheduler
├── src/middleware/               Auth, role, validation, uploads, limits, errors
├── src/routes/                   URL registration only
├── src/controllers/              HTTP adapters
├── src/services/                 Business logic and integrations
├── src/schemas/                  Zod input validation
├── src/sockets/                  Socket.IO authentication and exam events
├── src/utils/                    Helpers and logger
├── tests/                        Jest/Supertest route tests
└── uploads/                      Local uploaded files when local storage is used
```

### Front-End

```text
Front-End/src/
├── App.jsx                       React routes and lazy loading
├── main.jsx                      React entry point
├── context/AuthContext.jsx       Login state and token-derived user
├── lib/api.js                    Shared Axios API client
├── hooks/useSocket.js            Shared Socket.IO client hook
├── components/                   Forms, dashboards, quiz creation, reusable UI
├── pages/                        Exam, monitor, result, admin, and editor screens
├── ui/                           Small presentation components
└── index.css/App.css             Global styling and design tokens
```

### AI-Service

```text
AI-Service/
├── app/main.py                   FastAPI bootstrap
├── app/routers/                  HTTP endpoints
├── app/services/                 AI, parsing, vector, registry, and grading logic
├── app/schemas/                  Pydantic schemas
└── requirements.txt              Python dependencies
```

### Compilor-End

```text
Compilor-End/
├── src/index.js                  Compiler HTTP/Socket server
├── src/runner.js                 Docker execution and result capture
├── src/validator.js              Request validation
├── src/queue.js                  Execution queue behavior
├── src/config.js                 Limits and runtime configuration
└── dockerfiles/                  Language runtime images
```

---

## 22. Recommended development order

When adding a feature, use this order:

1. Update Prisma schema and migration if data changes.
2. Add/update Zod schema.
3. Implement service-layer business logic.
4. Add controller adapter.
5. Register the route and middleware.
6. Add Socket.IO events if the feature is real-time.
7. Add/update the frontend API call and UI.
8. Add tests for authorization, validation, success, and failure paths.
9. Run Prisma generation/migration, backend tests, frontend lint/build, and the relevant service checks.
10. Update this guide when behavior, endpoints, environment variables, or deployment requirements change.

Avoid putting business rules directly in route files or React components. Keep rules in services and keep external integrations behind focused modules.

---

## 23. End-to-end summary

```text
Admin approves teacher
        ↓
Teacher creates classroom/quiz
        ↓
Backend validates and persists quiz in PostgreSQL
        ↓
Teacher activates quiz and shares quiz ID/OTP
        ↓
Student authenticates and verifies OTP
        ↓
Socket.IO validates student eligibility and joins rooms
        ↓
Student answers while browser warnings are streamed to teacher
        ↓
Student submits or is force-submitted at warning/time limit
        ↓
Backend transaction creates one Result and its Responses
        ↓
AI/manual grading completes non-MCQ answers when required
        ↓
Student sees result; teacher sees analytics and exports Excel
```

This document describes the current repository structure and the intended production behavior. Whenever code and documentation disagree, verify the implementation in the relevant route, controller, service, schema, and frontend page before making a deployment decision.
