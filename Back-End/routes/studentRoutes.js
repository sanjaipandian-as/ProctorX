const express = require('express');
const Students = express.Router();
const Student = require('../models/Student');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUpload } = require('../middleware/uploadMiddleware');
const { isAuthenticatedUser } = require('../controllers/authController');
const studentUpload = getUpload('students');
const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
// REMOVED: import responseSchema... (It was breaking the code and wasn't used)

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
    res.status(500).json({ message: "Error creating student", error: error.message });
  }
});

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
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

Students.get('/dashboard', isAuthenticatedUser, async (req, res) => {
  try {
    const student = req.user;

    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const results = await Result.find({
      user: student._id,
      userModel: "Student"
    })
      .populate("quiz", "title quizId questions")
      .sort({ createdAt: -1 });

    const formattedQuizzes = results.map(r => ({
      resultId: r._id,
      quizTitle: r.quiz?.title || "Unknown Quiz",
      quizId: r.quiz?.quizId || "",
      score: r.score,
      totalQuestions: r.totalQuestions,
      accuracy: r.accuracy,
      completedAt: r.completedAt
    }));

    res.status(200).json({
      profile: {
        name: student.name,
        email: student.email,
        profilePicture: student.profilePicture
      },
      quizzes: formattedQuizzes
    });
  } catch (error) {
    res.status(500).json({ message: "Error loading dashboard", error: error.message });
  }
});

Students.get("/me", isAuthenticatedUser, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { password, ...studentData } = student.toObject();
    res.status(200).json(studentData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});

Students.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
});

Students.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Error fetching student", error: error.message });
  }
});

Students.put('/:id', isAuthenticatedUser, studentUpload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own profile." });
    }

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (name) student.name = name;
    if (email) student.email = email;
    if (password) student.password = await bcrypt.hash(password, 10);
    if (req.file) student.profilePicture = req.file.path;

    await student.save();
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Error updating student", error: error.message });
  }
});

Students.delete('/:id', isAuthenticatedUser, async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own profile." });
    }

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting student", error: error.message });
  }
});

module.exports = Students;