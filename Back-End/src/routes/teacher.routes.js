const express = require('express');
const router = express.Router();

const teacherController = require('../controllers/teacher.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Apply auth to all teacher routes
router.use(verifyToken);
router.use(requireRole('teacher'));

router.get('/me', teacherController.getProfile);
router.get('/dashboard', teacherController.getDashboard);

module.exports = router;
