import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Sparkles,
    Home,
    LogOut,
    Loader2,
    Copy,
    CheckCircle,
    AlertCircle,
    BookOpen,
    Code,
    FileText,
    Download,
    Terminal,
    Cpu,
    Zap,
    Save,
    Info,
    List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import API from "../../Api";
import { AuthContext } from "../context/AuthContext";
import Logo from "../assets/LOGO.png";

// --- Components ---



// Logic: Parser function to extract structured sections from AI output
function parseAIQuiz(rawText) {
    const sections = {
        metadata: null,
        mcqs: [],
        descriptive: [],
        programming: []
    };

    try {
        const metadataMatch = rawText.match(/\[QUIZ_METADATA\]([\s\S]*?)(?=\[|$)/i);
        if (metadataMatch) {
            const metaText = metadataMatch[1].trim();
            sections.metadata = {
                subject: metaText.match(/Subject:\s*(.+)/i)?.[1]?.trim(),
                totalQuestions: metaText.match(/Total Questions:\s*(.+)/i)?.[1]?.trim(),
                difficulty: metaText.match(/Difficulty:\s*(.+)/i)?.[1]?.trim(),
                type: metaText.match(/Type:\s*(.+)/i)?.[1]?.trim()
            };
        }

        const mcqMatch = rawText.match(/\[MCQ_SECTION\]([\s\S]*?)(?=\[DESCRIPTIVE_SECTION\]|\[PROGRAMMING_SECTION\]|$)/i);
        if (mcqMatch) {
            const mcqText = mcqMatch[1];
            const blocks = mcqText.split(/Q\d+\.?/g).filter(q => q.trim().length > 10);

            blocks.forEach(block => {
                const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
                if (lines.length < 5) return;

                const questionText = lines[0];
                const options = [];
                let correctOption = '';
                let explanation = '';

                lines.forEach(line => {
                    if (line.match(/^[A-D][\.\:\)]\s*/i)) {
                        options.push(line.replace(/^[A-D][\.\:\)]\s*/i, '').trim());
                    } else if (line.toLowerCase().includes('correct option:')) {
                        correctOption = line.split(':').pop().trim().toUpperCase().charAt(0);
                    } else if (line.toLowerCase().includes('explanation:')) {
                        explanation = line.split(':').pop().trim();
                    }
                });

                if (questionText && options.length >= 2) {
                    while (options.length < 4) options.push("N/A");
                    sections.mcqs.push({
                        questionText,
                        options: options.slice(0, 4),
                        correctOption: correctOption || 'A',
                        explanation
                    });
                }
            });
        }

        const descMatch = rawText.match(/\[DESCRIPTIVE_SECTION\]([\s\S]*?)(?=\[PROGRAMMING_SECTION\]|$)/i);
        if (descMatch) {
            const descText = descMatch[1];
            const blocks = descText.split(/Q\d+\.?/g).filter(q => q.trim().length > 10);

            blocks.forEach(block => {
                const lines = block.trim().split('\n').filter(l => l.trim());
                if (lines.length < 1) return;

                const questionText = lines[0];
                let expectedAnswer = '';
                lines.forEach(line => {
                    if (line.toLowerCase().includes('expected answer:')) {
                        expectedAnswer = line.split(':').pop().trim();
                    }
                });
                sections.descriptive.push({ questionText, expectedAnswer });
            });
        }

        const progMatch = rawText.match(/\[PROGRAMMING_SECTION\]([\s\S]*?)$/i);
        if (progMatch) {
            const progText = progMatch[1];
            const blocks = progText.split(/Q\d+\.?/g).filter(q => q.trim().length > 10);

            blocks.forEach(block => {
                const lines = block.trim().split('\n');
                const questionText = lines[0]?.trim();
                let language = 'python';
                let testCases = [];
                let tempInput = '';

                lines.forEach(line => {
                    const l = line.trim().toLowerCase();
                    if (l.startsWith('language:')) language = line.split(':').pop().trim();

                    if (line.includes('Input:') && line.includes('Output:')) {
                        const i = line.match(/Input:\s*(.+?)\s*(?=Output:)/i);
                        const o = line.match(/Output:\s*(.+)/i);
                        if (i && o) testCases.push({ input: i[1].trim(), output: o[1].trim() });
                    } else if (line.startsWith('Input:')) {
                        tempInput = line.replace('Input:', '').trim();
                    } else if (line.startsWith('Output:') && tempInput) {
                        testCases.push({ input: tempInput, output: line.replace('Output:', '').trim() });
                        tempInput = '';
                    }
                });

                if (questionText) {
                    sections.programming.push({
                        questionText,
                        language,
                        testCases: testCases.length > 0 ? testCases : [{ input: '1', output: '1' }]
                    });
                }
            });
        }
    } catch (error) {
        console.error("AI Parser Error:", error);
    }
    return sections;
}

