const studentService = require('../services/student.service');

const getProfile = async (req, res, next) => {
  try {
    const profile = await studentService.getProfile(req.user.id);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const profilePic = req.file ? req.file.path : undefined;

    const profile = await studentService.updateProfile(req.user.id, {
      name,
      email,
      password,
      profilePic
    });

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await studentService.getDashboard(req.user.id);
    res.status(200).json(dashboardData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboard
};
