const classroomService = require('../services/classroom.service');

const createClassroom = async (req, res, next) => {
  try {
    const result = await classroomService.createClassroom(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getClassrooms = async (req, res, next) => {
  try {
    const list = await classroomService.getClassrooms(req.user.id);
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

const addStudent = async (req, res, next) => {
  try {
    const result = await classroomService.addStudentToClassroom(req.params.classroomId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getClassroomDetails = async (req, res, next) => {
  try {
    const details = await classroomService.getClassroomDetails(req.params.classroomId);
    res.status(200).json(details);
  } catch (error) {
    next(error);
  }
};

const removeStudent = async (req, res, next) => {
  try {
    const result = await classroomService.removeStudentFromClassroom(req.params.classroomId, req.params.studentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const searchStudents = async (req, res, next) => {
  try {
    const { q } = req.query;
    const list = await classroomService.searchStudents(q || '');
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

const joinClassroom = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Classroom code is required.' });
    }
    const result = await classroomService.joinClassroomByCode(req.user.id, code);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClassroom,
  getClassrooms,
  addStudent,
  getClassroomDetails,
  removeStudent,
  searchStudents,
  joinClassroom
};