export default function AiQuiz() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuiz, setGeneratedQuiz] = useState(null);
    const [rawOutput, setRawOutput] = useState("");
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);





    const handleLogout = () => {
        localStorage.removeItem("token");
        toast.success("Logged out.");
        setTimeout(() => navigate("/login"), 1000);
    };

    const generateQuiz = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) {
            toast.error("Please enter a prompt");
            return;
        }

        setIsGenerating(true);
        setGeneratedQuiz(null);
        setRawOutput("");

        try {
            const response = await API.post(
                "/api/ai/generate-quiz",
                { prompt }
            );

            const aiText = response.data.text;
            setRawOutput(aiText);

            const parsedQuiz = parseAIQuiz(aiText);
            setGeneratedQuiz(parsedQuiz);
            toast.success("Quiz generated successfully!");
        } catch (error) {
            console.error("Error generating quiz:", error);
            toast.error("Failed to generate quiz. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateQuiz = async () => {
        if (!generatedQuiz || !user || user.role !== "teacher") return;

        setIsCreatingQuiz(true);
        try {
            const questions = [];

            // Map MCQs
            generatedQuiz.mcqs.forEach(m => {
                questions.push({
                    questionType: "mcq",
                    questionText: m.questionText,
                    options: m.options,
                    correctAnswer: m.correctOption.charCodeAt(0) - 65, // A=0, B=1...
                    marks: 1
                });
            });

            // Map Descriptive
            generatedQuiz.descriptive.forEach(d => {
                questions.push({
                    questionType: "descriptive",
                    questionText: d.questionText,
                    marks: 5
                });
            });

            // Map Programming
            generatedQuiz.programming.forEach(p => {
                questions.push({
                    questionType: "coding",
                    questionText: p.questionText,
                    language: p.language.toLowerCase(),
                    testcases: p.testCases.map(tc => ({
                        input: tc.input,
                        output: tc.output,
                    })),
                    marks: 10
                });
            });

            const response = await API.post("/api/quizzes/create", {
                title: generatedQuiz.metadata?.subject || "AI Generated Quiz",
                questions,
                allowedStudents: 0
            });

            toast.success(`Quiz created! ID: ${response.data.quizId}`);
        } catch (error) {
            console.error("Error creating quiz:", error);
            toast.error(error.response?.data?.message || "Failed to create quiz");
        } finally {
            setIsCreatingQuiz(false);
        }
    };

    const copyToClipboard = (text, section) => {
        navigator.clipboard.writeText(text);
        setCopiedSection(section);
        toast.success("Copied content to clipboard!");
        setTimeout(() => setCopiedSection(null), 2000);
    };

    const downloadQuiz = () => {
        const blob = new Blob([rawOutput], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `quiz_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Quiz downloaded!");
    };



    const examplePrompts = [
        { label: "JavaScript Basics", prompt: "Generate 5 MCQs on JavaScript arrays with medium difficulty" },
        { label: "Python Test", prompt: "Create a full test with 10 MCQs, 3 descriptive questions, and 2 programming problems on Python basics" },
        { label: "React Hooks", prompt: "Generate 8 hard difficulty MCQs on React Hooks and state management" },
        { label: "Data Structures", prompt: "Create a mixed quiz on Data Structures with 5 MCQs and 1 coding problem on Binary Trees" }
    ];

    return (
        <div className="flex flex-col text-slate-900 font-sans selection:bg-[#FFB343]/30 relative min-h-full">
            <main className="flex-1 relative">
                <AnimatePresence mode="wait">
                    {!generatedQuiz && !isGenerating ? (
                        /* --- Initial Centered View --- */
                        <motion.div
                            key="initial"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="h-[calc(100vh-200px)] flex flex-col items-center justify-center p-6 max-w-4xl mx-auto"
                        >
                            <div className="text-center mb-12 space-y-4">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-[#FFB343] rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border border-orange-100"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    AI-POWERED ASSESSMENTS
                                </motion.div>
                                <h1 className="text-5xl md:text-6xl font-medium text-slate-900 leading-tight tracking-tight serif-font">
                                    What would you like to <br />
                                    <span className="text-[#FFB343]">assess</span> today?
                                </h1>
                            </div>

                            <div className="w-full max-w-2xl relative">
                                <form onSubmit={generateQuiz} className="relative">
                                    <div className="bg-white rounded-[32px] border-2 border-slate-100 shadow-2xl shadow-slate-100 p-2 focus-within:border-[#FFB343]/50 transition-all duration-300">
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="E.g., Create a 10 MCQ quiz on React Hooks for advanced level..."
                                            className="w-full px-6 py-8 text-xl font-medium bg-transparent text-slate-900 placeholder:text-slate-300 resize-none outline-none leading-relaxed"
                                            rows={2}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    generateQuiz(e);
                                                }
                                            }}
                                        />
                                        <div className="flex items-center justify-between px-4 pb-4">
                                            <div className="flex items-center gap-2">
                                                <button type="button" className="p-2 text-slate-400 hover:text-[#FFB343] transition-colors rounded-full hover:bg-orange-50">
                                                    <BookOpen className="w-5 h-5" />
                                                </button>
                                                <button type="button" className="p-2 text-slate-400 hover:text-[#FFB343] transition-colors rounded-full hover:bg-orange-50">
                                                    <Code className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!prompt.trim() || isGenerating}
                                                className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-[#FFB343] hover:text-slate-900 transition-all shadow-lg hover:shadow-[#FFB343]/20 disabled:opacity-20 flex items-center gap-2 group"
                                            >
                                                <Zap className="w-5 h-5 fill-current group-hover:rotate-12 transition-transform" />
                                                <span className="text-xs font-bold uppercase tracking-widest px-1">Generate</span>
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div className="mt-8 flex flex-wrap justify-center gap-2">
                                    {examplePrompts.map((ex, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPrompt(ex.prompt)}
                                            className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-semibold text-slate-500 hover:border-[#FFB343] hover:text-[#FFB343] hover:bg-white transition-all shadow-sm"
                                        >
                                            {ex.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* --- Result View --- */
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col"
                        >
                            <div className="flex-1 pb-40">
                                <div className="max-w-4xl mx-auto space-y-12">
                                    {isGenerating ? (
                                        <div className="flex flex-col items-center justify-center py-24 space-y-6">
                                            <div className="relative">
                                                <Loader2 className="w-12 h-12 text-[#FFB343] animate-spin" />
                                                <div className="absolute inset-0 blur-xl bg-[#FFB343]/20 animate-pulse" />
                                            </div>
                                            <p className="text-slate-400 font-medium animate-pulse text-sm tracking-widest uppercase">Analyzing Subject Matter...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Quiz Header Info */}
                                            {generatedQuiz.metadata && (
                                                <div className="bg-white rounded-[32px] p-8 flex flex-wrap gap-8 items-center justify-between border border-slate-100 shadow-sm">
                                                    <div className="space-y-1">
                                                        <h2 className="text-3xl font-medium serif-font text-slate-900">{generatedQuiz.metadata.subject}</h2>
                                                        <p className="text-sm text-slate-500 font-medium">Difficulty: <span className="text-[#FFB343] font-bold">{generatedQuiz.metadata.difficulty}</span></p>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        {user?.role === "teacher" && (
                                                            <button
                                                                onClick={handleCreateQuiz}
                                                                disabled={isCreatingQuiz}
                                                                className="px-6 py-3 bg-[#FFB343] text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#FFB343]/20 flex items-center gap-2"
                                                            >
                                                                {isCreatingQuiz ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                                Save Quiz
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={downloadQuiz}
                                                            className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-[#FFB343] hover:text-[#FFB343] transition-all flex items-center gap-2"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Interactive Quiz Content */}
                                            <div className="space-y-16">
                                                {/* MCQs */}
                                                {generatedQuiz.mcqs.length > 0 && (
                                                    <div className="space-y-8">
                                                        <div className="flex items-center gap-4">
                                                            <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">MCQ Section</h3>
                                                            <div className="h-px flex-1 bg-slate-100" />
                                                        </div>
                                                        {generatedQuiz.mcqs.map((mcq, i) => (
                                                            <div key={i} className="group bg-white p-8 rounded-[32px] border border-slate-100 hover:border-[#FFB343]/30 transition-all duration-500 shadow-sm hover:shadow-md">
                                                                <div className="flex gap-6">
                                                                    <span className="text-4xl font-medium text-slate-100 serif-font select-none">{(i + 1).toString().padStart(2, '0')}</span>
                                                                    <div className="space-y-6 flex-1">
                                                                        <h4 className="text-xl font-medium text-slate-800 leading-snug">{mcq.questionText}</h4>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            {mcq.options.map((opt, idx) => {
                                                                                const isCorrect = mcq.correctOption === String.fromCharCode(65 + idx);
                                                                                return (
                                                                                    <div
                                                                                        key={idx}
                                                                                        className={`p-4 rounded-2xl border transition-all ${isCorrect ? 'bg-orange-50 border-[#FFB343]/30' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200'}`}
                                                                                    >
                                                                                        <div className="flex items-center gap-3">
                                                                                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${isCorrect ? 'bg-[#FFB343] text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                                                                                {String.fromCharCode(65 + idx)}
                                                                                            </span>
                                                                                            <span className={`text-sm ${isCorrect ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>{opt}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        {mcq.explanation && (
                                                                            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex gap-3 italic">
                                                                                <Info className="w-4 h-4 text-[#FFB343] shrink-0 mt-0.5" />
                                                                                <p className="text-xs text-slate-500 leading-relaxed font-medium">{mcq.explanation}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Descriptive */}
                                                {generatedQuiz.descriptive.length > 0 && (
                                                    <div className="space-y-8">
                                                        <div className="flex items-center gap-4">
                                                            <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Theoretical Section</h3>
                                                            <div className="h-px flex-1 bg-slate-100" />
                                                        </div>
                                                        {generatedQuiz.descriptive.map((desc, i) => (
                                                            <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 space-y-4 shadow-sm">
                                                                <h4 className="text-xl font-medium text-slate-800 flex items-start gap-4">
                                                                    <span className="text-[#FFB343]">Q.</span>
                                                                    {desc.questionText}
                                                                </h4>
                                                                <div className="p-6 bg-slate-50 rounded-2xl border-l-4 border-[#FFB343]">
                                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Key Assessment points</p>
                                                                    <p className="text-sm text-slate-600 italic font-medium leading-relaxed">"{desc.expectedAnswer}"</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Programming */}
                                                {generatedQuiz.programming.length > 0 && (
                                                    <div className="space-y-8">
                                                        <div className="flex items-center gap-4">
                                                            <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em]">Algorithmic Section</h3>
                                                            <div className="h-px flex-1 bg-slate-100" />
                                                        </div>
                                                        {generatedQuiz.programming.map((prog, i) => (
                                                            <div key={i} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                                                                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="bg-slate-900 p-3 rounded-xl">
                                                                            <Code className="w-5 h-5 text-[#FFB343]" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">{prog.language}</p>
                                                                            <h4 className="text-xl font-medium text-slate-900">{prog.questionText}</h4>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="p-8 space-y-6">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        <div className="space-y-3">
                                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Sample Input</p>
                                                                            <pre className="bg-slate-900 p-6 rounded-2xl text-slate-300 font-mono text-xs overflow-x-auto min-h-[100px] border border-slate-800">
                                                                                {prog.sampleInput || "N/A"}
                                                                            </pre>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            <p className="text-[10px] font-black text-[#FFB343] uppercase tracking-widest px-2">Expected Output</p>
                                                                            <pre className="bg-slate-900 p-6 rounded-2xl text-[#FFB343]/80 font-mono text-xs overflow-x-auto min-h-[100px] border border-slate-800 shadow-inner">
                                                                                {prog.sampleOutput || "N/A"}
                                                                            </pre>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Bottom Input for Follow-up --- Refined for Dashboard */}
                            <div className="sticky bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50/90 via-gray-50/50 to-transparent backdrop-blur-sm -mx-4 md:-mx-8">
                                <div className="max-w-3xl mx-auto w-full">
                                    <form onSubmit={generateQuiz} className="relative group">
                                        <div className="bg-white rounded-[28px] border-2 border-slate-200 shadow-2xl p-2 flex items-center gap-4 focus-within:border-[#FFB343]/50 transition-all">
                                            <input
                                                type="text"
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="Refine or create new quiz..."
                                                className="flex-1 px-4 py-4 text-sm font-medium bg-transparent text-slate-900 outline-none"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!prompt.trim() || isGenerating}
                                                className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-[#FFB343] hover:text-slate-900 transition-all disabled:opacity-20"
                                            >
                                                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                                            </button>
                                        </div>
                                    </form>
                                    <p className="text-center mt-3 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Powered by ProctorX Intelligent Core</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};
