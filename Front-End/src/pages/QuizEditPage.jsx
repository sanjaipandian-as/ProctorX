import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Plus, Trash2, Home, LogOut, Upload, Download,
    HelpCircle, Loader2, CheckCircle, FileText,
    Code, List, Save, ArrowLeft, Settings,
    ChevronRight, Layout, Info, Sparkles, Target,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../Api";
import Logo from "../assets/LOGO.png";
import toast, { Toaster } from 'react-hot-toast';

// --- Premium Components ---
const GlassCard = ({ children, className = "", ...props }) => (
    <motion.div
        {...props}
        className={`bg-white border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] ${className}`}
    >
        {children}
    </motion.div>
);

const Input = ({ label, icon: Icon, hint, ...props }) => (
    <div className="space-y-2.5">
        {label && (
            <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-[#FFB343]" strokeWidth={2.5} />}
                    {label}
                </label>
                {hint && <span className="text-[10px] font-bold text-slate-400 italic">{hint}</span>}
            </div>
        )}
        <input
            {...props}
            className={`w-full px-6 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl focus:bg-white focus:ring-8 focus:ring-[#FFB343]/10 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-200 shadow-sm text-base ${props.className}`}
        />
    </div>
);

// --- Constants ---
const HELP_TEXT = `CSV Import Rules:\n• Headers: questionType, questionText, option1, option2, option3, option4, correctAnswerIndex, marks\n• Types: mcq, descriptive, coding\n• Note: Coding testcases must be added in UI. Use double quotes for text with commas.`;

const DEFAULT_CODE = {
    javascript: `// Javascript\nfunction solve() {\n    // logic\n}\nsolve();`,
    python: `# Python\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()`,
    java: `// Java\nimport java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        // code\n    }\n}`,
    cpp: `// C++\n#include <iostream>\nint main() {\n    return 0;\n}`
};

export default function EditQuizPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [showHelpModal, setShowHelpModal] = useState(false);

    const languages = ["javascript", "python", "java", "cpp"];

    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        toast.success("Signed out successfully");
        navigate("/login");
    }, [navigate]);

    useEffect(() => {
        const fetchQuiz = async () => {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication token not found.");

                const { data } = await API.get(`/api/quizzes/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const questions = Array.isArray(data.questions) ? data.questions : [];
                const normalized = {
                    ...data,
                    title: data.title || "",
                    allowedStudents: data.allowedStudents || 0,
                    questions: questions.map(q => ({
                        ...q,
                        questionType: q.questionType || "mcq",
                        questionText: q.questionText || "",
                        options: Array.isArray(q.options) ? [...q.options].slice(0, 4).concat(Array(Math.max(0, 4 - q.options.length)).fill("")).slice(0, 4) : ["", "", "", ""],
                        correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
                        marks: Number(q.marks) || 1,
                        descriptiveAnswer: q.descriptiveAnswer || "",
                        starterCode: q.starterCode || { ...DEFAULT_CODE },
                        testcases: Array.isArray(q.testcases) ? q.testcases : Array.from({ length: 4 }, () => ({ input: "", output: "" })),
                    }))
                };
                setQuiz(normalized);
                if (normalized.questions.length === 0) setActiveQuestionIndex(-1);
            } catch (err) {
                const msg = err.response?.data?.message || err.message || "Failed to load quiz.";
                setError(msg);
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);

    const updateGlobalField = (name, value) => {
        setQuiz(prev => ({ ...prev, [name]: value }));
    };

    const updateQuestionField = (index, field, value) => {
        setQuiz(prev => {
            const questions = [...prev.questions];
            questions[index] = { ...questions[index], [field]: value };

            if (field === "questionType") {
                if (value === "mcq" && !questions[index].options) questions[index].options = ["", "", "", ""];
                if (value === "coding") {
                    if (!questions[index].starterCode) questions[index].starterCode = { ...DEFAULT_CODE };
                    if (!questions[index].testcases) questions[index].testcases = Array.from({ length: 4 }, () => ({ input: "", output: "" }));
                }
            }
            return { ...prev, questions };
        });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        setQuiz(prev => {
            const questions = [...prev.questions];
            const options = [...questions[qIndex].options];
            options[oIndex] = value;
            questions[qIndex].options = options;
            return { ...prev, questions };
        });
    };

    const handleTestcaseChange = (qIndex, tcIndex, field, value) => {
        setQuiz(prev => {
            const questions = [...prev.questions];
            const tcs = [...questions[qIndex].testcases];
            tcs[tcIndex] = { ...tcs[tcIndex], [field]: value };
            questions[qIndex].testcases = tcs;
            return { ...prev, questions };
        });
    };

    const addQuestion = () => {
        if (activeQuestionIndex !== -1) {
            const currentQ = quiz.questions[activeQuestionIndex];
            if (Number(currentQ.marks) < 1) {
                return toast.error("Marks must be at least 1");
            }
        }

        setQuiz(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    questionType: "mcq",
                    questionText: "",
                    options: ["", "", "", ""],
                    correctAnswer: 0,
                    marks: 1,
                    descriptiveAnswer: "",
                    starterCode: { ...DEFAULT_CODE },
                    testcases: Array.from({ length: 4 }, () => ({ input: "", output: "" }))
                }
            ]
        }));
        setActiveQuestionIndex(quiz.questions.length);
    };

    const removeQuestion = (index) => {
        if (quiz.questions.length <= 1) return toast.error("Need 1 question least");
        const newQuestions = quiz.questions.filter((_, i) => i !== index);
        setQuiz(prev => ({ ...prev, questions: newQuestions }));
        if (activeQuestionIndex >= newQuestions.length) setActiveQuestionIndex(newQuestions.length - 1);
    };

    const downloadTemplate = () => {
        const csv = "data:text/csv;charset=utf-8,questionType,questionText,option1,option2,option3,option4,correctAnswerIndex,marks\nmcq,Example Question,Opt1,Opt2,Opt3,Opt4,0,1";
        const link = document.createElement("a");
        link.href = encodeURI(csv);
        link.download = "quiz_template.csv";
        link.click();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const rows = ev.target.result.split("\n").filter(r => r.trim() !== "");
                const newQuestions = rows.slice(1).map(row => {
                    const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                    const sanitizedCols = cols.map(c => c.replace(/^"|"$/g, "").trim());

                    const qType = sanitizedCols[0] || "mcq";
                    return {
                        questionType: qType,
                        questionText: sanitizedCols[1] || "",
                        options: [sanitizedCols[2] || "", sanitizedCols[3] || "", sanitizedCols[4] || "", sanitizedCols[5] || ""],
                        correctAnswer: Number(sanitizedCols[6]) || 0,
                        marks: Number(sanitizedCols[7]) || (qType === "coding" ? 10 : qType === "descriptive" ? 5 : 1),
                        starterCode: { ...DEFAULT_CODE },
                        testcases: Array.from({ length: 4 }, () => ({ input: "", output: "" }))
                    };
                });
                setQuiz(prev => ({ ...prev, questions: newQuestions }));
                toast.success(`Imported ${newQuestions.length} questions`);
            } catch (err) {
                console.error("CSV Import Error:", err);
                toast.error("Failed to parse CSV results");
            }
        };
        reader.readAsText(file);
    };

    const handleSave = async () => {
        if (!quiz.title.trim()) return toast.error("Enter Quiz Title");

        const invalidQ = quiz.questions.find(q => Number(q.marks) < 1);
        if (invalidQ) return toast.error("Each question must have at least 1 mark");

        setIsSaving(true);
        const loading = toast.loading("Syncing modifications...");
        try {
            const payload = {
                title: quiz.title,
                allowedStudents: Number(quiz.allowedStudents) || 0,
                questions: quiz.questions.map(q => ({
                    ...q,
                    options: q.questionType === "mcq" ? q.options : undefined,
                    starterCode: q.questionType === "coding" ? q.starterCode : undefined,
                    testcases: q.questionType === "coding" ? q.testcases : undefined
                }))
            };
            await API.put(`/api/quizzes/${quizId}`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            toast.dismiss(loading);
            toast.success("Ready for students!");
            setTimeout(() => navigate("/staff-dashboard"), 1200);
        } catch (err) {
            toast.dismiss(loading);
            toast.error(err.response?.data?.message || "Failed to sync");
        } finally { setIsSaving(false); }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#FFB343]" />
                <span className="text-[10px] font-black text-black/20 uppercase tracking-[0.5em]">Loading Architecture</span>
            </div>
        </div>
    );

    if (error && !quiz) return (
        <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
            <h2 className="text-2xl font-black text-black uppercase tracking-tighter italic mb-2">Access Denied</h2>
            <p className="text-sm font-bold text-black/40 uppercase tracking-widest mb-8">{error}</p>
            <button
                onClick={() => navigate('/staff-dashboard')}
                className="flex items-center gap-3 px-8 py-3 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#FFB343] hover:text-black transition-all"
            >
                <ArrowLeft size={14} /> Back to Hub
            </button>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-white text-slate-800 font-sans selection:bg-[#FFB343]/10 overflow-hidden">
            <Toaster position="top-right" />

            {/* --- Unified Header --- */}
            <header className="sticky top-0 z-[60] w-full bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
                <div className="max-w-[1800px] mx-auto px-10 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/staff-dashboard')}>
                            <div className="bg-[#FFB343] p-3 rounded-2xl shadow-lg shadow-[#FFB343]/20 group-hover:scale-110 transition-transform duration-500">
                                <img src={Logo} alt="" className="h-5 w-5 brightness-0 invert" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold tracking-tighter text-slate-900 leading-none">ProctorX</span>
                                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#FFB343] transition-colors tracking-[0.2em] uppercase mt-1">Control Center</span>
                            </div>
                        </div>

                        <div className="h-10 w-px bg-slate-200/80 rotate-12" />

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFB343]/40 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFB343]"></span>
                                </span>
                                <span className="text-[9px] font-bold text-[#FFB343] uppercase tracking-[0.3em] leading-none">VIRTUAL SESSION</span>
                            </div>
                            <input
                                value={quiz.title}
                                onChange={(e) => updateGlobalField("title", e.target.value)}
                                placeholder="UNNAMED ASSESSMENT"
                                className="bg-transparent font-bold text-lg text-slate-900 outline-none placeholder:text-slate-200 w-[500px] tracking-tight hover:bg-slate-50/50 rounded-lg px-2 -ml-2 transition-all focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => setActiveQuestionIndex(-1)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all text-[11px] font-bold shadow-sm tracking-[0.2em] uppercase border ${activeQuestionIndex === -1 ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-200 text-slate-600 hover:border-[#FFB343] hover:text-[#FFB343]'}`}
                        >
                            <Settings className="w-4 h-4" />
                            GLOBAL CONFIG
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-3 px-8 py-3 bg-[#FFB343] text-white rounded-2xl font-bold text-[11px] hover:bg-[#FFB343]/90 transition-all shadow-xl shadow-[#FFB343]/20 active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em]"
                        >
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" strokeWidth={3} />}
                            <span>{isSaving ? "SYNCING..." : "PUBLISH CHANGES"}</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* --- Sidebar Question Navigator --- */}
                <aside className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col h-full overflow-hidden">
                    <div className="p-6 flex justify-between items-center border-b border-slate-200 bg-white/50">
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">STRUCTURE</h3>
                        <span className="text-[10px] font-black px-2.5 py-1 bg-slate-900 text-white rounded-md tracking-widest">
                            {quiz.questions.length} TOTAL
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {quiz.questions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveQuestionIndex(i)}
                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all text-left group relative outline-none ${activeQuestionIndex === i
                                    ? 'bg-white border-[#FFB343] shadow-[0_10px_20px_-5px_rgba(255,179,67,0.15)] ring-1 ring-[#FFB343]/10'
                                    : 'bg-white/40 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-300 hover:shadow-md'
                                    }`}
                            >
                                <div className={`h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm transition-all ${activeQuestionIndex === i ? 'bg-[#FFB343] text-white shadow-lg shadow-[#FFB343]/20 scale-110' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                    }`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate transition-colors ${activeQuestionIndex === i ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {q.questionText || "Untitled Question"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${activeQuestionIndex === i ? 'bg-[#FFB343]/10 text-[#FFB343]' : 'bg-slate-100 text-slate-400'}`}>
                                            {q.questionType}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                            {q.marks} PT
                                        </span>
                                    </div>
                                </div>
                                {quiz.questions.length > 1 && (
                                    <div
                                        onClick={(e) => { e.stopPropagation(); removeQuestion(i); }}
                                        className={`p-2 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all ${activeQuestionIndex === i ? 'text-slate-300' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </div>
                                )}
                            </button>
                        ))}

                        <button
                            onClick={addQuestion}
                            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#FFB343] hover:text-[#FFB343] transition-all bg-white/40 hover:bg-[#FFB343]/5 group mt-4 outline-none"
                        >
                            <div className="h-9 w-9 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center group-hover:border-[#FFB343] transition-colors">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest">Add Question</span>
                        </button>
                    </div>

                    <div className="p-5 border-t border-slate-200 bg-white/50 grid grid-cols-2 gap-3">
                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-[#FFB343] hover:text-[#FFB343] transition-all text-[11px] font-black text-slate-600 shadow-sm uppercase tracking-widest">
                            <Upload className="w-4 h-4" />
                            BULK UPLOAD
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                        </label>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-[#FFB343] hover:text-[#FFB343] transition-all text-[11px] font-black text-slate-600 shadow-sm uppercase tracking-widest"
                        >
                            <Download className="w-4 h-4" />
                            CSV SCHEMA
                        </button>
                    </div>
                </aside>

                {/* --- Main Workspace --- */}
                <main className="flex-1 overflow-y-auto bg-[#FAFBFF] custom-scrollbar p-6 lg:p-10">
                    <div className="w-full mx-auto pb-20 space-y-8">
                        <AnimatePresence mode="wait">
                            {activeQuestionIndex === -1 ? (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Assessment Parameters</h2>
                                            <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-[0.2em]">General Configuration Protocol</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                            <Input
                                                label="PRIMARY IDENTIFIER"
                                                icon={Layout}
                                                value={quiz.title}
                                                onChange={(e) => updateGlobalField("title", e.target.value)}
                                                placeholder="e.g. Advanced Quantum Mechanics Finals"
                                            />
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                            <Input
                                                type="number"
                                                label="MAXIMUM CANDIDATES"
                                                icon={Target}
                                                value={quiz.allowedStudents}
                                                onChange={(e) => updateGlobalField("allowedStudents", e.target.value)}
                                                hint="0 = UNRESTRICTED"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={activeQuestionIndex}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center justify-between bg-white px-8 py-5 rounded-[28px] border border-slate-100 shadow-[0_4px_25px_rgb(0,0,0,0.02)]">
                                        <div className="flex items-center gap-8">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">ACTIVE EVALUATOR</span>
                                                <span className="text-lg font-black text-slate-900 leading-none tracking-tight">OBJECTIVE {activeQuestionIndex + 1}</span>
                                            </div>
                                            <div className="h-10 w-px bg-slate-100 mx-2" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">POINT ALLOCATION</span>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={quiz.questions[activeQuestionIndex].marks}
                                                        onChange={(e) => updateQuestionField(activeQuestionIndex, "marks", e.target.value)}
                                                        className="w-16 h-10 text-base font-black text-slate-900 outline-none bg-slate-50 px-3 rounded-xl border border-slate-200 focus:border-[#FFB343] focus:ring-4 focus:ring-[#FFB343]/10 transition-all text-center shadow-inner"
                                                    />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowHelpModal(true)} className="p-2.5 text-slate-300 hover:text-[#FFB343] transition-all rounded-xl hover:bg-[#FFB343]/5 group">
                                            <HelpCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        </button>
                                    </div>

                                    {/* Type Selector Grid */}
                                    <div className="grid grid-cols-3 gap-5">
                                        {[
                                            { id: 'mcq', label: 'MCQ', icon: List, desc: 'Multiple Choice' },
                                            { id: 'descriptive', label: 'Written', icon: FileText, desc: 'Descriptive' },
                                            { id: 'coding', label: 'Coding', icon: Code, desc: 'Implementation' }
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => updateQuestionField(activeQuestionIndex, "questionType", type.id)}
                                                className={`flex items-center gap-5 p-5 rounded-[24px] border border-slate-200/60 transition-all group relative overflow-hidden ${quiz.questions[activeQuestionIndex].questionType === type.id
                                                    ? 'bg-white border-[#FFB343] text-slate-900 shadow-xl shadow-[#FFB343]/10 ring-1 ring-[#FFB343]/10'
                                                    : 'bg-white/50 border-slate-100 text-slate-500 hover:border-slate-300 shadow-sm'
                                                    }`}
                                            >
                                                <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${quiz.questions[activeQuestionIndex].questionType === type.id
                                                    ? 'bg-[#FFB343] text-white shadow-lg shadow-[#FFB343]/20'
                                                    : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                                                    }`}>
                                                    <type.icon className="h-5 h-5" />
                                                </div>
                                                <div className="text-left relative z-10">
                                                    <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{type.label}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">{type.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-white p-8 lg:p-10 rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 px-1">
                                                <div className="p-2 bg-[#FFB343]/10 rounded-lg">
                                                    <Info className="w-5 h-5 text-[#FFB343]" strokeWidth={2} />
                                                </div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">EVALUATION PROMPT</label>
                                            </div>
                                            <textarea
                                                rows={4}
                                                value={quiz.questions[activeQuestionIndex].questionText}
                                                onChange={(e) => updateQuestionField(activeQuestionIndex, "questionText", e.target.value)}
                                                className="w-full p-6 bg-slate-50/50 border border-slate-200/60 rounded-[24px] focus:bg-white focus:ring-4 focus:ring-[#FFB343]/10 outline-none text-lg font-bold text-slate-800 transition-all placeholder:text-slate-200 tracking-tight leading-relaxed shadow-inner"
                                                placeholder="State your question clearly..."
                                            />
                                        </div>

                                        {quiz.questions[activeQuestionIndex].questionType === "mcq" && (
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 px-1">
                                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                                        <CheckCircle className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                                                    </div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">ANSWER CONFIGURATION</label>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    {quiz.questions[activeQuestionIndex].options.map((opt, j) => (
                                                        <div key={j} className={`flex items-center gap-4 p-3 pr-5 rounded-[20px] border transition-all group ${quiz.questions[activeQuestionIndex].correctAnswer === j ? 'border-emerald-500 bg-emerald-50/20 shadow-lg shadow-emerald-100/30' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'}`}>
                                                            <button
                                                                onClick={() => updateQuestionField(activeQuestionIndex, "correctAnswer", j)}
                                                                className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all ${quiz.questions[activeQuestionIndex].correctAnswer === j
                                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105'
                                                                    : 'bg-white text-slate-200 hover:text-slate-400 shadow-sm'
                                                                    }`}
                                                            >
                                                                <CheckCircle className="h-5 h-5" />
                                                            </button>
                                                            <input
                                                                value={opt}
                                                                onChange={(e) => handleOptionChange(activeQuestionIndex, j, e.target.value)}
                                                                className="flex-1 bg-transparent py-3 outline-none font-bold text-base text-slate-700 placeholder:text-slate-200"
                                                                placeholder={`Option ${String.fromCharCode(65 + j)}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {quiz.questions[activeQuestionIndex].questionType === "descriptive" && (
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4 px-1">
                                                    <div className="p-2.5 bg-blue-100/50 rounded-xl shadow-inner">
                                                        <FileText className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
                                                    </div>
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">MARKING RUBRIC</label>
                                                </div>
                                                <textarea rows={5} value={quiz.questions[activeQuestionIndex].descriptiveAnswer} onChange={(e) => updateQuestionField(activeQuestionIndex, "descriptiveAnswer", e.target.value)} className="w-full p-6 bg-slate-50/50 border border-slate-200/60 rounded-[24px] focus:bg-white focus:ring-4 focus:ring-blue-50/20 outline-none text-sm font-bold text-slate-600 leading-relaxed shadow-inner" placeholder="Specify the core competencies or key phases required for a perfect score..." />
                                            </div>
                                        )}

                                        {quiz.questions[activeQuestionIndex].questionType === "coding" && (
                                            <div className="space-y-12">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {languages.map(lang => (
                                                        <div key={lang} className="bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                                                            <div className="bg-[#1E293B] px-6 py-3 flex justify-between items-center border-b border-white/5">
                                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{lang}</span>
                                                            </div>
                                                            <textarea
                                                                rows={8}
                                                                value={quiz.questions[activeQuestionIndex].starterCode[lang] || ""}
                                                                onChange={(e) => {
                                                                    const sc = { ...quiz.questions[activeQuestionIndex].starterCode, [lang]: e.target.value };
                                                                    updateQuestionField(activeQuestionIndex, "starterCode", sc);
                                                                }}
                                                                className="w-full p-6 bg-transparent text-[13px] font-mono text-emerald-400 outline-none resize-none leading-relaxed"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-4 px-1">
                                                        <div className="p-2.5 bg-indigo-100/50 rounded-xl shadow-inner">
                                                            <Target className="w-6 h-6 text-indigo-600" strokeWidth={2.5} />
                                                        </div>
                                                        <label className="text-xs font-black text-slate-500 uppercase tracking-[0.25em]">VALIDATION TESTCASES</label>
                                                    </div>
                                                    <div className="bg-slate-50/50 rounded-[32px] border border-slate-200/60 divide-y divide-slate-200/40 overflow-hidden shadow-inner">
                                                        {quiz.questions[activeQuestionIndex].testcases.map((tc, tcIndex) => (
                                                            <div key={tcIndex} className="grid grid-cols-12 gap-8 p-6 items-center bg-white/30 hover:bg-white transition-all">
                                                                <span className="col-span-1 text-[11px] font-black text-slate-300 tracking-tighter">TC-0{tcIndex + 1}</span>
                                                                <div className="col-span-11 grid grid-cols-2 gap-8">
                                                                    <div className="space-y-2">
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Input</span>
                                                                        <input value={tc.input} onChange={(e) => handleTestcaseChange(activeQuestionIndex, tcIndex, "input", e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-xs font-mono outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 shadow-sm" placeholder="null" />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Output</span>
                                                                        <input value={tc.output} onChange={(e) => handleTestcaseChange(activeQuestionIndex, tcIndex, "output", e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-xs font-mono outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50 shadow-sm" placeholder="expected_return" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center py-10">
                                        {activeQuestionIndex > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                                                className="flex items-center gap-3 text-[11px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.2em]"
                                            >
                                                <ArrowLeft className="w-4 h-4" strokeWidth={3} /> PREVIOUS
                                            </button>
                                        ) : <div />}

                                        {activeQuestionIndex < quiz.questions.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                                                className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center gap-3 group"
                                            >
                                                PROCEED TO NEXT OBJECTIVE
                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            <AnimatePresence>
                {showHelpModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[32px] p-10 max-w-lg w-full shadow-2xl space-y-6">
                            <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                                <Zap className="w-8 h-8 text-[#FFB343]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Pro Tip</h3>
                                <p className="text-slate-500 mt-2 font-medium leading-relaxed">
                                    Use the <strong>CSV Template</strong> to batch-import questions. For multiple testcases in coding questions, ensure each scenario has a distinct input/output pair for accurate evaluation.
                                </p>
                            </div>
                            <button onClick={() => setShowHelpModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-black transition-all">Dismiss</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4, .font-black { font-family: 'Outfit', sans-serif; }

        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FFB343; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}} />
        </div>
    );
}