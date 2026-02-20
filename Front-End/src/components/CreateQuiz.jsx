import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trash2, Home, LogOut, Upload, Download,
  HelpCircle, Loader2, CheckCircle, FileText,
  Code, List, Save, ArrowLeft, Settings,
  ChevronRight, Layout, Info, Sparkles, Target,
  X, AlertCircle, BookOpen, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../Api";
import Logo from "../assets/LOGO.png";
import toast, { Toaster } from 'react-hot-toast';

// --- Premium Components ---
const GlassCard = ({ children, className = "", ...props }) => (
  <motion.div
    {...props}
    className={`bg-white/80 backdrop-blur-xl border border-slate-100/50 shadow-2xl shadow-slate-200/50 rounded-[32px] ${className}`}
  >
    {children}
  </motion.div>
);

const Input = ({ label, icon: Icon, hint, ...props }) => (
  <div className="space-y-2">
    {label && (
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-[#FFB343]" />}
          {label}
        </label>
        {hint && <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">{hint}</span>}
      </div>
    )}
    <input
      {...props}
      className={`w-full px-5 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-[#FFB343]/50 focus:ring-4 focus:ring-[#FFB343]/5 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300 ${props.className}`}
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

export default function CreateQuiz() {
  const navigate = useNavigate();
  const languages = ["javascript", "python", "java", "cpp"];

  const [formData, setFormData] = useState({
    title: "",
    allowedStudents: 0,
    questions: [
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
  });

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Calculate quiz completion progress
  const quizProgress = useMemo(() => {
    const totalQuestions = formData.questions.length;
    const completedQuestions = formData.questions.filter(q =>
      q.questionText.trim() !== '' &&
      (q.questionType === 'mcq' ? q.options.some(opt => opt.trim() !== '') : true)
    ).length;
    const hasTitle = formData.title.trim() !== '';
    return {
      percentage: Math.round(((completedQuestions / totalQuestions) + (hasTitle ? 0.2 : 0)) / 1.2 * 100),
      completedQuestions,
      totalQuestions,
      hasTitle
    };
  }, [formData]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    toast.success("Signed out");
    navigate("/login");
  }, [navigate]);

  const updateGlobalField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateQuestionField = (index, field, value) => {
    setFormData(prev => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], [field]: value };

      if (field === "questionType") {
        if (value === "mcq") {
          if (!questions[index].options) questions[index].options = ["", "", "", ""];
          questions[index].marks = 1;
        } else if (value === "descriptive") {
          questions[index].marks = 5;
        } else if (value === "coding") {
          if (!questions[index].starterCode) questions[index].starterCode = { ...DEFAULT_CODE };
          if (!questions[index].testcases) questions[index].testcases = Array.from({ length: 4 }, () => ({ input: "", output: "" }));
          questions[index].marks = 10;
        }
      }
      return { ...prev, questions };
    });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    setFormData(prev => {
      const questions = [...prev.questions];
      const options = [...questions[qIndex].options];
      options[oIndex] = value;
      questions[qIndex].options = options;
      return { ...prev, questions };
    });
  };

  const handleTestcaseChange = (qIndex, tcIndex, field, value) => {
    setFormData(prev => {
      const questions = [...prev.questions];
      const tcs = [...questions[qIndex].testcases];
      tcs[tcIndex] = { ...tcs[tcIndex], [field]: value };
      questions[qIndex].testcases = tcs;
      return { ...prev, questions };
    });
  };

  const addQuestion = () => {
    // Validate current question marks if we are on a question page
    if (activeQuestionIndex !== -1) {
      const currentQ = formData.questions[activeQuestionIndex];
      if (Number(currentQ.marks) < 1) {
        return toast.error("Marks must be at least 1");
      }
    }

    setFormData(prev => ({
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
    setActiveQuestionIndex(formData.questions.length);
  };

  const removeQuestion = (index) => {
    if (formData.questions.length <= 1) return toast.error("Need 1 question least");
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, questions: newQuestions }));
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
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = ev.target.result.split("\n").filter(r => r.trim() !== "");
        const newQuestions = rows.slice(1).map(row => {
          // Robust CSV parsing using regex to handle commas within quotes
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
        setFormData(prev => ({ ...prev, questions: newQuestions }));
        toast.success(`Imported ${newQuestions.length} questions`);
      } catch (err) { toast.error("Failed to parse CSV"); }
      finally { setIsParsing(false); }
    };
    reader.readAsText(file);
  };

  const submitQuiz = async () => {
    if (!formData.title.trim()) return toast.error("Enter Quiz Title");

    // Validate all questions have at least 1 mark
    const invalidQ = formData.questions.find(q => Number(q.marks) < 1);
    if (invalidQ) return toast.error("Each question must have at least 1 mark");

    setIsSubmitting(true);
    const loading = toast.loading("Publishing...");
    try {
      const payload = {
        title: formData.title,
        allowedStudents: Number(formData.allowedStudents) || 0,
        questions: formData.questions.map(q => ({
          ...q,
          options: q.questionType === "mcq" ? q.options : undefined,
          starterCode: q.questionType === "coding" ? q.starterCode : undefined,
          testcases: q.questionType === "coding" ? q.testcases : undefined
        }))
      };
      await API.post("/api/quizzes/create", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.dismiss(loading);
      toast.success("Ready for students!");
      setTimeout(() => navigate("/staff-dashboard"), 1200);
    } catch (err) {
      toast.dismiss(loading);
      toast.error(err.response?.data?.message || "Failed to publish");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="h-screen flex flex-col bg-[#FCFCFE] text-slate-900 font-sans selection:bg-[#FFB343]/30 overflow-hidden relative">
      <Toaster position="top-right" />

      {/* --- Sophisticated Creation Header --- */}
      <header className="flex-shrink-0 bg-white/60 backdrop-blur-2xl border-b border-slate-100/50 h-20 z-[100] sticky top-0">
        <div className="max-w-[1700px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-10">
            {/* Brand/Back Section */}
            <div
              className="flex items-center gap-4 cursor-pointer group"
              onClick={() => navigate('/staff-dashboard')}
            >
              <div className="bg-slate-900 p-2.5 rounded-xl group-hover:bg-[#FFB343] transition-all duration-500 shadow-lg shadow-slate-200 group-hover:rotate-[-8deg]">
                <img src={Logo} alt="" className="h-5 w-5 brightness-0 invert" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#FFB343] uppercase tracking-[0.2em] leading-none mb-1">Editor</span>
                <span className="text-xl font-black tracking-tighter text-slate-900 serif-font leading-none">
                  Proctor<span className="text-[#FFB343]">X</span>
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200/60" />

            {/* Editable Breadcrumb Title */}
            <div className="relative group flex items-center gap-3">
              <div className="p-2 bg-slate-50 rounded-lg group-focus-within:bg-orange-50 transition-colors">
                <Layout className="w-4 h-4 text-slate-400 group-focus-within:text-[#FFB343]" />
              </div>
              <div className="relative">
                <input
                  value={formData.title}
                  onChange={(e) => updateGlobalField("title", e.target.value)}
                  placeholder="Untitled Assessment"
                  className="bg-transparent font-medium text-2xl text-slate-900 outline-none placeholder:text-slate-200 min-w-[350px] serif-font transition-all focus:placeholder:opacity-0"
                />
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FFB343] scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left rounded-full shadow-[0_0_10px_rgba(255,179,67,0.4)]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Status & Progress Group */}
            <div className="flex items-center gap-5 bg-white/50 border border-slate-100 p-1.5 pr-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="relative flex items-center justify-center p-2 rounded-xl bg-white shadow-inner">
                <svg className="w-10 h-10 transform -rotate-90">
                  <circle cx="20" cy="20" r="17" stroke="#F8FAFC" strokeWidth="3" fill="none" />
                  <motion.circle
                    cx="20" cy="20" r="17"
                    stroke="#FFB343"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 17}`}
                    transition={{ duration: 1.5, ease: "anticipate" }}
                    animate={{ strokeDashoffset: `${2 * Math.PI * 17 * (1 - quizProgress.percentage / 100)}` }}
                    className="drop-shadow-[0_0_5px_rgba(255,179,67,0.4)]"
                  />
                </svg>
                <span className="absolute text-[9px] font-black text-slate-800">{quizProgress.percentage}%</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${quizProgress.percentage > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Assessment Score</span>
                </div>
                <div className="text-sm font-bold text-slate-700 tabular-nums">
                  {quizProgress.completedQuestions} <span className="text-slate-300 mx-1">/</span> {quizProgress.totalQuestions} <span className="text-[10px] text-slate-400 ml-1 font-black">UNITS</span>
                </div>
              </div>
            </div>

            {/* Actions Group */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveQuestionIndex(-1)}
                className={`p-3.5 rounded-2xl transition-all duration-300 border-2 group relative overflow-hidden ${activeQuestionIndex === -1
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                  : 'bg-white border-slate-100 text-slate-400 hover:border-[#FFB343] hover:text-[#FFB343] hover:shadow-lg hover:shadow-orange-100'}`}
                title="Global Settings"
              >
                <Settings className={`w-5 h-5 transition-transform duration-500 ${activeQuestionIndex === -1 ? 'rotate-90' : 'group-hover:rotate-45'}`} />
              </button>

              <button
                onClick={submitQuiz}
                disabled={isSubmitting || quizProgress.percentage < 50}
                className="group relative flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200 disabled:opacity-20 disabled:grayscale overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <div className="relative flex items-center gap-3">
                    <Zap className="h-4 w-4 text-[#FFB343] fill-current group-hover:scale-125 transition-transform" />
                    <span>{isSubmitting ? "Publishing..." : "Launch Quiz"}</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* --- Sidebar Question Navigator --- */}
        <aside className="w-80 border-r border-slate-100 bg-white flex flex-col h-full overflow-hidden relative z-40">
          <div className="p-8 pt-10 border-b border-slate-100">
            <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Navigator</h3>
            <p className="text-sm font-medium text-slate-500">Construct your quiz flow</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 py-6 space-y-3 custom-scrollbar">
            {formData.questions.map((q, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 5 }}
                onClick={() => setActiveQuestionIndex(i)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-[24px] border-2 transition-all text-left relative group ${activeQuestionIndex === i
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200'
                  : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'
                  }`}
              >
                <div className={`h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-xs serif-font ${activeQuestionIndex === i ? 'bg-[#FFB343] text-slate-900' : 'bg-slate-100 text-slate-400 transition-colors group-hover:bg-white'
                  }`}>
                  {(i + 1).toString().padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate tracking-tight ${activeQuestionIndex === i ? 'text-white' : 'text-slate-700'}`}>
                    {q.questionText || "Empty Question"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${activeQuestionIndex === i ? 'text-white/40' : 'text-slate-400'}`}>
                      {q.questionType} • {q.marks}pt
                    </p>
                    {q.questionText.trim() !== '' && (
                      <CheckCircle className={`w-3.5 h-3.5 ${activeQuestionIndex === i ? 'text-[#FFB343]' : 'text-green-500'}`} />
                    )}
                  </div>
                </div>
                {formData.questions.length > 1 && (
                  <Trash2
                    className={`w-4 h-4 hover:text-rose-500 transition-all flex-shrink-0 ${activeQuestionIndex === i ? 'text-white/20' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`}
                    onClick={(e) => { e.stopPropagation(); removeQuestion(i); }}
                  />
                )}
              </motion.button>
            ))}

            <button
              onClick={addQuestion}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-[24px] border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#FFB343] hover:text-[#FFB343] hover:bg-orange-50/50 transition-all font-black text-[11px] uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              Add New Item
            </button>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-[#FFB343] hover:text-[#FFB343] transition-all text-[11px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                <Upload className="w-4 h-4" />
                Import
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
              <button
                onClick={downloadTemplate}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-[#FFB343] hover:text-[#FFB343] transition-all text-[11px] font-black uppercase tracking-widest text-slate-500 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Tpl
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-300 font-bold uppercase tracking-widest mt-1">Manual Builder v2.0</p>
          </div>
        </aside>

        {/* --- Main Workspace --- */}
        <main className="flex-1 overflow-y-auto bg-[#F8F9FA] custom-scrollbar p-12 relative">
          <div className="max-w-5xl mx-auto pb-32">
            <AnimatePresence mode="wait">
              {activeQuestionIndex === -1 ? (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="space-y-10"
                >
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-[#FFB343] rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                      <Settings className="w-3 h-3" />
                      Configuration
                    </div>
                    <h2 className="text-5xl font-medium text-slate-900 serif-font">Global <span className="text-[#FFB343]">Settings</span></h2>
                    <p className="text-slate-500 font-medium max-w-2xl">Define the core parameters and student access controls for your assessment.</p>
                  </div>

                  <GlassCard className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <Input
                      label="Public Title"
                      icon={Layout}
                      value={formData.title}
                      onChange={(e) => updateGlobalField("title", e.target.value)}
                      placeholder="e.g. Advanced System Design"
                    />
                    <Input
                      type="number"
                      label="Seats Available"
                      icon={Target}
                      value={formData.allowedStudents}
                      onChange={(e) => updateGlobalField("allowedStudents", e.target.value)}
                      hint="0 = Unlimited"
                    />
                  </GlassCard>
                </motion.div>
              ) : (
                <motion.div
                  key={activeQuestionIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="space-y-12"
                >
                  {/* Status Bar */}
                  <div className="flex items-center justify-between bg-white/60 backdrop-blur-xl px-10 py-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Editing Sequence</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-medium text-slate-900 serif-font">Question {(activeQuestionIndex + 1).toString().padStart(2, '0')}</span>
                          <span className="text-xs font-bold text-slate-300">/ {formData.questions.length.toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                      <div className="h-12 w-px bg-slate-100" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Weightage</span>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            value={formData.questions[activeQuestionIndex].marks}
                            onChange={(e) => updateQuestionField(activeQuestionIndex, "marks", e.target.value)}
                            className="w-20 h-12 text-lg font-black text-slate-900 outline-none bg-slate-50/50 px-4 rounded-xl border-2 border-slate-100 focus:border-[#FFB343]/50 focus:ring-4 focus:ring-[#FFB343]/5 transition-all text-center"
                          />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setShowHelpModal(true)} className="p-3.5 text-slate-300 hover:text-[#FFB343] transition-all rounded-2xl hover:bg-orange-50 border border-transparent hover:border-orange-100">
                      <HelpCircle className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Type Selector */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1">
                      <Zap className="w-4 h-4 text-[#FFB343] fill-current" />
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">InteractionMode</label>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { id: 'mcq', label: 'Multiple Choice', icon: List, desc: 'Single selection format', color: 'orange' },
                        { id: 'descriptive', label: 'Written Response', icon: FileText, desc: 'Theoretical assessment', color: 'slate' },
                        { id: 'coding', label: 'Algorithmic', icon: Code, desc: 'Live execution environment', color: 'slate' }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => updateQuestionField(activeQuestionIndex, "questionType", type.id)}
                          className={`flex flex-col gap-4 p-8 rounded-[32px] border-2 transition-all relative group overflow-hidden ${formData.questions[activeQuestionIndex].questionType === type.id
                            ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]'
                            : 'bg-white border-slate-100 text-slate-500 hover:border-[#FFB343]/30 hover:shadow-xl'
                            }`}
                        >
                          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${formData.questions[activeQuestionIndex].questionType === type.id ? 'bg-[#FFB343] text-slate-900 shadow-lg shadow-[#FFB343]/20' : 'bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-[#FFB343]'
                            }`}>
                            <type.icon className="h-7 w-7" />
                          </div>
                          <div className="text-left">
                            <p className="text-lg font-bold tracking-tight mb-1">{type.label}</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${formData.questions[activeQuestionIndex].questionType === type.id ? 'text-white/40' : 'text-slate-400'}`}>{type.desc}</p>
                          </div>
                          {formData.questions[activeQuestionIndex].questionType === type.id && (
                            <motion.div layoutId="active-indicator" className="absolute top-4 right-4">
                              <CheckCircle className="w-5 h-5 text-[#FFB343]" />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <GlassCard className="p-12 space-y-12 h-full">
                    {/* Prompt Input */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-[#FFB343]" />
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prompt Content</label>
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={formData.questions[activeQuestionIndex].questionText}
                        onChange={(e) => updateQuestionField(activeQuestionIndex, "questionText", e.target.value)}
                        className="w-full p-8 bg-slate-50/50 border-2 border-slate-100 rounded-[24px] focus:bg-white focus:border-[#FFB343]/50 focus:ring-4 focus:ring-[#FFB343]/5 outline-none text-2xl font-medium text-slate-900 serif-font transition-all placeholder:text-slate-200"
                        placeholder="Define the challenge..."
                      />
                    </div>

                    {/* Question Specific Content */}
                    <AnimatePresence mode="wait">
                      {formData.questions[activeQuestionIndex].questionType === "mcq" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                          <div className="flex items-center gap-3 px-1">
                            <CheckCircle className="w-5 h-5 text-[#FFB343]" />
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Defined Options</label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {formData.questions[activeQuestionIndex].options.map((opt, j) => (
                              <div key={j} className={`flex items-center gap-5 p-4 rounded-3xl border-2 transition-all ${formData.questions[activeQuestionIndex].correctAnswer === j ? 'border-[#FFB343]/50 bg-orange-50/20' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                <button
                                  onClick={() => updateQuestionField(activeQuestionIndex, "correctAnswer", j)}
                                  className={`h-12 w-12 flex-shrink-0 rounded-[18px] flex items-center justify-center transition-all ${formData.questions[activeQuestionIndex].correctAnswer === j
                                    ? 'bg-[#FFB343] text-slate-900 shadow-lg shadow-[#FFB343]/20 scale-110'
                                    : 'bg-slate-50 text-slate-300 hover:text-[#FFB343] hover:bg-orange-50'
                                    }`}
                                >
                                  <CheckCircle className="h-6 w-6" />
                                </button>
                                <input
                                  value={opt}
                                  onChange={(e) => handleOptionChange(activeQuestionIndex, j, e.target.value)}
                                  className="flex-1 bg-transparent py-3 outline-none font-bold text-slate-700 placeholder:text-slate-300"
                                  placeholder={`Variable ${String.fromCharCode(65 + j)}`}
                                />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {formData.questions[activeQuestionIndex].questionType === "descriptive" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                          <div className="flex items-center gap-3 px-1">
                            <FileText className="w-5 h-5 text-[#FFB343]" />
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference Matrix</label>
                          </div>
                          <textarea
                            rows={6}
                            value={formData.questions[activeQuestionIndex].descriptiveAnswer}
                            onChange={(e) => updateQuestionField(activeQuestionIndex, "descriptiveAnswer", e.target.value)}
                            className="w-full p-8 bg-slate-50/50 border-2 border-slate-100 rounded-[24px] focus:bg-white focus:border-[#FFB343]/50 outline-none text-base font-medium text-slate-600 leading-relaxed transition-all"
                            placeholder="Detail the expected key assessment points for evaluation..."
                          />
                        </motion.div>
                      )}

                      {formData.questions[activeQuestionIndex].questionType === "coding" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {languages.map(lang => (
                              <div key={lang} className="bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl">
                                <div className="bg-slate-800 px-8 py-4 flex justify-between items-center border-b border-white/5">
                                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">{lang}</span>
                                  <div className="flex gap-1.5 font-bold text-[8px] text-white/20">
                                    <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                                    <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                                  </div>
                                </div>
                                <textarea
                                  rows={8}
                                  value={formData.questions[activeQuestionIndex].starterCode[lang] || ""}
                                  onChange={(e) => {
                                    const sc = { ...formData.questions[activeQuestionIndex].starterCode, [lang]: e.target.value };
                                    updateQuestionField(activeQuestionIndex, "starterCode", sc);
                                  }}
                                  className="w-full p-8 bg-transparent text-xs font-mono text-[#D1D1E9] outline-none resize-none leading-relaxed"
                                  spellCheck="false"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-center gap-3 px-1">
                              <Target className="w-5 h-5 text-[#FFB343]" />
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification Scenarios</label>
                            </div>
                            <div className="bg-white rounded-[32px] border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-sm">
                              {formData.questions[activeQuestionIndex].testcases.map((tc, tcIndex) => (
                                <div key={tcIndex} className="grid grid-cols-12 gap-8 p-6 items-center hover:bg-slate-50/50 transition-all">
                                  <div className="col-span-1 flex flex-col items-center">
                                    <span className="text-[10px] font-black text-slate-200">TC</span>
                                    <span className="text-sm font-black text-[#FFB343] serif-font">{(tcIndex + 1).toString().padStart(2, '0')}</span>
                                  </div>
                                  <div className="col-span-11 grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-2">Input Stream</p>
                                      <input value={tc.input} onChange={(e) => handleTestcaseChange(activeQuestionIndex, tcIndex, "input", e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-[#FFB343] focus:bg-white transition-all shadow-inner" placeholder="0x00..." />
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest pl-2">Expected Out</p>
                                      <input value={tc.output} onChange={(e) => handleTestcaseChange(activeQuestionIndex, tcIndex, "output", e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-[#FFB343] focus:bg-white transition-all shadow-inner" placeholder="RET_OK" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>

                  {/* Navigator Footer */}
                  <div className="flex justify-between items-center px-4">
                    <button
                      type="button"
                      disabled={activeQuestionIndex === 0}
                      onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                      className="flex items-center gap-4 text-[11px] font-black text-slate-300 hover:text-slate-900 disabled:opacity-0 transition-all uppercase tracking-[0.3em] group"
                    >
                      <div className="p-3 rounded-full border border-slate-100 bg-white shadow-sm group-hover:border-[#FFB343] transition-all">
                        <ArrowLeft className="w-4 h-4" />
                      </div>
                      Previous Segment
                    </button>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={activeQuestionIndex < formData.questions.length - 1 ? () => setActiveQuestionIndex(activeQuestionIndex + 1) : addQuestion}
                        className="px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl shadow-slate-300 active:scale-95 flex items-center gap-3"
                      >
                        {activeQuestionIndex < formData.questions.length - 1 ? 'Forward' : 'Append Item'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* --- Minimal Help Modal --- */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative max-w-xl w-full bg-white rounded-[40px] p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB343]/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                  <h3 className="text-3xl font-medium text-slate-900 serif-font">Import <span className="text-[#FFB343]">Rules</span></h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Specifications</p>
                </div>
                <button onClick={() => setShowHelpModal(false)} className="text-slate-300 hover:text-rose-500 p-3 bg-slate-50 rounded-2xl transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap font-medium leading-loose">
                  {HELP_TEXT}
                </pre>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="mt-10 w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-[0.98]">Acknowledge Protocol</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #F1F5F9; border-radius: 20px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FFB343; }
       `}} />
    </div>
  );
}
