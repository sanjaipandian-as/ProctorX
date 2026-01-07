const express = require('express');
const Teachers = express.Router();
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Result = require("../models/Result");
const Quiz = require("../models/Quiz");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUpload } = require('../middleware/uploadMiddleware');
const { isAuthenticatedUser } = require('../controllers/authController');
const teacherUpload = getUpload('teachers');

Teachers.post('/signup', teacherUpload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Please provide all required fields" });

    const teacherExists = await Teacher.findOne({ email });
    if (teacherExists) return res.status(409).json({ message: "Email already in use." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = new Teacher({
      name,
      email,
      password: hashedPassword,
      profilePicture: req.file ? req.file.path : undefined
    });

    await teacher.save();

    const token = jwt.sign(
      { id: teacher._id, name: teacher.name, email: teacher.email, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        profilePicture: teacher.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating teacher", error: error.message });
  }
});

Teachers.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Please provide email and password" });

    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: teacher._id, name: teacher.name, email: teacher.email, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        profilePicture: teacher.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

Teachers.get('/details', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teachers", error: error.message });
  }
});

Teachers.get('/get/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teacher", error: error.message });
  }
});

Teachers.put('/edit/:id', isAuthenticatedUser, teacherUpload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own profile." });
    }

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    teacher.name = name || teacher.name;
    teacher.email = email || teacher.email;

    if (password) {
      teacher.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      teacher.profilePicture = req.file.path;
    }

    await teacher.save();

    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Error updating teacher", error: error.message });
  }
});

Teachers.delete('/quiz/:customQuizId/student/:studentId/reset', isAuthenticatedUser, async (req, res) => {
  try {
    const { customQuizId, studentId } = req.params;

    const quiz = await Quiz.findOne({ quizId: customQuizId });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You are not the owner of this quiz" });
    }

    const deletedResult = await Result.findOneAndDelete({
      quiz: quiz._id,
      user: studentId,
      userModel: "Student"
    });

    if (!deletedResult) {
      return res.status(404).json({ message: 'Result for this student not found' });
    }

    await Student.findByIdAndUpdate(studentId, {
      $pull: {
        results: { quizId: quiz._id },
        attemptedQuizzes: { quizId: quiz._id }
      }
    });

    res.status(200).json({ message: 'Attempt reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

Teachers.delete('/delete/:id', isAuthenticatedUser, async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own account." });
    }

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    await Teacher.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting teacher", error: error.message });
  }
});

module.exports = Teachers;