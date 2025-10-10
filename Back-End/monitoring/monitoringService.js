// const Warning = require('../models/Warning');
// const Result = require('../models/Result');
// const logger = require('../utils/logger');

// async function logWarning(studentId, quizId, type) {
//     let warning = await Warning.findOne({ studentId, quizId, type });
//     if (!warning) {
//         warning = new Warning({ studentId, quizId, type, count: 1, lastWarningAt: new Date() });
//     } else {
//         warning.count += 1;
//         warning.lastWarningAt = new Date();
//     }
//     await warning.save();

//     const result = await Result.findOne({ studentId, quizId });
//     if (result) {
//         const totalWarningsAggregation = await Warning.aggregate([
//             { $match: { studentId: result.studentId, quizId: result.quizId } },
//             { $group: { _id: null, total: { $sum: "$count" } } }
//         ]);
//         result.warnings = totalWarningsAggregation.length > 0 ? totalWarningsAggregation[0].total : 0;
//         await result.save();
//     }

//     logger.info(`Warning logged for student ${studentId} in quiz ${quizId} (type: ${type})`);

//     const totalWarnings = await Warning.find({ studentId, quizId });
//     const totalCount = totalWarnings.reduce((sum, w) => sum + w.count, 0);

//     return { message: `Warning logged: ${type}`, warnings: warning.count, totalWarnings: totalCount };
// }

// async function applyPenalty(studentId, quizId, points) {
//     const result = await Result.findOne({ studentId, quizId });
//     if (!result) {
//         logger.error(`Failed to apply penalty: Result not found for student ${studentId}`);
//         throw new Error('Result not found for this student');
//     }
//     result.penalties = (result.penalties || 0) + points;
//     await result.save();

//     logger.info(`Penalty applied for student ${studentId} in quiz ${quizId}: ${points} points`);
//     return { message: `Penalty applied: ${points} points`, penalties: result.penalties };
// }

// async function getStudentWarnings(studentId, quizId) {
//     const warnings = await Warning.find({ studentId, quizId });
//     const warningTypes = { cheating: 0, late: 0, distraction: 0, other: 0, fullscreen_exit: 0, tab_switch: 0 };
//     warnings.forEach(w => {
//         if (warningTypes.hasOwnProperty(w.type)) {
//             warningTypes[w.type] = w.count;
//         }
//     });

//     const result = await Result.findOne({ studentId, quizId });
//     logger.info(`Fetched warnings for student ${studentId} in quiz ${quizId}`);

//     const totalWarnings = warnings.reduce((sum, w) => sum + w.count, 0);

//     return {
//         warnings: warningTypes,
//         totalWarnings: totalWarnings,
//         lastWarningAt: warnings.length > 0 ? warnings.sort((a, b) => b.lastWarningAt - a.lastWarningAt)[0].lastWarningAt : null,
//         penalties: result ? result.penalties : 0
//     };
// }

// module.exports = { logWarning, applyPenalty, getStudentWarnings };