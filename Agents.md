# ProctorX — Full Production Blueprint
### JavaScript Only · React + Express.js · PostgreSQL + Prisma · Socket.IO

---

## 1. Exact Codebase Structure

### Backend — `Back-End/`

```
Back-End/
│
├── prisma/
│   └── schema.prisma              ← Full relational schema (all models + indexes)
│
├── src/
│   │
│   ├── config/
│   │   ├── env.js                 ← Reads + validates all .env vars at startup
│   │   ├── database.js            ← Prisma client singleton (one connection shared)
│   │   └── redis.js               ← Upstash Redis client (for OTP TTL + caching)
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js     ← verifyToken() — checks JWT, attaches req.user
│   │   ├── role.middleware.js     ← requireRole('teacher') guard
│   │   ├── validate.middleware.js ← validate(zodSchema) — input sanitization
│   │   ├── rateLimiter.js         ← loginLimiter, otpLimiter configs
│   │   ├── upload.middleware.js   ← Multer + Cloudinary (profile pictures)
│   │   └── error.middleware.js   ← Global error handler (last Express middleware)
│   │
│   ├── sockets/
│   │   ├── index.js               ← registerSocketHandlers(io) — boot socket server
│   │   └── exam.socket.js         ← All exam WebSocket events + room logic
│   │
│   ├── services/                  ← ALL business logic lives here (no logic in routes)
│   │   ├── auth.service.js        ← login, signup, refresh token, logout
│   │   ├── student.service.js     ← profile, dashboard, update
│   │   ├── teacher.service.js     ← profile, quiz list, approval status
│   │   ├── quiz.service.js        ← create, edit, delete, OTP gen, duplicate
│   │   ├── result.service.js      ← submit, score calc, check attempt, fetch
│   │   ├── admin.service.js       ← approve/reject teacher, stats, user list
│   │   ├── warning.service.js     ← log warning, get warnings, auto-submit trigger
│   │   ├── email.service.js       ← send OTP email, approval email, welcome email
│   │   └── export.service.js      ← Generate Excel (.xlsx) from result data
│   │
│   ├── controllers/               ← Thin layer: parse req → call service → send res
│   │   ├── auth.controller.js
│   │   ├── student.controller.js
│   │   ├── teacher.controller.js
│   │   ├── quiz.controller.js
│   │   ├── result.controller.js
│   │   └── admin.controller.js
│   │
│   ├── routes/                    ← Route registration only (no logic here)
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── teacher.routes.js
│   │   ├── quiz.routes.js
│   │   ├── result.routes.js
│   │   └── admin.routes.js
│   │
│   ├── schemas/                   ← Zod validation schemas (request body shapes)
│   │   ├── auth.schema.js
│   │   ├── quiz.schema.js
│   │   └── result.schema.js
│   │
│   ├── utils/
│   │   ├── helpers.js             ← generateOTP(), generateQuizId(), formatDate()
│   │   └── logger.js              ← Winston logger (file + console)
│   │
│   ├── scripts/
│   │   └── migrate-mongo-to-pg.js ← One-time migration: MongoDB → PostgreSQL
│   │
│   └── app.js                     ← Express app factory (middleware chain setup)
│
├── server.js                      ← Entry point: creates HTTP server + mounts Socket.IO
├── .env                           ← Secrets (never commit)
├── .env.example                   ← Template (commit this)
├── Dockerfile                     ← For Railway/Render deployment
└── package.json
```

### Frontend — `Front-End/`

