const express = require('express');
const Students = express.Router();
const Student = require('../models/Student');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUpload } = require('../middleware/uploadMiddleware');
const { isAuthenticatedUser } = require('../controllers/authController');
const studentUpload = getUpload('students');

// ------------------------- SIGNUP -------------------------
Students.post('/signup', studentUpload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const studentExists = await Student.findOne({ email });
    if (studentExists) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const studentData = {
      name,
      email,
      password: hashedPassword,
      profilePicture: req.file ? req.file.path : undefined
    };

    const student = new Student(studentData);
    await student.save();

    const payload = {
      id: student._id,
      name: student.name,
      email: student.email,
      role: 'student'
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ student, token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Error creating student", error: error.message });
  }
});

// ------------------------- LOGIN -------------------------
Students.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = {
      id: student._id,
      name: student.name,
      email: student.email,
      role: 'student'
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ student, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// ------------------------- DASHBOARD -------------------------
Students.get('/dashboard', isAuthenticatedUser, async (req, res) => {
  try {
    const student = req.user;
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const Result = require('../models/Result'); // Ensure this model exists
    const quizzes = await Result.find({ studentId: student._id })
      .populate('quizId', 'title totalQuestions')
      .sort({ completedAt: -1 });

    const formattedQuizzes = quizzes.map(q => ({
      resultId: q._id,
      quizTitle: q.quizId?.title || 'Unknown Quiz',
      score: q.score,
      totalQuestions: q.quizId?.totalQuestions || 0,
      accuracy: q.accuracy || 0,
      completedAt: q.completedAt,
    }));

    res.status(200).json({
      profile: {
        name: student.name,
        email: student.email,
        profilePicture: student.profilePicture,
      },
      quizzes: formattedQuizzes,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error loading dashboard', error: error.message });
  }
});

// ------------------------- GET CURRENT STUDENT -------------------------
Students.get("/me", isAuthenticatedUser, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { password, ...studentData } = student.toObject();
    res.status(200).json(studentData);
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

// ------------------------- GET ALL STUDENTS -------------------------
Students.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
});

// ------------------------- GET STUDENT BY ID -------------------------
Students.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ message: "Error fetching student", error: error.message });
  }
});

// ------------------------- UPDATE STUDENT -------------------------
Students.put('/:id', isAuthenticatedUser, studentUpload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (name) student.name = name;
    if (email) student.email = email;
    if (password) student.password = await bcrypt.hash(password, 10);
    if (req.file) student.profilePicture = req.file.path;

    await student.save();
    res.status(200).json(student);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Error updating student", error: error.message });
  }
});

// ------------------------- DELETE STUDENT -------------------------
Students.delete('/:id', isAuthenticatedUser, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await Student.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Error deleting student", error: error.message });
  }
});

module.exports = Students;
