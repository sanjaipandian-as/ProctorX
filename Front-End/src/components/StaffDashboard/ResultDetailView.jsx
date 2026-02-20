import { ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import CircularStat from './CircularStat';
import QuestionPalette from './QuestionPalette';
import QuestionCard from './QuestionCard';

export default function ResultDetailView({
    selectedResultDetail,
    viewingResultsOf,
    onBack,
    onUpdateMarks
}) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const submittedAt = new Date(selectedResultDetail.createdAt).toLocaleString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });

    const scoreValue = selectedResultDetail.score ?? 0;
    const totalPossibleMarks = selectedResultDetail.responses?.reduce((acc, r) => acc + (r.marks || 0), 0) || selectedResultDetail.totalQuestions || 0;
    const accuracyValue = Math.round(selectedResultDetail.accuracy ?? 0);
    const attemptedCount = selectedResultDetail.responses?.filter(r =>
        r.studentAnswer || (r.questionType?.toLowerCase() === 'coding' && r.codeSubmitted)
    ).length || 0;

    const incorrectValue = selectedResultDetail.responses?.filter(r =>
        r.questionType?.toLowerCase() !== 'descriptive' &&
        !r.isCorrect &&
        (r.studentAnswer || (r.questionType?.toLowerCase() === 'coding' && r.codeSubmitted))
    ).length || 0;

    const scorePercentage = Math.min(100, totalPossibleMarks > 0 ? (scoreValue / totalPossibleMarks) * 100 : 0);
    const accuracyPercentage = Math.min(100, accuracyValue);
    const attemptedPercentage = Math.min(100, (selectedResultDetail.responses?.length || 1) > 0 ? (attemptedCount / (selectedResultDetail.responses?.length || 1)) * 100 : 0);
    const incorrectPercentage = Math.min(100, (selectedResultDetail.responses?.length || 1) > 0 ? (incorrectValue / (selectedResultDetail.responses?.length || 1)) * 100 : 0);


    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#FFB343] hover:text-[#E5A03C] transition mb-6 font-medium">
                <ArrowLeft className="h-4 w-4" /> Back to Results List for "{viewingResultsOf?.title}"
            </button>

            {/* Performance Summary - Horizontal at Top */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                    Performance Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <CircularStat
                        label="Score"
                        value={`${scoreValue}/${totalPossibleMarks}`}
                        percentage={Math.round(scorePercentage)}
                    />
                    <CircularStat
                        label="Accuracy"
                        value={`${accuracyValue}%`}
                        percentage={accuracyPercentage}
                    />
                    <CircularStat
                        label="Attempted"
                        value={`${attemptedCount}/${selectedResultDetail.responses?.length || 0}`}
                        percentage={Math.round(attemptedPercentage)}
                    />
                    <CircularStat
                        label="Incorrect"
                        value={`${incorrectValue}`}
                        percentage={Math.round(incorrectPercentage)}
                    />
                </div>
            </div>

            {/* Main Content - Full Width */}
            <div className="w-full">
                {/* Student Info Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-lg"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{viewingResultsOf?.title}</h2>
                    <p className="text-gray-600 mb-4">Results for <span className="font-semibold text-[#FFB343]">{selectedResultDetail.user?.name || 'Student'}</span> ({selectedResultDetail.user?.email})</p>
                    <p className="text-sm text-gray-500">Submitted on: {submittedAt}</p>
                </motion.div>

                <QuestionPalette
                    responses={selectedResultDetail.responses || []}
                    currentQuestionIndex={currentQuestionIndex}
                    onQuestionSelect={setCurrentQuestionIndex}
                />

                {/* Proctoring Violations */}
                {selectedResultDetail.violations && selectedResultDetail.violations.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 shadow-md"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <h3 className="text-lg font-bold text-red-900 uppercase tracking-wider">Proctoring Log</h3>
                        </div>
                        <div className="space-y-3">
                            {selectedResultDetail.violations.map((v, i) => (
                                <div key={i} className="flex items-start gap-4 p-3 bg-white border border-red-200 rounded-xl">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{v.type || "Violation"}</span>
                                            <span className="text-[10px] text-gray-600 font-mono">
                                                {new Date(v.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700">{v.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Question Review */}
                <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-6">Question Review</h2>
                <div className="w-full">
                    {selectedResultDetail.responses?.map((res, index) => (
                        <QuestionCard key={index} response={res} index={index} onUpdateMarks={onUpdateMarks} />
                    ))}
                    {(!selectedResultDetail.responses || selectedResultDetail.responses.length === 0) && (
                        <p className="text-gray-500 text-center py-10">No response details available for this submission.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