```
Front-End/
│
├── src/
│   │
│   ├── lib/
│   │   └── api.js                 ← Axios instance: base URL + auth header interceptor
│   │
│   ├── hooks/
│   │   ├── useSocket.js           ← Socket.IO client hook (connect/disconnect/events)
│   │   └── useAuth.js             ← Existing AuthContext wrapper hook
│   │
│   ├── context/
│   │   └── AuthContext.jsx        ← Global auth state (existing, keep)
│   │
│   ├── components/
│   │   ├── ErrorBoundary.jsx      ← Catches React crashes, shows error UI
│   │   ├── SkeletonLoader.jsx     ← Reusable loading skeleton cards
│   │   ├── StudentLogin.jsx       ← (existing, update API calls)
│   │   ├── StudentSignup.jsx      ← (existing, update API calls)
│   │   ├── StaffLogin.jsx         ← (existing, update API calls)
│   │   ├── StaffSignup.jsx        ← (existing, update API calls)
│   │   ├── StaffDashboard.jsx     ← UPDATE: add "Go Live" button + live student count
│   │   ├── StudentDashboard.jsx   ← UPDATE: skeleton loaders + chart
│   │   └── CreateQuiz.jsx         ← UPDATE: add durationInMinutes field (CRITICAL BUG FIX)
│   │
│   ├── pages/
│   │   ├── AdminLogin.jsx         ← (existing)
│   │   ├── AdminDashboard.jsx     ← UPDATE: teacher approval queue + stats
│   │   ├── QuizAttempt.jsx        ← UPDATE: socket warnings + server-side timer
│   │   ├── QuizAnsweringPage.jsx  ← (existing)
│   │   ├── QuizEditPage.jsx       ← UPDATE: durationInMinutes field
│   │   ├── QuizResults.jsx        ← UPDATE: donut chart + per-question accordion
│   │   └── ExamMonitor.jsx        ← NEW: teacher live monitoring dashboard
│   │
│   ├── index.css                  ← UPDATE: CSS variables design tokens
│   ├── App.jsx                    ← UPDATE: lazy loading + ExamMonitor route
│   └── main.jsx                   ← (existing)
│
├── .env                           ← VITE_API_URL, VITE_WS_URL
├── .env.example
└── package.json                   ← (existing, no changes needed)
```

---

## 2. Database Schema — PostgreSQL with Prisma

### Full Relational Schema

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Student   │       │   Teacher   │       │    Admin    │
│─────────────│       │─────────────│       │─────────────│
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ name        │       │ name        │       │ username    │
│ email UNIQ  │       │ email UNIQ  │       │ passwordHash│
│ passwordHash│       │ passwordHash│       └─────────────┘
│ profilePic  │       │ staffId UNQ │
│ isActive    │       │ isApproved  │
│ lastLogin   │       │ aiAccess    │
│ createdAt   │       │ createdAt   │
└──────┬──────┘       └──────┬──────┘
       │                     │ createdById
       │              ┌──────▼──────┐
       │              │    Quiz     │
       │              │─────────────│
       │              │ id (PK)     │
       │              │ quizId UNIQ │ ← "QZ123456" human readable
       │              │ title       │
       │              │ status ENUM │ ← PENDING | ACTIVE | COMPLETED
       │              │ allowedStuds│
       │              │ durationMins│ ← CRITICAL: was missing before
       │              │ otp         │
       │              │ otpExpiresAt│
       │              │ createdAt   │
       │              └──────┬──────┘
       │                     │ 1-to-many
       │              ┌──────▼──────┐
       │              │  Question   │
       │              │─────────────│
       │              │ id (PK)     │
       │              │ questionText│
       │              │ options[]   │ ← PostgreSQL String array
       │              │ correctAns  │ ← index (0-based)
       │              │ order       │
       │              │ quizId (FK) │
       │              └─────────────┘
       │
       │  studentId              quizId
  ┌────▼────────────────────────────────┐
  │               Result                │
  │────────────────────────────────────│
  │ id (PK)                            │
  │ score                              │
  │ totalQuestions                     │
  │ accuracy (float)                   │
  │ timeTaken (seconds)                │
  │ warnings                           │
  │ penalties                          │
  │ completedAt                        │
  │ quizId (FK)                        │
  │ studentId (FK)                     │
  │ UNIQUE(quizId, studentId) ← DB-level one-attempt enforcement │
  └───────────────┬────────────────────┘
                  │ 1-to-many
          ┌───────▼───────┐
          │   Response    │
          │───────────────│
          │ id (PK)       │
          │ questionText  │
          │ studentAnswer │
          │ correctAnswer │
          │ isCorrect     │
          │ resultId (FK) │
          └───────────────┘

  ┌─────────────────────────┐
  │         Warning         │
  │─────────────────────────│
  │ id (PK)                 │
  │ type ENUM               │ ← FULLSCREEN | TAB_SWITCH | FACE_MISSING | OTHER
  │ quizId                  │
  │ studentId (FK)          │
  │ createdAt               │
  └─────────────────────────┘
