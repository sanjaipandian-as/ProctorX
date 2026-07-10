const teacherService = require('../services/teacher.service');

const getProfile = async (req, res, next) => {
  try {
    const profile = await teacherService.getProfile(req.user.id);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await teacherService.getDashboard(req.user.id);
    res.status(200).json(dashboardData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getDashboard
};
