const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroom.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createClassroomSchema, addStudentSchema, joinClassroomSchema } = require('../schemas/classroom.schema');

router.use(verifyToken);

// Student self-enrollment route
router.post('/join', requireRole('student'), validate(joinClassroomSchema), classroomController.joinClassroom);

router.post('/', requireRole('teacher'), validate(createClassroomSchema), classroomController.createClassroom);
router.get('/', requireRole('teacher', 'admin'), classroomController.getClassrooms);
router.get('/students/search', requireRole('teacher', 'admin'), classroomController.searchStudents);
router.get('/:classroomId', requireRole('teacher', 'admin'), classroomController.getClassroomDetails);
router.post('/:classroomId/students', requireRole('teacher', 'admin'), validate(addStudentSchema), classroomController.addStudent);
router.delete('/:classroomId/students/:studentId', requireRole('teacher', 'admin'), classroomController.removeStudent);

module.exports = router;