```

---

## 3. Database Indexing Strategy

> Every index has a reason. No random indexes.

### `Student` table
| Index | Type | Why |
|---|---|---|
| `email` | `@unique` | Login lookup — every auth request does `WHERE email = ?` |
| `isActive` | Regular | Admin filtering active/inactive students |

### `Teacher` table
| Index | Type | Why |
|---|---|---|
| `email` | `@unique` | Login lookup |
| `staffId` | `@unique` | Admin validation — no duplicate staff IDs |
| `isApproved` | Regular | Admin dashboard filters `WHERE isApproved = false` |

### `Quiz` table
| Index | Type | Why |
|---|---|---|
| `quizId` | `@unique` | All student joins use `WHERE quizId = 'QZ123456'` |
| `createdById` | Regular (FK) | Teacher dashboard: `WHERE createdById = teacherId` |
| `status` | Regular | Filter active exams: `WHERE status = 'ACTIVE'` |
| `(createdById, status)` | **Compound** | Teacher dashboard: active quizzes only — hits both filters |
| `otpExpiresAt` | Regular | OTP expiry check: `WHERE otpExpiresAt > NOW()` |

### `Result` table
| Index | Type | Why |
|---|---|---|
| `(quizId, studentId)` | `@@unique` | One-attempt enforcement + fast lookup |
| `quizId` | Regular (FK) | Teacher: all results for a quiz |
| `studentId` | Regular (FK) | Student dashboard: all my results |
| `completedAt` | Regular | Sorting results by date |

### `Warning` table
| Index | Type | Why |
|---|---|---|
| `(quizId, studentId)` | **Compound** | Teacher monitor: all warnings per student per exam |
| `studentId` | Regular (FK) | Count warnings for a student in an exam |

### `Question` table
| Index | Type | Why |
|---|---|---|
| `(quizId, order)` | **Compound** | Fetch all questions for a quiz in order |

### Summary: Index Rules Applied
1. Every Foreign Key gets an index (Prisma doesn't auto-create them for PostgreSQL)
2. Every filter-heavy `WHERE` clause column gets indexed
3. Compound indexes on columns that are ALWAYS queried together
4. `UNIQUE` indexes double as performance indexes

---

## 4. Security Architecture — 6 Layers

```
Request arrives
      │
      ▼
┌─────────────────────────────┐
│  Layer 1: Helmet            │  Sets 15 HTTP security headers (X-Frame-Options,
│  (express app level)        │  Content-Security-Policy, HSTS, etc.)
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Layer 2: CORS              │  Only allows requests from FRONTEND_URL env var
│  (express app level)        │  Blocks all other origins
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Layer 3: Rate Limiter      │  loginLimiter: 10 req / 15 min / IP
│  (route level)              │  otpLimiter:   5 req / 10 min / IP
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Layer 4: Zod Validation    │  Every request body parsed against a schema
│  (route level)              │  Malformed input → 400 (never reaches controller)
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Layer 5: JWT Auth          │  verifyToken middleware reads Authorization header
│  (route level, protected)   │  Attaches decoded req.user to request object
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Layer 6: Role Guard        │  requireRole('teacher') / requireRole('admin')
│  (route level, protected)   │  403 if role mismatch
└─────────────┬───────────────┘
              │
              ▼
        Controller / Service
```

### Auth Flow Detail
```
POST /api/auth/login
  → zod validates { email, password }
  → bcryptjs.compare(password, hash)
  → jwt.sign({ id, role, name }, JWT_SECRET, { expiresIn: '7d' })
  → Returns: { token, user: { id, name, email, role } }

All protected routes:
  → Authorization: Bearer <token>
  → auth.middleware.js verifies token → req.user = decoded payload
```

### What is Secured
| Risk | Protection |
|---|---|
| XSS steals token | Token in localStorage (acceptable for demo); Helmet CSP headers |
| Brute-force login | Rate limiter: 10 req/15min |
| SQL injection | Prisma parameterized queries — immune by design |
| Mass assignment | Zod schemas only allow whitelisted fields |
| Unauthorized API access | JWT on every protected route |
| Role escalation | role.middleware.js checks role on every sensitive route |
| CORS abuse | Only frontend URL allowed |
| Password leak | bcryptjs with 10 salt rounds |
| OTP reuse | OTP + otpExpiresAt in DB; invalidated after use |

---

## 5. WebSocket Architecture — Socket.IO

### Server-Side Room Design
```
When teacher starts an exam:
  Teacher joins room:   "exam:{quizId}:teacher"

When student joins exam:
  Student joins room:   "exam:{quizId}"

