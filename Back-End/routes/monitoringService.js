// const Result = require("../models/Result");

// async function logWarning(studentId, quizId, type) {
//     const result = await Result.findOne({ studentId, quizId });
//     if (!result) throw new Error('Result not found for this student');
//     result.warnings = (result.warnings || 0) + 1;
//     await result.save();
//     return { message: `Warning logged: ${type}`, warnings: result.warnings };
// }

// async function applyPenalty(studentId, quizId, points) {
//     const result = await Result.findOne({ studentId, quizId });
//     if (!result) throw new Error('Result not found for this student');
//     result.penalties = (result.penalties || 0) + points;
//     await result.save();
//     return { message: `Penalty applied: ${points} points`, penalties: result.penalties };
// }

// async function getStudentWarnings(studentId, quizId) {
//     const result = await Result.findOne({ studentId, quizId  });
//     if (!result) throw new Error('Result not found for this student');
//     return { warnings: result.warnings || 0, penalties: result.penalties || 0 };
// }

// module.exports = { logWarning, applyPenalty, getStudentWarnings };
