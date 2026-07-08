const authService = require('../services/auth.service');
const logger = require('../utils/logger');

const registerStudent = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const profilePic = req.file ? req.file.path : undefined;

    const result = await authService.signupStudent({
      name,
      email,
      password,
      profilePic
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Student registration error:', error);
    next(error);
  }
};

const loginStudent = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginStudent(email, password);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Student login error:', error);
    next(error);
  }
};

const registerTeacher = async (req, res, next) => {
  try {
    const { name, email, password, staffId } = req.body;
    const profilePic = req.file ? req.file.path : undefined;

    const result = await authService.signupTeacher({
      name,
      email,
      password,
      staffId,
      profilePic
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Teacher registration error:', error);
    next(error);
  }
};

const loginTeacher = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginTeacher(email, password);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Teacher login error:', error);
    next(error);
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  registerTeacher,
  loginTeacher
};