This separates student events from teacher monitor events.
```

### Complete Event Protocol

| Direction | Event Name | Payload | Description |
|---|---|---|---|
| Client → Server | `student:join` | `{ quizId, studentId, name }` | Student enters exam |
| Client → Server | `student:warning` | `{ quizId, studentId, type }` | Warning triggered (fullscreen/tab) |
| Client → Server | `student:heartbeat` | `{ quizId, studentId }` | Ping every 30s (detect disconnect) |
| Client → Server | `student:submitted` | `{ quizId, studentId }` | Student finished |
| Client → Server | `teacher:monitor` | `{ quizId }` | Teacher subscribes to exam feed |
| Client → Server | `teacher:force-submit` | `{ quizId, studentId }` | Teacher force-submits a student |
| Server → Client | `exam:student-joined` | `{ studentId, name, status }` | Teacher sees student join |
| Server → Client | `exam:warning` | `{ studentId, name, type, count }` | Teacher sees live warning |
| Server → Client | `exam:student-disconnected` | `{ studentId }` | Student lost connection |
| Server → Client | `exam:student-submitted` | `{ studentId }` | Teacher counter updates |
| Server → Client | `student:force-submit` | `{ reason }` | Server forces submission |
| Server → Client | `exam:started` | `{ quizId }` | Teacher activates exam, students unlocked |

### Socket Auth
Every socket connection sends JWT in `auth.token`. Server verifies before allowing room join.

---

## 6. API Endpoint Registry

### Auth — `/api/auth`
| Method | Path | Protected | Role | Description |
|---|---|---|---|---|
| POST | `/login/student` | No | - | Student login |
| POST | `/login/teacher` | No | - | Teacher login |
| POST | `/signup/student` | No | - | Student register |
| POST | `/signup/teacher` | No | - | Teacher register |

### Student — `/api/students`
| Method | Path | Protected | Role | Description |
|---|---|---|---|---|
| GET | `/me` | Yes | student | Get own profile |
| PUT | `/me` | Yes | student | Update profile |
| GET | `/dashboard` | Yes | student | Results + profile data |

### Teacher — `/api/teachers`
| Method | Path | Protected | Role | Description |
|---|---|---|---|---|
| GET | `/me` | Yes | teacher | Get own profile |
| GET | `/dashboard` | Yes | teacher | Quiz list + stats |

### Quiz — `/api/quizzes`
| Method | Path | Protected | Role | Description |
|---|---|---|---|---|
| POST | `/` | Yes | teacher | Create quiz |
| GET | `/` | Yes | teacher | Get all my quizzes |
| GET | `/:quizId` | Yes | any | Get quiz by ID |
| PUT | `/:quizId` | Yes | teacher | Edit quiz |
| DELETE | `/:quizId` | Yes | teacher | Delete quiz |
| POST | `/:quizId/duplicate` | Yes | teacher | Clone quiz |
| POST | `/:quizId/generate-otp` | Yes | teacher | Generate new OTP |
| POST | `/:quizId/verify-otp` | Yes | student | Verify OTP to join |
| PUT | `/:quizId/status` | Yes | teacher | Change status |

### Results — `/api/results`
| Method | Path | Protected | Role | Description |
|---|---|---|---|---|
| POST | `/submit` | Yes | student | Submit quiz answers |
| GET | `/check/:quizId` | Yes | student | Check if already attempted |
| GET | `/:resultId` | Yes | any | Get result detail |
| GET | `/quiz/:quizId` | Yes | teacher | All results for a quiz |
| GET | `/export/:quizId` | Yes | teacher | Download Excel file |

### Admin — `/api/admin`
| Method | Path | Protected | Role | Description |
|---|---|---|---|---|
| POST | `/login` | No | - | Admin login |
| GET | `/teachers/pending` | Yes | admin | Pending approvals |
| PUT | `/teachers/:id/approve` | Yes | admin | Approve teacher |
| PUT | `/teachers/:id/reject` | Yes | admin | Reject with reason |
| GET | `/stats` | Yes | admin | System-wide stats |
| GET | `/students` | Yes | admin | All students list |

---

## 7. Middleware Execution Chain

```javascript
// src/app.js — exact order matters

app.use(helmet())                   // 1. Security headers (first always)
app.use(cors({ origin: FRONTEND })) // 2. CORS (before any routes)
app.use(compression())              // 3. Gzip compress responses
app.use(express.json())             // 4. Parse JSON bodies
app.use(express.urlencoded())       // 5. Parse form data

