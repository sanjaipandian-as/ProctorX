const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { adminLoginSchema } = require('../schemas/auth.schema');
const { loginLimiter } = require('../middleware/rateLimiter');
const { rejectTeacherSchema, toggleAiAccessSchema, createTeacherSchema } = require('../schemas/admin.schema');

// Admin login is public
router.post('/login', loginLimiter, validate(adminLoginSchema), adminController.loginAdmin);

// All other admin routes require JWT and Admin role
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/teachers/pending', adminController.getPendingTeachers);
router.put('/teachers/:id/approve', adminController.approveTeacher);
router.put('/teachers/:id/reject', validate(rejectTeacherSchema), adminController.rejectTeacher);
router.put('/teachers/:id/ai-access', validate(toggleAiAccessSchema), adminController.toggleAiAccess);
router.get('/stats', adminController.getStats);
router.get('/students', adminController.getAllStudents);
router.post('/teachers', validate(createTeacherSchema), adminController.createTeacher);

module.exports = router;
