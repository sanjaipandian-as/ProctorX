import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import { fileURLToPath } from 'url';

import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import otpService from './routes/otpService.js';
import quizRoutes from './routes/quizzRoutes.js';
import resultRoutes from './routes/resultRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
console.log("Cloudinary name:", process.env.CLOUDINARY_CLOUD_NAME ? "Loaded ✅" : "Missing ❌");
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "Loaded ✅" : "Missing ❌");
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Loaded ✅" : "Missing ❌");


const app = express();


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://proctorx-six.vercel.app",
      "https://proctorxofficial.vercel.app"
    ],
    credentials: true
  })
);



app.use(express.json());



app.use('/teachers', teacherRoutes);
app.use('/students', studentRoutes);
app.use('/otp', otpService);
app.use('/api/quizzes', quizRoutes);
app.use('/api/results', resultRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Database connection error:', err);
});


// A simple route for the cron job to hit
app.get('/', (req, res) => {
  res.send('ProctorX Backend is Running!');
});
