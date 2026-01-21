import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useAuth } from "../context/AuthContext";
import { Plus, Users, BookOpen, BarChart3, LogOut, Clock, Target, TrendingUp, Home, ArrowLeft, AlertCircle, Check, X, Loader2, Save, Code, FileText, CheckSquare, Sparkles } from "lucide-react";
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from "../../Api";
import LOGO from "../assets/LOGO.png";

// --- Icons ---
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>);
const TrashIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${props.className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>);
const QuestionCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>);
const CopyIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-2 cursor-pointer hover:text-pink-400" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>);
const CheckCircle2 = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-green-500 flex-shrink-0"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>);
const XCircle = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-red-500 flex-shrink-0"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="h-4 w-4" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V12h2.293l6.5-6.5z" /></svg>);
const DuplicateIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="h-4 w-4" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" /><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM-1 7a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1A.5.5 0 0 1-1 7z" /></svg>);
const ResetIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0121.5 12M20 20l-1.5-1.5A9 9 0 002.5 12" /></svg>);
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>);
const LogoutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>);
const CollectionIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00E1F9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>);
const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00E1F9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
const NewChartBarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00E1F9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
const TrendingUpIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00E1F9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>);
const ClockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>);
const CalendarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>);
const TargetIcon = () => (<Target className="h-4 w-4 text-purple-400" />);

function Toast({ message, type }) {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className={`fixed top-20 right-5 px-4 py-2 rounded-xl shadow-lg text-sm font-medium transition-opacity duration-300 z-[100] ${visible ? 'opacity-100' : 'opacity-0'} ${type === "success" ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"}`}>
            {message}
        </div>
    );
}

const CircularStat = ({ label, textValue, percentageValue, color }) => {
    return (
        <div className="flex flex-col items-center space-y-3">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3">
                <CircularProgressbar
                    value={percentageValue}
                    text={`${textValue}`}
                    styles={buildStyles({
                        textSize: '18px',
                        pathColor: color,
                        textColor: 'white',
                        trailColor: '#4b5563',
                        pathTransitionDuration: 0.5
                    })}
                />
            </div>
            <div className="text-sm font-semibold text-gray-300 text-center">{label}</div>
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon, iconBgColor }) => {
    return (
        <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#2A2A2A] flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-400 font-medium">{title}</p>
                <p className="text-3xl font-bold text-[#00E1F9] mt-2">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>
            <div className={`p-3 rounded-full ${iconBgColor}`}>
                {icon}
            </div>
        </div>
    );
};

// --- Helper Component to Render Individual Questions in the Dashboard ---
const QuestionDetailItem = ({ q, index }) => {
    const [activeLang, setActiveLang] = useState('javascript');
    const languages = ["javascript", "python", "java", "cpp"];

    return (
        <li className="p-4 rounded-xl bg-[#0A0A0A] border border-[#2A2A2A] shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-white flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">Q{index + 1}.</span>
                    {q.questionType === "mcq" && <CheckSquare className="h-4 w-4 text-emerald-400" />}
                    {q.questionType === "coding" && <Code className="h-4 w-4 text-purple-400" />}
                    {q.questionType === "descriptive" && <FileText className="h-4 w-4 text-blue-400" />}
                    {q.questionText}
                </p>
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700 uppercase">
                    {q.questionType} • {q.marks} Marks
                </span>
            </div>

            {/* MCQ Options */}
            {q.questionType === 'mcq' && (
                <ul className="list-disc list-inside text-gray-300 ml-4 space-y-2 text-sm">
                    {q.options?.map((opt, idx) => (
                        <li key={idx} className={`${q.correctAnswer == idx ? "text-emerald-400 font-semibold" : "text-gray-400"} flex justify-between items-center`}>
                            <span>{opt}</span>
                            {q.correctAnswer == idx && <span className="text-[10px] font-bold text-black bg-emerald-400 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">Correct</span>}
                        </li>
                    ))}
                </ul>
            )}

            {/* Descriptive Answer */}
            {q.questionType === 'descriptive' && (
                <div className="mt-2 bg-[#111] p-3 rounded border border-[#333]">
                    <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Reference Answer:</p>
                    <p className="text-sm text-gray-300">{q.descriptiveAnswer || "No reference answer provided."}</p>
                </div>
            )}

            {/* Coding Question - Multi-Language Starter Code */}
            {q.questionType === 'coding' && (
                <div className="mt-3">
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                        {languages.map(lang => (
                            <button
                                key={lang}
                                onClick={() => setActiveLang(lang)}
                                className={`px-2 py-1 text-[10px] uppercase rounded border transition-colors ${activeLang === lang ? "bg-purple-600 border-purple-400 text-white" : "bg-gray-800 border-gray-600 text-gray-400"}`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                    <div className="bg-[#111] p-3 rounded border border-[#333]">
                        <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Starter Code ({activeLang}):</p>
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
                            {/* Handle object safely */}
                            {q.starterCode && typeof q.starterCode === 'object'
                                ? q.starterCode[activeLang] || "// No starter code"
                                : q.starterCode || "// No starter code"}
                        </pre>
                    </div>
                    <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Test Cases:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.testcases?.slice(0, 2).map((tc, i) => (
                                <div key={i} className="bg-[#111] p-2 rounded border border-[#333] text-xs">
                                    <span className="text-gray-400">In:</span> <span className="text-gray-200">{tc.input}</span> <br />
                                    <span className="text-gray-400">Out:</span> <span className="text-gray-200">{tc.output}</span>
                                </div>
                            ))}
                            {q.testcases?.length > 2 && <p className="text-xs text-gray-600 italic">+ {q.testcases.length - 2} more tests</p>}
                        </div>
                    </div>
                </div>
            )}
        </li>
    );
};

const QuestionPalette = ({ responses }) => (
    <div className="w-full p-4 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Question Palette</h3>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {responses.map((res, index) => {
                let bgColor = 'bg-red-500 hover:bg-red-400';
                if (res.questionType?.toLowerCase() === 'descriptive') {
                    bgColor = 'bg-amber-500 hover:bg-amber-400';
                } else if (res.isCorrect) {
                    bgColor = 'bg-green-500 hover:bg-green-400';
                } else if (res.questionType?.toLowerCase() === 'coding') {
                    const passed = res.testcases?.filter(tc => tc.passed).length || 0;
                    if (passed > 0) bgColor = passed === res.testcases?.length ? 'bg-green-500' : 'bg-yellow-500';
                }

                return (
                    <a
                        key={index}
                        href={`#q-${index + 1}`}
                        className={`flex items-center justify-center h-8 w-8 rounded font-bold text-sm text-black transition-all hover:scale-110 ${bgColor}`}
                    >
                        {index + 1}
                    </a>
                );
            })}
        </div>
    </div>
);

