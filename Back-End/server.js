import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import otpService from './routes/otpService.js';
import quizRoutes from './routes/quizzRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import aiQuizRoutes from './routes/aiQuizRoutes.js';
import monitorRoutes from './monitoring/monitorRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
// Production: Avoid logging environment status to prevent info leakage
if (process.env.NODE_ENV === 'development') {
  console.log("Cloudinary name:", process.env.CLOUDINARY_CLOUD_NAME ? "Loaded ✅" : "Missing ❌");
  console.log("Gemini API Key:", process.env.Gemini_API_Key ? "Loaded ✅" : "Missing ❌");
}

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://proctorxofficial.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


app.use(express.json());



app.use('/teachers', teacherRoutes);
app.use('/students', studentRoutes);
app.use('/otp', otpService);
app.use('/api/quizzes', quizRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/ai', aiQuizRoutes);
app.use('/api/monitoring', monitorRoutes);

const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});


// Final Catch-all Error Handler
app.use((err, req, res, next) => {
  console.error(`Status: ${err.status || 500}, Error: ${err.message}`);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    // Only send stack trace in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
