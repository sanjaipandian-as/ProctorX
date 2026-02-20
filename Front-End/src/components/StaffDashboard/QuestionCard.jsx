import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Check, X, Save, CheckCircle2 as CheckCircleIcon, XCircle as XCircleIcon } from 'lucide-react';
import { EditIcon } from './Icons';

export default function QuestionCard({ response, index, onUpdateMarks }) {
    const { questionText, options, studentAnswer, correctAnswer, isCorrect, questionType, marks, obtainedMarks } = response;
    const [manualMarks, setManualMarks] = useState(obtainedMarks || 0);

    // Sync state when response changes
    useEffect(() => {
        setManualMarks(obtainedMarks || 0);
    }, [obtainedMarks]);

    return (
        <motion.div
            id={`q-${index + 1}`}
            className="p-5 bg-white border border-gray-200 rounded-2xl mb-4 shadow-md hover:shadow-lg transition-all"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                    <p className="text-lg font-medium text-gray-900">
                        <span className="text-[#FFB343] font-bold mr-2">Q{index + 1}.</span> {questionText}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded uppercase border border-gray-200">
                            {questionType}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">
                            Marks: {response.obtainedMarks || 0} / {response.marks || 0}
                        </span>
                    </div>
                </div>
                {questionType?.toLowerCase() === 'descriptive' ? (
                    <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                ) : isCorrect ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                ) : (
                    <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                )}
            </div>

            {questionType === 'mcq' && (
                <div className="space-y-3 mt-3">
                    {options?.map((option, optIndex) => {
                        const isSelectedAnswer = option === studentAnswer;
                        const isCorrectAnswer = option === correctAnswer;

                        let stateClass = "border-gray-200 bg-gray-50 text-gray-700";
                        if (isCorrectAnswer) {
                            stateClass = "border-green-300 bg-green-50 text-green-800 font-semibold";
                        } else if (isSelectedAnswer && !isCorrectAnswer) {
                            stateClass = "border-red-300 bg-red-50 text-red-800 font-semibold";
                        }

                        return (
                            <div key={optIndex} className={`p-3 border rounded-xl flex items-center justify-between transition-all duration-300 ${stateClass}`}>
                                <span>{option}</span>
                                {isSelectedAnswer && (
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                                        Your Answer
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {(questionType?.toLowerCase() === 'coding' || response.testcases?.length > 0) && (
                <div className="mt-4 space-y-3">
                    <div className="bg-gray-900 p-3 rounded-xl border border-gray-700">
                        <p className="text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">Submitted Code:</p>
                        <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap">{response.codeSubmitted || "// No code submitted"}</pre>
                    </div>
                    {response.testcases && response.testcases.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {response.testcases.map((tc, idx) => (
                                <div key={idx} className={`p-2 rounded-xl border text-xs ${tc.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold uppercase text-gray-600">Test {idx + 1}</span>
                                        {tc.passed ? <Check size={12} className="text-green-600" /> : <X size={12} className="text-red-600" />}
                                    </div>
                                    <p className="truncate text-gray-700"><span className="text-gray-500">In:</span> {tc.input}</p>
                                    <p className="truncate text-gray-700"><span className="text-gray-500">Out:</span> {tc.output || 'No output'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {questionType?.toLowerCase() === 'descriptive' && (
                <div className="mt-4 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-600 mb-2 uppercase font-bold tracking-wider">Student Answer:</p>
                        <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{studentAnswer || "No answer provided"}</div>
                    </div>

                    {response.isEvaluated && !response.isEditingManual ? (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-full">
                                    <CheckCircleIcon size={18} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Evaluation Complete</p>
                                    <p className="text-sm text-gray-900">The student was awarded <span className="font-bold text-green-700">{obtainedMarks} / {marks}</span> marks.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onUpdateMarks(index, manualMarks, true)}
                                className="text-[10px] font-bold uppercase text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                            >
                                <EditIcon size={12} /> Edit Grade
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
                            <div className="flex-1">
                                <label className="text-[10px] text-amber-700 font-bold uppercase block mb-1">Manual Rating</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        max={marks}
                                        min="0"
                                        value={manualMarks}
                                        onChange={(e) => setManualMarks(e.target.value)}
                                        className="bg-white border border-gray-300 rounded-lg px-2 py-1 w-16 text-gray-900 font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                                    />
                                    <span className="text-gray-600 text-sm">/ {marks} Marks</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onUpdateMarks(index, manualMarks, false)}
                                className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md group"
                            >
                                <Save size={14} className="group-hover:rotate-12 transition-transform" />
                                {response.isEditingManual ? 'Update Score' : 'Save Grade'}
                            </button>
                        </div>
                    )}
                </div>
            )}

        </motion.div>
    );
}
