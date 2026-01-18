import Warning from '../models/Warning.js';
import Result from '../models/Result.js';

export async function logWarning(studentId, quizId, type) {
    let warning = await Warning.findOne({ studentId, quizId, type });
    if (!warning) {
        warning = new Warning({ studentId, quizId, type, count: 1, lastWarningAt: new Date() });
    } else {
        warning.count += 1;
        warning.lastWarningAt = new Date();
    }
    await warning.save();

    const result = await Result.findOne({ user: studentId, quiz: quizId });
    if (result) {
        const totalWarningsAggregation = await Warning.aggregate([
            { $match: { studentId: result.user, quizId: result.quiz } },
            { $group: { _id: null, total: { $sum: "$count" } } }
        ]);
        result.warnings = totalWarningsAggregation.length > 0 ? totalWarningsAggregation[0].total : 0;
        await result.save();
    }

    const totalWarnings = await Warning.find({ studentId, quizId });
    const totalCount = totalWarnings.reduce((sum, w) => sum + w.count, 0);

    return { message: `Warning logged: ${type}`, warnings: warning.count, totalWarnings: totalCount };
}

export async function applyPenalty(studentId, quizId, points) {
    const result = await Result.findOne({ user: studentId, quiz: quizId });
    if (!result) {
        throw new Error('Result not found for this student');
    }
    result.penalties = (result.penalties || 0) + points;
    await result.save();

    return { message: `Penalty applied: ${points} points`, penalties: result.penalties };
}

export async function getStudentWarnings(studentId, quizId) {
    const warnings = await Warning.find({ studentId, quizId });
    const warningTypes = { cheating: 0, late: 0, distraction: 0, other: 0, fullscreen_exit: 0, tab_switch: 0 };
    warnings.forEach(w => {
        if (warningTypes.hasOwnProperty(w.type)) {
            warningTypes[w.type] = w.count;
        }
    });

    const result = await Result.findOne({ user: studentId, quiz: quizId });

    const totalWarnings = warnings.reduce((sum, w) => sum + w.count, 0);

    return {
        warnings: warningTypes,
        totalWarnings: totalWarnings,
        lastWarningAt: warnings.length > 0 ? warnings.sort((a, b) => b.lastWarningAt - a.lastWarningAt)[0].lastWarningAt : null,
        penalties: result ? result.penalties : 0
    };
}