const QuestionCard = ({ response, index, onUpdateMarks }) => {
    const { questionText, options, studentAnswer, correctAnswer, isCorrect, questionType, marks, obtainedMarks } = response;
    const [manualMarks, setManualMarks] = useState(obtainedMarks || 0);

    // Sync state when response changes
    useEffect(() => {
        setManualMarks(obtainedMarks || 0);
    }, [obtainedMarks]);

    return (
        <motion.div
            id={`q-${index + 1}`}
            className="p-5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg mb-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                    <p className="text-lg font-medium text-gray-200">
                        <span className="text-blue-400 font-bold mr-2">Q{index + 1}.</span> {questionText}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-800 text-gray-400 rounded uppercase border border-gray-700">
                            {questionType}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-800 text-gray-400 rounded border border-gray-700">
                            Marks: {response.obtainedMarks || 0} / {response.marks || 0}
                        </span>
                    </div>
                </div>
                {questionType?.toLowerCase() === 'descriptive' ? (
                    <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                ) : isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                ) : (
                    <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                )}
            </div>

            {questionType === 'mcq' && (
                <div className="space-y-3 mt-3">
                    {options?.map((option, optIndex) => {
                        const isSelectedAnswer = option === studentAnswer;
                        const isCorrectAnswer = option === correctAnswer;

                        let stateClass = "border-[#4A4A4A] bg-[#1A1A1A] text-gray-300";
                        if (isCorrectAnswer) {
                            stateClass = "border-green-600 bg-green-900/40 text-green-300 font-semibold";
                        } else if (isSelectedAnswer && !isCorrectAnswer) {
                            stateClass = "border-red-600 bg-red-900/40 text-red-300 font-semibold";
                        }

                        return (
                            <div key={optIndex} className={`p-3 border rounded-lg flex items-center justify-between transition-all duration-300 ${stateClass}`}>
                                <span>{option}</span>
                                {isSelectedAnswer && (
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-600 text-gray-200">
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
                    <div className="bg-[#111] p-3 rounded border border-[#333]">
                        <p className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider">Submitted Code:</p>
                        <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap">{response.codeSubmitted || "// No code submitted"}</pre>
                    </div>
                    {response.testcases && response.testcases.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {response.testcases.map((tc, idx) => (
                                <div key={idx} className={`p-2 rounded border text-xs ${tc.passed ? 'border-green-900/30 bg-green-900/10' : 'border-red-900/30 bg-red-900/10'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold uppercase text-gray-500">Test {idx + 1}</span>
                                        {tc.passed ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500" />}
                                    </div>
                                    <p className="truncate"><span className="text-gray-600">In:</span> {tc.input}</p>
                                    <p className="truncate"><span className="text-gray-600">Out:</span> {tc.output || 'No output'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {questionType?.toLowerCase() === 'descriptive' && (
                <div className="mt-4 space-y-4">
                    <div className="bg-[#111] p-4 rounded border border-[#333]">
                        <p className="text-xs text-gray-500 mb-2 uppercase font-bold tracking-wider underline">Student Answer:</p>
                        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{studentAnswer || "No answer provided"}</div>
                    </div>

                    {response.isEvaluated && !response.isEditingManual ? (
                        <div className="flex items-center justify-between bg-green-900/10 border border-green-900/30 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-full">
                                    <CheckCircle2 size={18} className="text-green-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Evaluation Complete</p>
                                    <p className="text-sm text-gray-200">The student was awarded <span className="font-bold text-green-400">{obtainedMarks} / {marks}</span> marks.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onUpdateMarks(index, manualMarks, true)} // Custom flag to set editing mode
                                className="text-[10px] font-bold uppercase text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <EditIcon size={12} /> Edit Grade
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#1A1A1A] p-4 rounded-lg border border-amber-900/20 shadow-inner">
                            <div className="flex-1">
                                <label className="text-[10px] text-amber-500 font-bold uppercase block mb-1">Manual Rating</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        max={marks}
                                        min="0"
                                        value={manualMarks}
                                        onChange={(e) => setManualMarks(e.target.value)}
                                        className="bg-black border border-gray-700 rounded px-2 py-1 w-16 text-white font-mono text-sm focus:border-amber-500 outline-none"
                                    />
                                    <span className="text-gray-500 text-sm">/ {marks} Marks</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onUpdateMarks(index, manualMarks, false)}
                                className="w-full sm:w-auto flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded text-xs font-bold transition-all active:scale-95 shadow-lg group"
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
};

export default function TeacherDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [otpTimers, setOtpTimers] = useState({});
    const [toast, setToast] = useState(null);
    const [stats, setStats] = useState({ totalAttempts: '...' });
    const [viewingResultsOf, setViewingResultsOf] = useState(null);
    const [resultsData, setResultsData] = useState([]);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [selectedResultDetail, setSelectedResultDetail] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchQuizzes();
        fetchStats();
    }, []);

    useEffect(() => {
        if (user) {
            fetchTeacherInfo();
        }
    }, [user]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const updatedTimers = {};
            if (Array.isArray(quizzes)) {
                quizzes.forEach((quiz) => {
                    if (quiz && quiz.otpExpiresAt) {
                        const diff = new Date(quiz.otpExpiresAt).getTime() - now;
                        updatedTimers[quiz.quizId] = diff > 0 ? diff : 0;
                    }
                });
            }
            setOtpTimers(updatedTimers);
        }, 1000);
        return () => clearInterval(interval);
    }, [quizzes]);


    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    const closeToast = () => {
        setToast(null);
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        showToast("Logged out.");
        setTimeout(() => navigate("/login"), 1000);
    };

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await API.get("/api/quizzes", { headers: { Authorization: `Bearer ${token}` } });
            setQuizzes(Array.isArray(res.data) ? res.data : []);
        } catch {
            setQuizzes([]);
            showToast("Failed to fetch quizzes", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await API.get("/api/results/teacher-stats", { headers: { Authorization: `Bearer ${token}` } });
            setStats(res.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setStats({ totalAttempts: 0, averageScore: '0%', successRate: '0%', quizStats: {} });
        }
    }

    const fetchTeacherInfo = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await API.get("/teachers/details", { headers: { Authorization: `Bearer ${token}` } });
            setTeacherInfo(res.data[0]);
        } catch {
            setTeacherInfo(null);
            showToast("Failed to load teacher info", "error");
        }
    };

    const handleQuizClick = async (quizId) => {
        setQuizLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await API.get(`/api/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
            setSelectedQuiz(res.data);
        } catch {
            setSelectedQuiz(null);
            showToast("Failed to load quiz details", "error");
        } finally {
            setQuizLoading(false);
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await API.delete(`/api/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
            setSelectedQuiz(null);
            fetchQuizzes();
            showToast("Quiz deleted successfully");
        } catch {
            showToast("Failed to delete quiz", "error");
        }
    };

    const handleEdit = (quizId) => {
        navigate(`/edit-quiz/${quizId}`);
    };

    const handleDuplicate = async (quizId) => {
        try {
            const token = localStorage.getItem("token");
            await API.post(`/api/quizzes/${quizId}/duplicate`, {}, { headers: { Authorization: `Bearer ${token}` } });
            showToast("Quiz duplicated successfully!");
            fetchQuizzes();
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to duplicate quiz", "error");
        }
    };

    const handleViewResults = async (quiz) => {
        setResultsLoading(true);
        setViewingResultsOf(quiz);
        setSelectedResultDetail(null);
        setResultsData([]);
        try {
            const token = localStorage.getItem("token");
            const res = await API.get(`/api/results/quiz/${quiz.quizId}`, { headers: { Authorization: `Bearer ${token}` } });
            setResultsData(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            showToast("Failed to fetch quiz results", "error");
            setResultsData([]);
        } finally {
            setResultsLoading(false);
        }
    };

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        showToast("Quiz Code copied: " + id);
    };

    const handleGenerateOtp = async (quizId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await API.post(`/api/quizzes/${quizId}/generate-otp`, {}, { headers: { Authorization: `Bearer ${token}` } });
            const newOtp = res.data.otp;
            showToast("New Security Code generated: " + newOtp);
            const newOtpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

            setQuizzes((currentQuizzes) =>
                currentQuizzes.map((quiz) => {
                    if (quiz.quizId === quizId) {
                        return { ...quiz, otp: newOtp, otpExpiresAt: newOtpExpiry };
                    }
                    return quiz;
                })
            );

            if (selectedQuiz && selectedQuiz.quizId === quizId) {
                setSelectedQuiz((currentQuiz) => ({ ...currentQuiz, otp: newOtp, otpExpiresAt: newOtpExpiry }));
            }
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to generate OTP", "error");
        }
    };


    const handleUpdateMarks = async (responseIndex, newMarks, isEditingToggle = false) => {
        if (!selectedResultDetail) return;

        if (isEditingToggle) {
            setSelectedResultDetail(prev => ({
                ...prev,
                responses: prev.responses.map((r, i) =>
                    i === responseIndex ? { ...r, isEditingManual: true } : r
                )
            }));
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await API.post(`/api/results/${selectedResultDetail._id}/update-marks`, {
                responseIndex,
                marks: Number(newMarks)
            }, { headers: { Authorization: `Bearer ${token}` } });

            showToast("Marks updated successfully!");
            setSelectedResultDetail(res.data);

            // Refresh results list
            const quizId = viewingResultsOf.quizId;
            const resultsRes = await API.get(`/api/results/quiz/${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
            setResultsData(Array.isArray(resultsRes.data) ? resultsRes.data : []);
        } catch (error) {
            showToast(error.name === 'AxiosError' ? (error.response?.data?.message || "Server error") : "Failed to update marks", "error");
        }
    };

    const handleResetAttempt = async (resultId) => {
        if (!window.confirm("Are you sure you want to reset the attempt for this student?")) return;

        try {
            const token = localStorage.getItem("token");
            if (!resultId) {
                showToast("Invalid result ID", "error");
                return;
            }

            const response = await API.delete(`/api/results/results/${resultId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            showToast(response.data.message || "Attempt reset successfully!");

            if (viewingResultsOf) handleViewResults(viewingResultsOf);
        } catch (error) {
            console.error("Error resetting attempt:", error);
            showToast(error.response?.data?.message || "Error resetting attempt", "error");
        }
    };

    const formatTime = (ms) => {
        if (typeof ms !== 'number' || ms <= 0) return "Expired";
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    };


    const filteredQuizzes = useMemo(() => {
        if (!Array.isArray(quizzes)) return [];
        return quizzes
            .filter(quiz => quiz && (statusFilter === 'all' || quiz.status === statusFilter))
            .filter(quiz => quiz && quiz.title && quiz.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [quizzes, searchTerm, statusFilter]);


    const renderContent = () => {
        if (quizLoading) {
            return <div className="mt-20 flex justify-center items-center h-64"><p className="text-gray-400 text-lg">Loading Quiz Details...</p></div>;
        }

        if (selectedQuiz) {
            return (
                <div className="mt-20">

                    <div className="flex flex-col gap-4 md:hidden mb-6 px-2">
                        <div className="flex justify-between items-center">
                            <button onClick={() => setSelectedQuiz(null)} className="flex items-center gap-2 text-sm text-[#00E1F9] hover:text-[#00B0CC] transition">
                                <ArrowLeft className="h-4 w-4" /> Back to Quizzes
                            </button>
                            <button onClick={() => handleDeleteQuiz(selectedQuiz.quizId)} className="flex items-center gap-1 bg-red-600 p-2 rounded-lg text-white hover:bg-red-500 transition shadow-md">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold text-white text-center flex items-center gap-3 justify-center">
                            <BookOpen className="h-7 w-7 text-blue-400" />
                            {selectedQuiz.title}
                        </h2>
                    </div>

                    <div className="hidden md:flex justify-between items-center mb-6 px-1">
                        <button onClick={() => setSelectedQuiz(null)} className="flex items-center gap-2 text-sm text-[#00E1F9] hover:text-[#00B0CC] transition">
                            <ArrowLeft className="h-4 w-4" /> Back to Quizzes
                        </button>
                        <h2 className="text-2xl md:text-3xl font-bold text-white text-center flex items-center gap-3">
                            <BookOpen className="h-7 w-7 text-blue-400" />
                            {selectedQuiz.title}
                        </h2>
                        <div className="flex items-center gap-2 md:gap-4">
                            <button onClick={() => handleDeleteQuiz(selectedQuiz.quizId)} className="flex items-center gap-1 md:gap-2 bg-red-600 px-3 py-2 md:px-5 md:py-2 rounded-lg text-white hover:bg-red-500 transition shadow-md text-xs md:text-sm">
                                <TrashIcon className="h-5 w-5" /> <span className="hidden md:inline">Delete</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-lg mb-6 shadow-md">
                        <h3 className="text-xl font-semibold text-white mb-5">Quiz Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-4 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">Quiz Code</p>
                                <div className="flex items-center">
                                    <span className="font-mono text-lg font-semibold text-gray-200">{selectedQuiz.quizId}</span>
                                    <CopyIcon onClick={() => handleCopyId(selectedQuiz.quizId)} />
                                </div>
                            </div>
                            <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-4 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">Status</p>
                                <p className={`text-lg font-semibold ${selectedQuiz.status === "active" ? "text-green-400" : "text-red-400"}`}>
                                    {selectedQuiz.status.charAt(0).toUpperCase() + selectedQuiz.status.slice(1)}
                                </p>
                            </div>
                            <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-4 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">Created On</p>
                                <p className="text-lg font-semibold text-gray-200">{new Date(selectedQuiz.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-[#0A0A0A] border border-[#2A2A2A] p-4 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">Security Code (OTP)</p>
                                {selectedQuiz.otp ? (
                                    <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between md:gap-2">
                                        <div>
                                            <span className="font-mono text-lg font-semibold text-amber-400">{selectedQuiz.otp}</span>
                                            <span className="text-sm text-gray-500 ml-2">({formatTime(otpTimers[selectedQuiz.quizId])})</span>
                                        </div>
                                        <button
                                            className="px-3 py-1 bg-[#00E1F9] rounded text-black text-xs hover:bg-[#00B0CC] transition flex-shrink-0"
                                            onClick={() => handleGenerateOtp(selectedQuiz.quizId)}>
                                            New Code
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="px-3 py-1 bg-[#00E1F9] rounded text-black text-sm hover:bg-[#00B0CC] transition"
                                        onClick={() => handleGenerateOtp(selectedQuiz.quizId)}>
                                        Generate Code
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-white mb-5">Questions ({selectedQuiz.questions?.length || 0})</h3>
                        <ul className="space-y-5">
                            {selectedQuiz.questions && selectedQuiz.questions.length > 0 ? (
                                selectedQuiz.questions.map((q, i) => (
                                    <QuestionDetailItem key={i} q={q} index={i} />
                                ))
                            ) : (
                                <p className="text-gray-500 text-center">No questions found for this quiz.</p>
                            )}
                        </ul>
                    </div>
                </div>
            );
        }

        if (selectedResultDetail) {
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

            const scorePercentage = totalPossibleMarks > 0 ? (scoreValue / totalPossibleMarks) * 100 : 0;
            const accuracyPercentage = accuracyValue;
            const attemptedPercentage = (selectedResultDetail.responses?.length || 1) > 0 ? (attemptedCount / (selectedResultDetail.responses?.length || 1)) * 100 : 0;
            const incorrectPercentage = (selectedResultDetail.responses?.length || 1) > 0 ? (incorrectValue / (selectedResultDetail.responses?.length || 1)) * 100 : 0;

            return (
                <div className="mt-20">
                    <button onClick={() => setSelectedResultDetail(null)} className="flex items-center gap-2 text-sm text-[#00E1F9] hover:text-[#00B0CC] transition mb-6">
                        <ArrowLeft className="h-4 w-4" /> Back to Results List for "{viewingResultsOf?.title}"
                    </button>
                    <div className="flex flex-col md:flex-row gap-4 lg:gap-8">
                        <aside className="w-full md:w-1/4 lg:w-1/5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 md:sticky top-24 self-start h-full md:max-h-[calc(100vh-8rem)] md:overflow-y-auto scrollbar-thin scrollbar-thumb-[#3A3A3A] scrollbar-track-[#1A1A1A]">
                            <h3 className="text-xl font-bold text-white mb-6 text-center">
                                Performance Summary
                            </h3>
                            <div className="flex flex-col items-center gap-4">
                                <CircularStat
                                    label="Score"
                                    textValue={`${scoreValue}/${totalPossibleMarks}`}
                                    percentageValue={scorePercentage}
                                    color="#f59e0b"
                                />
                                <CircularStat
                                    label="Accuracy"
                                    textValue={`${accuracyValue}%`}
                                    percentageValue={accuracyPercentage}
                                    color="#10b981"
                                />
                                <CircularStat
                                    label="Attempted"
                                    textValue={`${attemptedCount}/${selectedResultDetail.responses?.length || 0}`}
                                    percentageValue={attemptedPercentage}
                                    color="#8b5cf6"
                                />
                                <CircularStat
                                    label="Incorrect"
                                    textValue={`${incorrectValue}`}
                                    percentageValue={incorrectPercentage}
                                    color="#ef4444"
                                />
                            </div>
                        </aside>

                        <main className="w-full md:flex-1 min-w-0 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto scrollbar-thin scrollbar-thumb-[#3A3A3A] scrollbar-track-[#1A1A1A]">
                            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 mb-6">
                                <h2 className="text-2xl font-bold text-gray-200 mb-1">{viewingResultsOf?.title}</h2>
                                <p className="text-gray-400 mb-4">Results for <span className="font-semibold text-blue-300">{selectedResultDetail.user?.name || 'Student'}</span> ({selectedResultDetail.user?.email})</p>
                                <p className="text-sm text-gray-500">Submitted on: {submittedAt}</p>
                            </div>

                            <QuestionPalette responses={selectedResultDetail.responses || []} />

                            {selectedResultDetail.violations && selectedResultDetail.violations.length > 0 && (
                                <div className="bg-[#1a0a0a] border border-red-900/30 rounded-lg p-5 mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Proctoring Log</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedResultDetail.violations.map((v, i) => (
                                            <div key={i} className="flex items-start gap-4 p-3 bg-black/40 border border-red-900/10 rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{v.type || "Violation"}</span>
                                                        <span className="text-[10px] text-gray-600 font-mono">
                                                            {new Date(v.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-300">{v.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h2 className="text-xl font-semibold text-white mb-4 mt-6">Question Review</h2>
                            <div className="w-full">
                                {selectedResultDetail.responses?.map((res, index) => (
                                    <QuestionCard key={index} response={res} index={index} onUpdateMarks={handleUpdateMarks} />
                                ))}
                                {(!selectedResultDetail.responses || selectedResultDetail.responses.length === 0) && (
                                    <p className="text-gray-500 text-center py-10">No response details available for this submission.</p>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            );
        }


        if (viewingResultsOf) {
            const quizTitle = viewingResultsOf.title;
            const totalSubmissions = resultsData.length;
            const averageScore = totalSubmissions > 0 ? (resultsData.reduce((acc, r) => acc + (r.score ?? 0), 0) / totalSubmissions).toFixed(2) : 0;
            const highestScore = totalSubmissions > 0 ? Math.max(...resultsData.map(r => r.score ?? 0)) : 0;
            const lowestScore = totalSubmissions > 0 ? Math.min(...resultsData.map(r => r.score ?? 0)) : 0;

            return (
                <div className="mt-10">

                    <div className="flex md:hidden items-center mb-6 px-2 gap-2">
                        <button
                            onClick={() => setViewingResultsOf(null)}
                            className="flex items-center text-sm text-[#00E1F9] hover:text-[#00B0CC] transition p-2 rounded-lg hover:bg-[#00E1F9]/10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-bold text-white text-left flex-1">
                            Results for "{quizTitle}"
                        </h1>
                    </div>

                    <div className="hidden md:flex justify-between items-center mb-6 px-1">
                        <button
                            onClick={() => setViewingResultsOf(null)}
                            className="flex items-center gap-2 text-sm text-[#00E1F9] hover:text-[#00B0CC] transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Quizzes</span>
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-white text-center flex-1">
                            Results for "{quizTitle}"
                        </h1>
                        <div className="w-16"></div>
                    </div>

                    {resultsLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <p className="text-gray-400 text-lg">Loading results...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 text-center px-2 md:px-0">
                                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A]">
                                    <p className="text-gray-300 text-sm">Submissions</p>
                                    <p className="text-2xl font-bold text-white">{totalSubmissions}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A]">
                                    <p className="text-gray-300 text-sm">Average Score</p>
                                    <p className="text-2xl font-bold text-emerald-400">{averageScore}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A]">
                                    <p className="text-gray-300 text-sm">Highest Score</p>
                                    <p className="text-2xl font-bold text-amber-400">{highestScore}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A]">
                                    <p className="text-gray-300 text-sm">Lowest Score</p>
                                    <p className="text-2xl font-bold text-red-400">{lowestScore}</p>
                                </div>
                            </div>

                            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl">
                                <div className="p-4 md:p-6 border-b border-[#2A2A2A]">
                                    <h2 className="text-xl font-semibold text-white">Student Submissions</h2>
                                </div>

                                {totalSubmissions === 0 ? (
                                    <p className="text-gray-400 text-center py-10">No students have submitted this quiz yet.</p>
                                ) : (
                                    <div>
                                        <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-[#3A3A3A] scrollbar-track-[#1A1A1A]">
                                            <table className="w-full text-left min-w-[700px]">
                                                <thead>
                                                    <tr className="border-b border-[#2A2A2A]">
                                                        <th className="p-3 text-gray-300 font-semibold text-sm">Student Name</th>
                                                        <th className="p-3 text-gray-300 font-semibold text-sm">Email</th>
                                                        <th className="p-3 text-gray-300 font-semibold text-sm">Score</th>
                                                        <th className="p-3 text-gray-300 font-semibold text-sm">Accuracy</th>
                                                        <th className="p-3 text-gray-300 font-semibold text-sm text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {resultsData.map(result => (
                                                        <tr key={result._id} className="border-b border-[#2A2A2A]/50 hover:bg-[#2A2A2A]/50 text-gray-200 text-sm">
                                                            <td className="p-3 whitespace-nowrap">{result.user?.name || 'N/A'}</td>
                                                            <td className="p-3 whitespace-nowrap">{result.user?.email || 'N/A'}</td>
                                                            <td className="p-3 font-semibold text-emerald-400 whitespace-nowrap">
                                                                {result.score ?? 0} / {result.responses?.reduce((acc, r) => acc + (r.marks || 0), 0) || result.totalQuestions || 0}
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap">{(result.accuracy ?? 0).toFixed(2)}%</td>
                                                            <td className="p-3 text-right space-x-2 whitespace-nowrap">
                                                                <button
                                                                    onClick={() => setSelectedResultDetail(result)}
                                                                    className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 rounded-lg transition text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    disabled={!result.responses || result.responses.length === 0}
                                                                    title={(!result.responses || result.responses.length === 0) ? "No details available" : "View Details"}
                                                                >
                                                                    View Details
                                                                </button>
                                                                <button
                                                                    onClick={() => handleResetAttempt(result._id)}
                                                                    className="px-3 py-1 text-xs bg-amber-600 hover:bg-amber-500 rounded-lg transition inline-flex items-center gap-1 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Reset Attempt"
                                                                    disabled={!result._id}
                                                                >
                                                                    <ResetIcon /> Reset
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="block md:hidden p-4 space-y-4">
                                            {resultsData.map(result => (
                                                <div key={result._id} className="bg-[#0A0A0A] p-4 rounded-lg border border-[#2A2A2A]">
                                                    <p className="font-semibold text-white">{result.user?.name || 'N/A'}</p>
                                                    <p className="text-sm text-gray-400 mb-2">{result.user?.email || 'N/A'}</p>
                                                    <div className="flex flex-col sm:flex-row sm:justify-between text-sm mb-3 gap-1 sm:gap-0">
                                                        <span className="text-gray-300">Score: <span className="font-semibold text-emerald-400">
                                                            {result.score ?? 0} / {result.responses?.reduce((acc, r) => acc + (r.marks || 0), 0) || result.totalQuestions || 0}
                                                        </span></span>
                                                        <span className="text-gray-300">Accuracy: <span className="font-semibold text-white">{(result.accuracy ?? 0).toFixed(2)}%</span></span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setSelectedResultDetail(result)}
                                                            className="px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 rounded-lg transition text-white disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                                                            disabled={!result.responses || result.responses.length === 0}
                                                            title={(!result.responses || result.responses.length === 0) ? "No details available" : "View Details"}
                                                        >
                                                            View Details
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetAttempt(result._id)}
                                                            className="px-3 py-2 text-xs bg-amber-600 hover:bg-amber-500 rounded-lg transition inline-flex items-center gap-1 text-white disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                                                            title="Reset Attempt"
                                                            disabled={!result._id}
                                                        >
                                                            <ResetIcon /> Reset
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            );
        }

        return (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-20">
                    <StatCard
                        title="Total Quizzes"
                        value={loading ? '...' : quizzes.length}
                        subtitle={`${Array.isArray(quizzes) ? quizzes.filter(q => q?.status === 'active').length : 0} active`}
                        icon={<CollectionIcon />}
                        iconBgColor="bg-[#00333A]"
                    />
                    <StatCard
                        title="Total Attempts"
                        value={stats.totalAttempts}
                        subtitle="Across all quizzes"
                        icon={<UsersIcon />}
                        iconBgColor="bg-[#00333A]"
                    />
                    <StatCard
                        title="Average Score"
                        value={stats.averageScore || '0%'}
                        subtitle="Student performance"
                        icon={<NewChartBarIcon />}
                        iconBgColor="bg-[#00333A]"
                    />
                    <StatCard
                        title="Success Rate"
                        value={stats.successRate || '0%'}
                        subtitle="Passing attempts"
                        icon={<TrendingUpIcon />}
                        iconBgColor="bg-[#00333A]"
                    />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex border-b border-[#2A2A2A] self-start">
                        <button className="px-4 py-3 text-sm font-medium text-[#00E1F9] border-b-2 border-[#00E1F9] whitespace-nowrap">
                            My Quizzes
                        </button>
                        <button className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-gray-200 whitespace-nowrap">
                            Analytics
                        </button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <button
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-lg font-medium w-full md:w-auto"
                            onClick={() => navigate("/ai-quiz")}
                        >
                            <Sparkles className="h-4 w-4" /> Create Quiz using AI
                        </button>
                        <button
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#00E1F9] text-black hover:bg-[#00B0CC] transition shadow-lg font-medium w-full md:w-auto"
                            onClick={() => navigate("/create-quiz")}
                        >
                            <PlusIcon /> Create New Quiz
                        </button>
                    </div>
                </div>

                {loading ? (<div className="flex justify-center items-center h-64"><p className="text-gray-400 text-lg">Loading quizzes...</p></div>) : filteredQuizzes.length === 0 ? (<p className="text-gray-500 text-center py-10">No quizzes match your criteria. Create one or adjust filters!</p>) : (
                    <div className="flex flex-col gap-6">
                        {filteredQuizzes.map((quiz) => (
                            quiz && (
                                <div key={quiz.quizId} className="bg-[#1A1A1A] p-6 rounded-lg border border-[#2A2A2A] shadow-md flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-6">

                                    <div className="flex-grow min-w-0 w-full 2xl:min-w-[250px] 2xl:mr-4">
                                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-2">
                                            <h3 className="text-lg 2xl:text-xl font-bold text-white" title={quiz.title}>{quiz.title}</h3>
                                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${quiz.title?.includes("Advanced") ? "bg-red-800 text-red-200" : "bg-yellow-800 text-yellow-200"}`}>
                                                {quiz.title?.includes("Advanced") ? "Hard" : "Medium"}
                                            </span>
                                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${quiz.status === 'active' ? 'bg-green-800 text-green-200' : 'bg-gray-600 text-gray-200'}`}>
                                                {quiz.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2">
                                            {quiz.title?.includes("JavaScript") ? "Test your knowledge of closures, promises, and async/await." : "Assess understanding of components, props, state, and hooks in React."}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0 grid grid-cols-3 sm:grid-cols-5 gap-x-4 2xl:gap-x-5 gap-y-3 text-xs 2xl:text-sm text-gray-400 w-full 2xl:w-auto border-t 2xl:border-t-0 2xl:border-l 2xl:border-r px-0 md:px-4 2xl:px-6 pt-4 2xl:pt-0">
                                        <div className="flex items-center gap-1.5 min-w-[70px]" title="Questions">
                                            <QuestionCircleIcon />
                                            <span className="font-semibold text-[#00E1F9]">{quiz.questions?.length || 0} Qs</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-[70px]" title="Duration">
                                            <ClockIcon />
                                            <span className="font-semibold text-emerald-400">{quiz.questions?.length * 2}m</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-[70px]" title="Attempts">
                                            <Users className="h-4 w-4 text-orange-400" />
                                            <span className="font-semibold text-orange-400">{stats.quizStats?.[quiz._id]?.attempts || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-[70px]" title="Average Score">
                                            <TargetIcon className="h-4 w-4 text-purple-400" />
                                            <span className="font-semibold text-purple-400">
                                                {stats.quizStats?.[quiz._id]?.avgScore || '0%'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-[90px]" title="Created">
                                            <CalendarIcon />
                                            <span className="font-semibold text-purple-400">{new Date(quiz.createdAt).toLocaleDateString('en-CA')}</span>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full 2xl:w-auto mt-4 2xl:mt-0 pt-4 2xl:pt-0 border-t 2xl:border-t-0">
                                        <button onClick={() => handleEdit(quiz.quizId)} className="w-full sm:w-auto text-sm py-2 px-4 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition border border-[#4A4A4A] inline-flex items-center gap-1.5 justify-center">
                                            <EditIcon /> Edit
                                        </button>
                                        <button onClick={() => handleDuplicate(quiz.quizId)} className="w-full sm:w-auto text-sm py-2 px-4 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition border border-[#4A4A4A] inline-flex items-center gap-1.5 justify-center">
                                            <DuplicateIcon /> Duplicate
                                        </button>
                                        <button onClick={() => handleViewResults(quiz)} className="w-full sm:w-auto text-sm py-2 px-4 rounded-lg bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] transition border border-[#4A4A4A] inline-flex items-center gap-1.5 justify-center">
                                            <BarChart3 className="h-4 w-4" /> Results
                                        </button>
                                        <button onClick={() => handleQuizClick(quiz.quizId)} className="w-full sm:w-auto text-sm py-2 px-4 rounded-lg bg-[#00E1F9] text-black hover:bg-[#00B0CC] transition font-medium inline-flex items-center gap-1.5 justify-center">
                                            <Save className="h-4 w-4" /> Manage
                                        </button>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-lg border-b border-white/10 shadow h-16 flex items-center px-4 justify-between">

                <div className="flex items-center gap-3">
                    <img src={LOGO} alt="ProctorX Logo" className="h-10 w-10" />

                    <span className="text-xl font-bold text-white">
                        ProctorX
                    </span>
                </div>

                <div className="flex items-center gap-4">

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all"
                    >
                        <HomeIcon className="h-5 w-5 text-white" />
                        <span className="hidden min-[500px]:inline text-white font-medium text-sm">
                            Home
                        </span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 p-2 rounded-lg bg-red-900/40 hover:bg-red-900/70 transition-all"
                    >
                        <LogoutIcon className="h-5 w-5 text-red-400" />
                        <span className="hidden min-[500px]:inline text-red-400 font-medium text-sm">
                            Logout
                        </span>
                    </button>

                </div>
            </header>



            <main className="flex-1 p-4 md:p-10 pt-20 md:pt-24 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
}