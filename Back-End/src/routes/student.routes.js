const express = require('express');
const router = express.Router();

const studentController = require('../controllers/student.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { studentUpload } = require('../middleware/upload.middleware');
const { validate } = require('../middleware/validate.middleware');
const { studentProfileUpdateSchema } = require('../schemas/auth.schema');

// Apply authorization check to all student routes
router.use(verifyToken);
router.use(requireRole('student'));

router.get('/me', studentController.getProfile);
router.put('/me', studentUpload.single('profilePicture'), validate(studentProfileUpdateSchema), studentController.updateProfile);
router.get('/dashboard', studentController.getDashboard);

module.exports = router;
