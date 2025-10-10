// const monitoringService = require('../monitoring/monitoringService');

// exports.logWarning = async (req, res) => {
//     try {
//         const { studentId, quizId, type } = req.body;
//         const result = await monitoringService.logWarning(studentId, quizId, type);
//         res.status(200).json(result);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

// exports.applyPenalty = async (req, res) => {
//     try {
//         const { studentId, quizId, points } = req.body;
//         const result = await monitoringService.applyPenalty(studentId, quizId, points);
//         res.status(200).json(result);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

// exports.getStudentWarnings = async (req, res) => {
//     try {
//         const { studentId, quizId } = req.params;
//         const result = await monitoringService.getStudentWarnings(studentId, quizId);
//         res.status(200).json(result);
//     } catch (error) {
//         res.status(404).json({ message: error.message });
//     }
// };