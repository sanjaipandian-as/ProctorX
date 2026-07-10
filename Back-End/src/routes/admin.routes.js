const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { adminLoginSchema } = require('../schemas/auth.schema');

// Admin login is public
router.post('/login', validate(adminLoginSchema), adminController.loginAdmin);

// All other admin routes require JWT and Admin role
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/teachers/pending', adminController.getPendingTeachers);
router.put('/teachers/:id/approve', adminController.approveTeacher);
router.put('/teachers/:id/reject', adminController.rejectTeacher);
router.get('/stats', adminController.getStats);
router.get('/students', adminController.getAllStudents);
router.post('/teachers', adminController.createTeacher);

module.exports = router;
