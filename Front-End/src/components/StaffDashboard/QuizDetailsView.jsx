import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Calendar,
    Shield,
    Clock,
    Copy,
    RefreshCw,
    Trash2,
    AlertCircle,
    Hash,
    Settings,
    Timer,
    Lock,
    Zap,
    BarChart3,
    Users,
    MoreVertical,
    Share2,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionDetailItem from './QuestionDetailItem';

export default function QuizDetailsView({
    selectedQuiz,
    otpTimers,
    onBack,
    onDelete,
    onCopyId,
    onGenerateOtp,
    formatTime
}) {
    const [isHeaderSticky, setIsHeaderSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsHeaderSticky(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const StatusBadge = ({ status }) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border shadow-sm transition-all ${status === 'active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-emerald-500/10'
            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
            <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );

    // Calculate stats
    const totalQuestions = selectedQuiz.questions?.length || 0;
    const totalMarks = selectedQuiz.questions?.reduce((acc, q) => acc + q.marks, 0) || 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] selection:bg-blue-100 selection:text-blue-900">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 opacity-60" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-100/40 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 opacity-60" />
            </div>

            {/* Sticky Header with Liquid Glass Effect */}
            <header className={`sticky top-0 z-[100] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isHeaderSticky
                ? 'bg-white/75 backdrop-blur-2xl border-b border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] py-3'
                : 'bg-transparent py-6'
                }`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <button
                                onClick={onBack}
                                className="group flex items-center justify-center p-2.5 rounded-xl bg-white border border-gray-200/80 shadow-sm hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 active:translate-y-0"
                            >
                                <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-gray-900" />
                            </button>

                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <h1 className={`font-bold text-gray-900 tracking-tight transition-all duration-300 ${isHeaderSticky ? 'text-xl' : 'text-3xl'}`}>
                                        {selectedQuiz.title}
                                    </h1>
                                    <AnimatePresence>
                                        {!isHeaderSticky && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="origin-left"
                                            >
                                                <StatusBadge status={selectedQuiz.status} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {!isHeaderSticky && (
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2.5 font-medium">
                                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/50 border border-gray-100/50">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {new Date(selectedQuiz.createdAt).toLocaleDateString(undefined, {
                                                month: 'long', day: 'numeric', year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <AnimatePresence>
                                {isHeaderSticky && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="mr-2 hidden sm:block"
                                    >
                                        <StatusBadge status={selectedQuiz.status} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className={`h-8 w-px bg-gray-200 mx-1 hidden sm:block ${isHeaderSticky ? 'mx-2' : ''}`} />

                            <button
                                onClick={() => onDelete(selectedQuiz.quizId)}
                                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-500 border border-rose-200 rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">DELETE QUIZ</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
                <motion.div
                    initial={{ opacity: 0.01 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-2"
                >
                    {/* Left Column: Content */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Summary Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center items-center text-center group hover:border-blue-200 transition-colors">
                                <div className="mb-2 p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <Hash className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900 tracking-tight">{totalQuestions}</span>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">Questions</span>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center items-center text-center group hover:border-emerald-200 transition-colors">
                                <div className="mb-2 p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900 tracking-tight">{totalMarks}</span>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">Total Marks</span>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center items-center text-center group hover:border-purple-200 transition-colors sm:col-span-1 col-span-2">
                                <div className="mb-2 p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900 tracking-tight">0</span>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">Participants</span>
                            </div>
                        </div>

                        {/* Questions Header */}
                        <div className="flex items-center justify-between pb-2">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                    Questions Configuration
                                </h3>
                            </div>
                            {/* <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                Expand All
                            </button> */}
                        </div>

                        {/* Questions List */}
                        <div className="space-y-4">
                            {selectedQuiz.questions && selectedQuiz.questions.length > 0 ? (
                                selectedQuiz.questions.map((q, i) => (
                                    <QuestionDetailItem key={i} q={q} index={i} />
                                ))
                            ) : (
                                <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center shadow-sm hover:border-gray-400 transition-colors">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 mb-4 ring-1 ring-gray-100">
                                        <AlertCircle className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900">No questions added yet</h4>
                                    <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
                                        This quiz is currently empty. Start adding questions to build your assessment from the creation menu.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Control Widget (Sticky) */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-28 space-y-6">

                            {/* Live Control Card */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[28px] blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                                <div className="bg-[#0f172a] rounded-[24px] p-1 shadow-2xl shadow-blue-900/20 relative overflow-hidden ring-1 ring-white/10">

                                    {/* Abstract Background Shapes */}
                                    <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                                        <div className="w-40 h-40 bg-blue-500 rounded-full blur-[80px]" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 p-8 opacity-10 pointer-events-none">
                                        <div className="w-32 h-32 bg-indigo-500 rounded-full blur-[60px]" />
                                    </div>

                                    <div className="relative z-10 bg-gray-900/50 backdrop-blur-sm rounded-[20px] p-6 border border-white/5">
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                                </span>
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/90 text-shadow-sm">Live Session</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                                <Shield className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>

                                        <div className="mb-6 text-center space-y-3">
                                            <div>
                                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Access Code (OTP)</p>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {selectedQuiz.otp ? (
                                                        selectedQuiz.otp.split('').map((char, i) => (
                                                            <div key={i} className="group/char relative">
                                                                <div className="w-[38px] h-[52px] flex items-center justify-center bg-gray-800/80 rounded-lg text-2xl font-mono font-bold text-white border border-gray-700/50 shadow-lg shadow-black/20 group-hover/char:border-gray-600 group-hover/char:translate-y-[-2px] transition-all duration-300">
                                                                    {char}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-3xl font-mono font-bold text-gray-700 tracking-[0.8em] opacity-40">••••••</span>
                                                    )}
                                                </div>
                                            </div>

                                            {selectedQuiz.otp ? (
                                                otpTimers[selectedQuiz.quizId] > 0 ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold shadow-sm shadow-amber-900/20">
                                                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                                                        <span>Expires in {formatTime(otpTimers[selectedQuiz.quizId])}</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold shadow-sm shadow-rose-900/20">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        <span>OTP Code Expired</span>
                                                    </div>
                                                )
                                            ) : null}
                                        </div>

                                        <button
                                            onClick={() => onGenerateOtp(selectedQuiz.quizId)}
                                            className="group relative w-full overflow-hidden rounded-xl bg-white text-gray-900 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all active:scale-[0.98] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.4)]"
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-2 py-3.5 px-4 font-bold">
                                                <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${!selectedQuiz.otp ? 'group-hover:rotate-180' : ''}`} />
                                                <span>{selectedQuiz.otp ? 'Regenerate Code' : 'Generate Access Code'}</span>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Control Center Grid */}
                            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-300">
                                <div className="grid grid-cols-1 gap-6">

                                    {/* Quiz ID Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Hash className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-widest">Quiz ID</span>
                                            </div>
                                            <button
                                                onClick={() => onCopyId(selectedQuiz.quizId)}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                                COPY
                                            </button>
                                        </div>
                                        <div className="font-mono text-xl font-bold text-gray-900 tracking-tight bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-300 text-center select-all hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 cursor-text shadow-sm">
                                            {selectedQuiz.quizId}
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100" />

                                    {/* Settings Section */}
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                            <Settings className="w-3.5 h-3.5" />
                                            Configuration
                                        </h4>

                                        <div className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer ring-1 ring-transparent hover:ring-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                    <Timer className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-900">Duration</div>
                                                    <div className="text-[10px] text-gray-500 font-medium">Auto-submit timer</div>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-100 shadow-sm">
                                                {selectedQuiz.durationInMinutes >= 60
                                                    ? `${selectedQuiz.durationInMinutes / 60}h`
                                                    : `${selectedQuiz.durationInMinutes || 60}m`}
                                            </span>
                                        </div>

                                        {selectedQuiz.endsAt && (
                                            <div className="group flex items-center justify-between p-2.5 rounded-xl bg-red-50 ring-1 ring-red-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                                        <Lock className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold text-red-700">Exam Closes At</div>
                                                        <div className="text-[10px] text-red-400 font-medium">No new joins after this</div>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-100 shadow-sm text-right leading-tight">
                                                    {new Date(selectedQuiz.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <br />
                                                    <span className="text-[9px] text-red-400 font-medium">
                                                        {new Date(selectedQuiz.endsAt).toLocaleDateString()}
                                                    </span>
                                                </span>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </main>
        </div >
    );
}
