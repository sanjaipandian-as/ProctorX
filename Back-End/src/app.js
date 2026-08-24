const express = require('express');
// Trigger cache invalidation reload
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const env = require('./config/env');
const errorMiddleware = require('./middleware/error.middleware');

// Routes imports
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const quizRoutes = require('./routes/quiz.routes');
const resultRoutes = require('./routes/result.routes');
const adminRoutes = require('./routes/admin.routes');
const classroomRoutes = require('./routes/classroom.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// 1. Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // For serving uploaded profiles
}));

// 2. CORS (configured to only allow our frontend URL)
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

// 3. Compression
app.use(compression());

// 4 & 5. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve files in uploads folder
app.use('/uploads', express.static('uploads'));

// Register endpoints
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