// Routes
app.use('/api/auth',     authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/teachers', teacherRoutes)
app.use('/api/quizzes',  quizRoutes)
app.use('/api/results',  resultRoutes)
app.use('/api/admin',    adminRoutes)

app.use(errorMiddleware)            // LAST: global error handler
```

---

## 8. Redis Caching Strategy

| Cache Key | Value Cached | TTL | Why |
|---|---|---|---|
| `quiz:{quizId}` | Full quiz object (questions, title, duration) | 3600s (1hr) | Fetched by every student during exam — avoid DB hit per student |
| `otp:{quizId}` | OTP code | 600s (10min) | Faster OTP check than DB query |
| `result:check:{quizId}:{studentId}` | `true` or `false` | 86400s | Prevents re-attempt check from hitting DB |

### Cache Invalidation Rules
- Quiz cache invalidated when teacher edits quiz
- OTP cache invalidated after student verifies (one use)
- Result cache set after first submission

---

## 9. Service Layer Responsibilities

### `quiz.service.js` (most complex)
```
createQuiz(teacherId, { title, questions, allowedStudents, durationInMinutes })
  → generate quizId (QZ + timestamp)
  → generate OTP + expiry
  → Prisma.quiz.create() with nested questions
  → send OTP email to teacher
  → return { quizId }

submitQuiz(studentId, quizId, answers)
  → Prisma transaction {
      check @@unique(quizId, studentId) — throw if exists
      calculate score + accuracy
      Prisma.result.create() with nested responses
      Prisma.student.update() — mark quiz as attempted
    }
  → invalidate Redis cache
  → emit socket event: 'exam:student-submitted'
  → return { resultId }
```

### `warning.service.js` (new, previously broken)
```
logWarning(studentId, quizId, type, io)
  → Prisma.warning.upsert() — increment count for (student, quiz, type)
  → get total warning count for this student in this exam
  → emit to teacher room: 'exam:warning'
  → if count >= MAX_WARNINGS:
      emit to student socket: 'student:force-submit'
  → return { warningCount, shouldForceSubmit }
```

---

## 10. Missing Features Being Fixed

| Feature | Status Now | Fix |
|---|---|---|
| `durationInMinutes` | Used in QuizAttempt but **never saved** in create | Add to: (1) CreateQuiz form, (2) POST /quizzes schema, (3) Prisma Quiz model |
| Warning system | `monitorController.js` 100% commented out | Full `warning.service.js` + socket emit |
| Live teacher monitor | Does not exist | `ExamMonitor.jsx` page + teacher socket room |
| Excel export | Promised in README, not built | `export.service.js` + `GET /results/export/:quizId` |
| Admin approval | Model exists, flow incomplete | Admin routes + email on approve |
| Hardcoded `localhost:8000` | In every frontend file | Central `src/lib/api.js` with `VITE_API_URL` |
| All students exposed | `GET /students/` no auth | Restrict to admin role only |
| OTP via Email | Works partially | Consolidate in `email.service.js` |

---

## 11. Frontend Architecture Rules

### `src/lib/api.js` — Single source of truth for all HTTP calls
```
Every component imports: import api from '../lib/api'
Never: import axios from 'axios' directly anywhere

api.interceptors.request  → auto-inject Authorization header
api.interceptors.response → catch 401 → clear token → redirect /login
```

### `src/hooks/useSocket.js` — Single WebSocket connection
```
Used by:
  - QuizAttempt.jsx    (student events: join, warning, heartbeat, force-submit)
  - ExamMonitor.jsx    (teacher events: student-joined, warning, disconnected)
  - StaffDashboard.jsx (teacher: start exam, see live count)

NOT used by: Login pages, Results page, Admin pages (no real-time needed)
```

### Lazy Loading in `App.jsx`
```javascript
// All heavy pages loaded on demand
const QuizAttempt    = React.lazy(() => import('./pages/QuizAttempt'))
const ExamMonitor    = React.lazy(() => import('./pages/ExamMonitor'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const QuizResults    = React.lazy(() => import('./pages/QuizResults'))
```

---

## 12. `.env` Files

### `Back-End/.env` (full list)
```bash
# Server
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:pass@host:5432/proctorx

# Auth
JWT_SECRET=<256-bit-random-string>

# Email (Brevo/Nodemailer)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your@smtp.com
EMAIL_PASS=your-smtp-pass
EMAIL_FROM=noreply@proctorx.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong-password>

# Warning limit
MAX_WARNINGS=5
```

### `Front-End/.env`
```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=http://localhost:8000
```

---

## 13. Deployment Architecture

```
GitHub Repository
       │
       ├──► Vercel (Front-End/)
       │         Auto-deploy on push to main
       │         Sets VITE_API_URL + VITE_WS_URL env vars
       │
       └──► Railway (Back-End/)
                 Detects package.json → runs npm start
                 Sets all backend env vars
                 Supports WebSocket ✅
                       │
                       ├──► Neon.tech (PostgreSQL)
                       │         Free tier 512MB
                       │         Connection via DATABASE_URL
                       │
                       └──► Upstash (Redis)
                                 Free 10k req/day
                                 REST API (works in serverless)
```

---

## 14. File-by-File Implementation Order

> This is the exact sequence to write code — each file depends on the one before it.

```
Round 1 — Foundation (no dependencies)
  1.  prisma/schema.prisma
  2.  src/config/env.js
  3.  src/config/database.js
  4.  src/config/redis.js
  5.  src/utils/helpers.js
  6.  src/utils/logger.js

Round 2 — Services Foundation
  7.  src/services/email.service.js
  8.  src/schemas/auth.schema.js
  9.  src/schemas/quiz.schema.js
  10. src/schemas/result.schema.js

Round 3 — Middleware
  11. src/middleware/auth.middleware.js
  12. src/middleware/role.middleware.js
  13. src/middleware/validate.middleware.js
  14. src/middleware/rateLimiter.js
  15. src/middleware/upload.middleware.js
  16. src/middleware/error.middleware.js

Round 4 — Business Logic Services (depend on DB + email)
  17. src/services/auth.service.js
  18. src/services/student.service.js
  19. src/services/teacher.service.js
  20. src/services/quiz.service.js
  21. src/services/result.service.js
  22. src/services/warning.service.js
  23. src/services/admin.service.js
  24. src/services/export.service.js

Round 5 — Controllers + Routes (depend on services + middleware)
  25. src/controllers/auth.controller.js + src/routes/auth.routes.js
  26. src/controllers/student.controller.js + src/routes/student.routes.js
  27. src/controllers/teacher.controller.js + src/routes/teacher.routes.js
  28. src/controllers/quiz.controller.js + src/routes/quiz.routes.js
  29. src/controllers/result.controller.js + src/routes/result.routes.js
  30. src/controllers/admin.controller.js + src/routes/admin.routes.js

Round 6 — WebSocket (depends on services)
  31. src/sockets/exam.socket.js
  32. src/sockets/index.js

Round 7 — App + Server (wires everything together)
  33. src/app.js
  34. server.js

Round 8 — Frontend (depends on stable backend API)
  35. Front-End/src/lib/api.js
  36. Front-End/src/hooks/useSocket.js
  37. Front-End/src/components/ErrorBoundary.jsx
  38. Front-End/src/components/SkeletonLoader.jsx
  39. Front-End/src/index.css  (design tokens)
  40. Front-End/src/pages/ExamMonitor.jsx  (new page)
  41. Front-End/src/App.jsx  (lazy routes)
  42. Front-End/src/components/CreateQuiz.jsx  (duration fix)
  43. Front-End/src/pages/QuizAttempt.jsx  (socket + duration)
  44. Front-End/src/pages/AdminDashboard.jsx  (approval flow)
  45. Front-End/src/components/StaffDashboard.jsx  (live exam)
  46. Front-End/src/pages/QuizResults.jsx  (charts)

Round 9 — Config + Deployment
  47. Back-End/.env.example
  48. Front-End/.env + .env.example
  49. Back-End/Dockerfile
  50. Back-End/src/scripts/migrate-mongo-to-pg.js
```

---

## 15. Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| ORM | Prisma | Type-safe queries, auto migrations, great JS support |
| DB | PostgreSQL | ACID, relations, `@@unique` one-attempt rule at DB level |
| WebSocket | Socket.IO | Rooms, auto-reconnect, fallback to polling |
| Cache | Upstash Redis | Free tier, REST API, no infrastructure to manage |
| Validation | Zod | Schema-first, composable, great error messages |
| Security headers | Helmet | One-line, covers 15 headers |
| Logging | Winston | File + console, production-ready |
| Email | Nodemailer + Brevo | Already configured in your .env ✅ |
| File storage | Cloudinary | Already integrated ✅ |
| Export | ExcelJS | Streams large files without memory issues |

---

## 16. Database Fast Fetching Strategy

> Goal: Every query must return in **< 50ms** under college load (200–500 concurrent students).

---

### 16A. The 5 Layers of DB Speed

```
Request
  │
  ▼
┌─────────────────────────────────────┐
│  Layer 1: Redis Cache               │  Check cache FIRST — 0 DB queries
│  Hit rate target: 80%+ during exam  │  < 1ms response from memory
└──────────────┬──────────────────────┘
               │ Cache miss
               ▼
┌─────────────────────────────────────┐
│  Layer 2: Connection Pool           │  Reuse existing DB connections
│  (Prisma connection pool)           │  No TCP handshake overhead
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Layer 3: Index Hit                 │  Query hits index — no full table scan
│  (PostgreSQL B-Tree indexes)        │  O(log n) lookup instead of O(n)
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Layer 4: Prisma select{}           │  Only fetch columns you actually need
│  (column pruning)                   │  Smaller payload = faster transfer
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Layer 5: Pagination                │  Never return unbounded result sets
│  (cursor-based)                     │  Max 20 rows per page
└─────────────────────────────────────┘
```

---

### 16B. Prisma Connection Pool Config

**Problem:** By default Prisma opens 1 connection. Under 200 students, queries queue up.

**Fix in `src/config/database.js`:**
```javascript
// Connection pool formula: (2 × CPU cores) + 1
// Railway free tier = 1 vCPU → pool size = 3
const DATABASE_URL = process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=20'

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error']
})
```

**Connection limit guide:**
| Deployment | Concurrent Users | Pool Size |
|---|---|---|
| Railway free (1 vCPU) | < 100 | `connection_limit=5` |
| Railway hobby (2 vCPU) | 100–500 | `connection_limit=10` |
| College server (4 vCPU) | 500–1000 | `connection_limit=20` |

---

### 16C. Query Optimization Rules — Per Endpoint

#### Rule 1: `select` only what you need (never `SELECT *`)

```javascript
// ❌ BAD — fetches passwordHash, createdAt, updatedAt unnecessarily
const student = await prisma.student.findUnique({ where: { id } })

// ✅ GOOD — 40% smaller payload, faster transfer
const student = await prisma.student.findUnique({
  where: { id },
  select: { id: true, name: true, email: true, profilePicture: true }
})
```

#### Rule 2: Use `include` not multiple queries (kills N+1)

```javascript
// ❌ BAD — N+1 problem: 1 query for quiz + N queries for questions
const quiz = await prisma.quiz.findUnique({ where: { quizId } })
const questions = await prisma.question.findMany({ where: { quizId: quiz.id } })

// ✅ GOOD — 1 query with JOIN
const quiz = await prisma.quiz.findUnique({
  where: { quizId },
  include: {
    questions: { orderBy: { order: 'asc' } }
  }
})
```

#### Rule 3: Use `findUnique` over `findFirst` when you have a unique field

```javascript
// ❌ SLOWER — findFirst does a sequential scan + limit 1
const student = await prisma.student.findFirst({ where: { email } })

// ✅ FASTER — findUnique uses the @unique index directly
const student = await prisma.student.findUnique({ where: { email } })
```

#### Rule 4: Paginate all list queries

```javascript
// ❌ BAD — returns ALL results ever
const results = await prisma.result.findMany({ where: { quizId } })

// ✅ GOOD — cursor-based pagination (faster than offset for large datasets)
const results = await prisma.result.findMany({
  where: { quizId },
  take: 20,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { completedAt: 'desc' },
  select: { id: true, score: true, accuracy: true, student: { select: { name: true } } }
})
```

#### Rule 5: Use Prisma transactions for atomic multi-step writes

```javascript
// ✅ Quiz submission — all-or-nothing in ONE transaction
const result = await prisma.$transaction(async (tx) => {
  // 1. Check duplicate attempt (uses @@unique index — instant)
  const existing = await tx.result.findUnique({
    where: { quizId_studentId: { quizId, studentId } }
  })
  if (existing) throw new Error('Already attempted')

  // 2. Create result + responses in one round-trip
  return await tx.result.create({
    data: {
      score, totalQuestions, accuracy, timeTaken,
      quizId, studentId,
      responses: { createMany: { data: responses } }
    }
  })
})
```

---

### 16D. Full Index Map — Every Index in `schema.prisma`

```prisma
model Student {
  email    String  @unique          // ← LOGIN: WHERE email = ?
  isActive Boolean @default(true)

  @@index([isActive])               // ← ADMIN: WHERE isActive = true
}

model Teacher {
  email      String  @unique        // ← LOGIN: WHERE email = ?
  staffId    String  @unique        // ← VALIDATION: WHERE staffId = ?
  isApproved Boolean @default(false)

  @@index([isApproved])             // ← ADMIN: WHERE isApproved = false
}

model Quiz {
  quizId      String     @unique    // ← JOIN: WHERE quizId = 'QZ123456'
  createdById String                // FK — needs manual index in Postgres
  status      QuizStatus

  @@index([createdById])            // ← TEACHER DASH: WHERE createdById = ?
  @@index([status])                 // ← ACTIVE FILTER: WHERE status = 'ACTIVE'
  @@index([createdById, status])    // ← COMPOUND: teacher + status together
  @@index([otpExpiresAt])           // ← OTP CHECK: WHERE otpExpiresAt > NOW()
}

model Question {
  quizId String
  order  Int

  @@index([quizId, order])          // ← FETCH SORTED: WHERE quizId + ORDER BY order
}

model Result {
  quizId    String
  studentId String
  completedAt DateTime

  @@unique([quizId, studentId])     // ← ONE-ATTEMPT + fast lookup (also an index)
  @@index([quizId])                 // ← TEACHER: all results for a quiz
  @@index([studentId])              // ← STUDENT DASH: all my results
  @@index([completedAt])            // ← SORT: ORDER BY completedAt DESC
}

model Warning {
  quizId    String
  studentId String

  @@index([quizId, studentId])      // ← MONITOR: warnings per student per exam
  @@index([studentId])              // ← COUNT: total warnings for a student
}
```

---

### 16E. Redis Caching — Exact Implementation

#### Cache-Aside Pattern (used everywhere)

```
Read:
  1. Check Redis key → hit? return cached data
  2. Miss? → query PostgreSQL
  3. Store result in Redis with TTL
  4. Return data

Write/Update:
  1. Update PostgreSQL
  2. DELETE Redis key (invalidate, not update)
  3. Next read will re-populate cache
```

#### Full Cache Key Registry

| Key Pattern | Data Stored | TTL | Invalidated When |
|---|---|---|---|
| `quiz:{quizId}` | Full quiz + questions JSON | `3600s` (1hr) | Teacher edits quiz |
| `otp:{quizId}` | OTP string | `600s` (10min) | Student verifies OTP |
| `result:check:{quizId}:{studentId}` | `"true"` string | `86400s` (24hr) | Never (immutable) |
| `teacher:quizzes:{teacherId}` | Quiz list array JSON | `300s` (5min) | Teacher creates/deletes quiz |
| `admin:stats` | Dashboard stats object | `60s` (1min) | Any write operation |

#### Redis Operations in Code

```javascript
// src/config/redis.js
const { Redis } = require('@upstash/redis')
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

// Helper: cache-aside wrapper
async function withCache(key, ttl, fetchFn) {
  const cached = await redis.get(key)
  if (cached) return cached                     // ← Cache HIT: skip DB
  const data = await fetchFn()                  // ← Cache MISS: query DB
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}

module.exports = { redis, withCache }
```

**Usage in quiz.service.js:**
```javascript
const quiz = await withCache(
  `quiz:${quizId}`,
  3600,
  () => prisma.quiz.findUnique({
    where: { quizId },
    include: { questions: { orderBy: { order: 'asc' } } }
  })
)
```

---

### 16F. Slow Query Prevention Checklist

Before writing ANY Prisma query, ask:

```
✅ Does this query hit an index?
   → Check: is the WHERE field in @@index or @unique?
   → If no → add index or restructure query

✅ Am I selecting only needed columns?
   → Use select: { field: true } for every read

✅ Is this query inside a loop?
   → NEVER query inside a for/map loop → use include or findMany with IN

✅ Can this be served from Redis cache?
   → If same data is read by multiple users → cache it

✅ Does this return unbounded results?
   → Always add take: N limit

✅ Is this a write that needs to be atomic?
   → Use prisma.$transaction()
```

---

### 16G. Expected Performance Targets

| Endpoint | Without optimization | With indexes + cache | Target |
|---|---|---|---|
| `GET /api/quizzes/:quizId` (student load) | ~120ms | ~2ms (Redis hit) | **< 5ms** |
| `POST /api/results/submit` | ~400ms (N+1) | ~35ms (transaction) | **< 50ms** |
| `GET /api/students/dashboard` | ~250ms | ~40ms (select + index) | **< 50ms** |
| `GET /api/results/check/:quizId` | ~80ms | ~1ms (Redis hit) | **< 2ms** |
| `GET /api/admin/stats` | ~500ms | ~10ms (Redis 60s TTL) | **< 15ms** |
| Socket warning emit | ~200ms (HTTP) | ~5ms (WebSocket) | **< 10ms** |

---

> **Ready to implement?** Say "start coding" and I will implement all 50 files in order, one phase at a time.
