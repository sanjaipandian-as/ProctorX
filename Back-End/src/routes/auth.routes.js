const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate.middleware');
const { studentUpload, teacherUpload } = require('../middleware/upload.middleware');

const {
  studentSignupSchema,
  teacherSignupSchema,
  loginSchema
} = require('../schemas/auth.schema');

// Student routes
router.post('/login/student', loginLimiter, validate(loginSchema), authController.loginStudent);
router.post('/signup/student', studentUpload.single('profilePicture'), validate(studentSignupSchema), authController.registerStudent);

// Teacher routes
router.post('/login/teacher', loginLimiter, validate(loginSchema), authController.loginTeacher);

module.exports = router;
