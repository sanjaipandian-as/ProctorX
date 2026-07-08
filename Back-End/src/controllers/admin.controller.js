const adminService = require('../services/admin.service');

const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await adminService.loginAdmin(username, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getPendingTeachers = async (req, res, next) => {
  try {
    const list = await adminService.getPendingTeachers();
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

const approveTeacher = async (req, res, next) => {
  try {
    const result = await adminService.approveTeacher(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const rejectTeacher = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await adminService.rejectTeacher(req.params.id, reason || 'Registration details did not meet our requirements');
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getSystemStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

const getAllStudents = async (req, res, next) => {
  try {
    const students = await adminService.getAllStudents();
    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
};

const createTeacher = async (req, res, next) => {
  try {
    const { name, email, password, staffId } = req.body;
    const result = await adminService.createTeacherByAdmin({ name, email, password, staffId });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  getStats,
  getAllStudents,
  createTeacher
};
