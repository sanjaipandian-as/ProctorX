const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroom.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(verifyToken);

// Student self-enrollment route
router.post('/join', classroomController.joinClassroom);

router.use(requireRole('teacher', 'admin'));

router.post('/', classroomController.createClassroom);
router.get('/', classroomController.getClassrooms);
router.get('/students/search', classroomController.searchStudents);
router.get('/:classroomId', classroomController.getClassroomDetails);
router.post('/:classroomId/students', classroomController.addStudent);
router.delete('/:classroomId/students/:studentId', classroomController.removeStudent);

module.exports = router;
