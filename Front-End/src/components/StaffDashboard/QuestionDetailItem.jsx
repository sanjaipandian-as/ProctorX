import { motion } from 'framer-motion';
import {
    Code2,
    FileText,
    CheckCircle2,
    Check,
    Terminal,
    MoreHorizontal,
    Edit3,
    Trash,
    Cpu,
    ListChecks,
    AlignLeft
} from 'lucide-react';

export default function QuestionDetailItem({ q, index }) {
    const questionType = q.questionType;

    const getTypeIcon = () => {
        switch (questionType?.toLowerCase()) {
            case 'mcq': return <ListChecks className="h-4 w-4" />;
            case 'coding': return <Code2 className="h-4 w-4" />;
            case 'descriptive': return <AlignLeft className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getTypeStyles = () => {
        switch (questionType?.toLowerCase()) {
            case 'mcq': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10 shadow-sm shadow-blue-500/5';
            case 'coding': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/10 shadow-sm shadow-purple-500/5';
            case 'descriptive': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 shadow-sm shadow-emerald-500/5';
            default: return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/10';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            className="group relative bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06)] hover:border-gray-200 transition-all duration-300 overflow-hidden"
        >
            {/* Subtle Gradient Overlay on Hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${questionType === 'mcq' ? 'from-blue-50/30' :
                    questionType === 'coding' ? 'from-purple-50/30' :
                        'from-emerald-50/30'
                } to-transparent`} />

            <div className="p-6 pl-7 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 text-gray-500 font-bold text-sm border border-gray-100 shadow-sm">
                            {(index + 1).toString().padStart(2, '0')}
                        </span>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${getTypeStyles()}`}>
                            {getTypeIcon()}
                            {questionType}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            {q.marks} Points
                        </span>
                        <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Question Text */}
                <div className="mb-6 pl-12">
                    <h4 className="text-lg font-semibold text-gray-900 leading-relaxed tracking-tight group-hover:text-black transition-colors">
                        {q.questionText}
                    </h4>
                </div>

                {/* Content based on type */}
                <div className="pl-12">
                    <div className="bg-gray-50/50 rounded-2xl p-1.5 border border-gray-100/80">
                        {/* MCQ Options */}
                        {questionType?.toLowerCase() === 'mcq' && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-1">
                                {q.options.map((opt, idx) => {
                                    const isCorrect = idx === q.correctAnswer;
                                    return (
                                        <div
                                            key={idx}
                                            className={`relative flex items-center gap-3.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${isCorrect
                                                ? 'bg-gradient-to-r from-emerald-50 to-emerald-50/50 border-emerald-200/60 shadow-sm'
                                                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50/50'
                                                }`}
                                        >
                                            <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold border transition-colors ${isCorrect
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                                                : 'bg-gray-50 border-gray-200 text-gray-400'
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className={isCorrect ? 'text-emerald-900 font-semibold' : 'text-gray-600'}>{opt}</span>
                                            {isCorrect && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Coding Details */}
                        {questionType?.toLowerCase() === 'coding' && (
                            <div className="bg-[#1e1e1e] rounded-xl overflow-hidden shadow-xl shadow-black/5 ring-1 ring-gray-900/5 group/code">
                                <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#333]">
                                    <div className="flex items-center gap-2.5">
                                        <Terminal className="h-3.5 w-3.5 text-blue-400" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Test Bench</span>
                                    </div>
                                    <span className="text-[10px] font-bold font-mono text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20 shadow-[0_0_10px_-3px_rgba(168,85,247,0.2)]">
                                        {q.language || 'Multi-Language'}
                                    </span>
                                </div>

                                <div className="p-3 space-y-2.5">
                                    {q.testcases && q.testcases.length > 0 ? (
                                        q.testcases.slice(0, 3).map((tc, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row gap-2 text-xs font-mono bg-[#2d2d2d]/80 p-3 rounded-lg border border-[#333] hover:border-[#444] transition-colors group/case">
                                                <div className="flex-1 min-w-0 flex items-baseline gap-3">
                                                    <span className="text-gray-500 select-none text-[10px] uppercase font-bold w-6 text-right">In</span>
                                                    <span className="text-emerald-400/90 break-all font-medium">{tc.input}</span>
                                                </div>
                                                <div className="hidden sm:block text-gray-700 select-none">→</div>
                                                <div className="flex-1 min-w-0 flex items-baseline gap-3">
                                                    <span className="text-gray-500 select-none text-[10px] uppercase font-bold w-6 text-right">Out</span>
                                                    <span className="text-blue-400/90 break-all font-medium">{tc.output}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Cpu className="w-8 h-8 text-gray-700 mx-auto mb-2 opacity-50" />
                                            <p className="text-xs text-gray-500 italic">No public test cases configured</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Descriptive */}
                        {questionType?.toLowerCase() === 'descriptive' && (
                            <div className="py-8 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-dashed border-gray-200">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                                    <FileText className="h-6 w-6 text-emerald-500" />
                                </div>
                                <h5 className="text-sm font-bold text-gray-900">Descriptive Answer Area</h5>
                                <p className="text-xs text-gray-500 mt-1.5 max-w-xs leading-relaxed">
                                    A rich text editor will be provided for students to write comprehensive answers.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions overlay (visible on hover) */}
            <div className="absolute top-4 right-16 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/20">
                <button className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Edit Question">
                    <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors" title="Delete Question">
                    <Trash className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
