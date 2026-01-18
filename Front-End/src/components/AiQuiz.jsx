import React, { useState, useContext } from "react";
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
    Download
} from "lucide-react";
import API from "../../Api";
import { AuthContext } from "../context/AuthContext";
import Logo from "../assets/LOGO.png";

function Toast({ message, type, onClose }) {
    React.useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div
            className={`fixed top-20 right-5 z-[100] px-4 py-2 rounded-xl shadow text-sm font-medium ${type === "success" ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"
                }`}
        >
            {message}
            <button onClick={onClose} className="ml-3 text-lg font-bold">
                ×
            </button>
        </div>
    );
}

// Parser function to extract structured sections from AI output
function parseAIQuiz(rawText) {
    const sections = {
        metadata: null,
        mcqs: [],
        descriptive: [],
        programming: []
    };

    try {
        // Extract QUIZ_METADATA
        const metadataMatch = rawText.match(/\[QUIZ_METADATA\]([\s\S]*?)(?=\[|$)/);
        if (metadataMatch) {
            const metaText = metadataMatch[1].trim();
            const subject = metaText.match(/Subject:\s*(.+)/)?.[1]?.trim();
            const totalQuestions = metaText.match(/Total Questions:\s*(.+)/)?.[1]?.trim();
            const difficulty = metaText.match(/Difficulty:\s*(.+)/)?.[1]?.trim();
            const type = metaText.match(/Type:\s*(.+)/)?.[1]?.trim();
            sections.metadata = { subject, totalQuestions, difficulty, type };
        }

        // Extract MCQ_SECTION
        const mcqMatch = rawText.match(/\[MCQ_SECTION\]([\s\S]*?)(?=\[DESCRIPTIVE_SECTION\]|\[PROGRAMMING_SECTION\]|$)/);
        if (mcqMatch) {
            const mcqText = mcqMatch[1];
            const questionBlocks = mcqText.split(/Q\d+\./g).filter(q => q.trim());

            questionBlocks.forEach(block => {
                const lines = block.trim().split('\n').filter(l => l.trim());
                if (lines.length === 0) return;

                const questionText = lines[0].trim();
                const options = [];
                let correctOption = '';
                let explanation = '';

                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed.match(/^[A-D]\./)) {
                        options.push(trimmed.substring(2).trim());
                    } else if (trimmed.startsWith('Correct Option:')) {
                        correctOption = trimmed.replace('Correct Option:', '').trim();
                    } else if (trimmed.startsWith('Explanation:')) {
                        explanation = trimmed.replace('Explanation:', '').trim();
                    }
                });

                if (questionText && options.length === 4) {
                    sections.mcqs.push({ questionText, options, correctOption, explanation });
                }
            });
        }

        // Extract DESCRIPTIVE_SECTION
        const descMatch = rawText.match(/\[DESCRIPTIVE_SECTION\]([\s\S]*?)(?=\[PROGRAMMING_SECTION\]|$)/);
        if (descMatch) {
            const descText = descMatch[1];
            const questionBlocks = descText.split(/Q\d+\./g).filter(q => q.trim());

            questionBlocks.forEach(block => {
                const lines = block.trim().split('\n').filter(l => l.trim());
                if (lines.length === 0) return;

                const questionText = lines[0].trim();
                let expectedAnswer = '';

                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('Expected Answer:')) {
                        expectedAnswer = trimmed.replace('Expected Answer:', '').trim();
                    }
                });

                if (questionText) {
                    sections.descriptive.push({ questionText, expectedAnswer });
                }
            });
        }

        // Extract PROGRAMMING_SECTION
        const progMatch = rawText.match(/\[PROGRAMMING_SECTION\]([\s\S]*?)$/);
        if (progMatch) {
            const progText = progMatch[1];
            const questionBlocks = progText.split(/Q\d+\./g).filter(q => q.trim());

            questionBlocks.forEach(block => {
                const lines = block.trim().split('\n');
                if (lines.length === 0) return;

                const questionText = lines[0].trim();
                let language = '';
                let constraints = '';
                let sampleInput = '';
                let sampleOutput = '';
                const testCases = [];

                let currentSection = '';
                let tempInput = '';

                lines.forEach(line => {
                    const trimmed = line.trim();

                    if (trimmed.startsWith('Language:')) {
                        language = trimmed.replace('Language:', '').trim();
                    } else if (trimmed.startsWith('Constraints:')) {
                        constraints = trimmed.replace('Constraints:', '').trim();
                    } else if (trimmed === 'Sample Input:') {
                        currentSection = 'sampleInput';
                    } else if (trimmed === 'Sample Output:') {
                        currentSection = 'sampleOutput';
                    } else if (trimmed === 'Test Cases:') {
                        currentSection = 'testCases';
                    } else if (trimmed.includes('Input:') && trimmed.includes('Output:')) {
                        // Handle same-line format: Input: {val} Output: {val}
                        const inputMatch = trimmed.match(/Input:\s*(.+?)\s*Output:/);
                        const outputMatch = trimmed.match(/Output:\s*(.+)$/);
                        if (inputMatch && outputMatch) {
                            testCases.push({ input: inputMatch[1].trim(), output: outputMatch[1].trim() });
                        }
                    } else if (trimmed.startsWith('Input:')) {
                        tempInput = trimmed.replace('Input:', '').trim();
                    } else if (trimmed.startsWith('Output:')) {
                        const output = trimmed.replace('Output:', '').trim();
                        if (tempInput) {
                            testCases.push({ input: tempInput, output });
                            tempInput = '';
                        }
                    } else if (currentSection === 'sampleInput' && trimmed) {
                        sampleInput += (sampleInput ? '\n' : '') + trimmed;
                    } else if (currentSection === 'sampleOutput' && trimmed) {
                        sampleOutput += (sampleOutput ? '\n' : '') + trimmed;
                    }
                });

                if (questionText) {
                    sections.programming.push({
                        questionText,
                        language,
                        constraints,
                        sampleInput,
                        sampleOutput,
                        testCases
                    });
                }
            });
        }
    } catch (error) {
        console.error("Error parsing AI quiz:", error);
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
    const [toast, setToast] = useState(null);
    const [copiedSection, setCopiedSection] = useState(null);
    const [history, setHistory] = useState([]);
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);

    const showToast = (msg, type = "success") => setToast({ message: msg, type });
    const closeToast = () => setToast(null);

    // Load history on mount
    React.useEffect(() => {
        const savedHistory = localStorage.getItem("proctorx_ai_chats");
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (err) {
                console.error("Failed to parse history:", err);
            }
        }
    }, []);

    const saveToHistory = (text) => {
        const newHistory = [...history, {
            id: Date.now(),
            name: `New Chat ${history.length + 1}`,
            text: text,
            date: new Date().toISOString()
        }];
        setHistory(newHistory);
        localStorage.setItem("proctorx_ai_chats", JSON.stringify(newHistory));
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        showToast("Logged out.");
        setTimeout(() => navigate("/login"), 1000);
    };

    const generateQuiz = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) {
            showToast("Please enter a prompt", "error");
            return;
        }

        setIsGenerating(true);
        setGeneratedQuiz(null);
        setRawOutput("");

        try {
            // No authentication required for testing
            const response = await API.post(
                "/api/ai/generate-quiz",
                { prompt }
            );

            const aiText = response.data.text;
            setRawOutput(aiText);

            // Parse the structured output
            const parsedQuiz = parseAIQuiz(aiText);
            setGeneratedQuiz(parsedQuiz);
            saveToHistory(aiText);
            showToast("Quiz generated successfully!", "success");
        } catch (error) {
            console.error("Error generating quiz:", error);
            showToast("Failed to generate quiz. Please try again.", "error");
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

            showToast(`Quiz created! ID: ${response.data.quizId}`, "success");
        } catch (error) {
            console.error("Error creating quiz:", error);
            showToast(error.response?.data?.message || "Failed to create quiz", "error");
        } finally {
            setIsCreatingQuiz(false);
        }
    };

    const copyToClipboard = (text, section) => {
        navigator.clipboard.writeText(text);
        setCopiedSection(section);
        showToast("Copied to clipboard!", "success");
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
        showToast("Quiz downloaded!", "success");
    };

    const loadFromHistory = (chat) => {
        setRawOutput(chat.text);
        setGeneratedQuiz(parseAIQuiz(chat.text));
        showToast(`Loaded ${chat.name}`, "success");
    };

    const examplePrompts = [
        "Generate 5 MCQs on JavaScript arrays with medium difficulty",
        "Create a full test with 10 MCQs, 3 descriptive questions, and 2 programming problems on Python basics",
        "Generate 8 hard difficulty MCQs on React Hooks and state management",
        "Create a mixed quiz on Data Structures with 5 MCQs and 1 coding problem on Binary Trees"
    ];

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-lg border-b border-white/10 h-16 flex items-center px-6 justify-between">
                <div className="flex items-center gap-3">
                    <img src={Logo} alt="logo" className="h-10 w-10" />
                    <span className="text-xl font-bold">ProctorX AI</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 hidden sm:block">
                        {user ? `${user.name} (${user.role})` : "Guest"}
                    </span>
                    <button
                        onClick={() => navigate(user?.role === "teacher" ? "/staff-dashboard" : "/student-profile")}
                        className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition"
                    >
                        <Home className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded bg-red-900/40 hover:bg-red-900/60 transition"
                    >
                        <LogOut className="h-5 w-5 text-red-400" />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 pt-16">
                {/* Sidebar - History */}
                <aside className="w-64 bg-white/5 border-r border-white/10 overflow-y-auto hidden lg:flex flex-col p-4 gap-4">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-4 w-4" /> History
                    </h2>
                    <div className="space-y-2">
                        {history.length === 0 ? (
                            <p className="text-xs text-gray-500 italic">No previous chats</p>
                        ) : (
                            history.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => loadFromHistory(chat)}
                                    className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition group relative"
                                >
                                    <p className="text-sm font-medium truncate">{chat.name}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(chat.date).toLocaleDateString()}</p>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Scrollable Area */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto w-full">
                        {/* Title Section */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <Sparkles className="h-10 w-10 text-cyan-400" />
                                <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                    AI Quiz Generator
                                </h1>
                            </div>
                            <p className="text-gray-400 text-lg">
                                Generate professional quizzes instantly using AI - MCQs, Descriptive & Programming Questions
                            </p>
                        </div>

                        {/* Input Section */}
                        <div className="bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-2xl border border-white/20 mb-8 shadow-2xl">
                            <form onSubmit={generateQuiz} className="space-y-6">
                                <div>
                                    <label className="text-sm text-gray-300 block mb-2 font-semibold">
                                        Describe the quiz you want to generate
                                    </label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        rows={4}
                                        className="w-full p-4 bg-black/40 border border-white/20 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition resize-none"
                                        placeholder="Example: Generate 5 MCQs on JavaScript arrays with medium difficulty..."
                                        disabled={isGenerating}
                                    />
                                </div>

                                {/* Example Prompts */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-2">Quick examples:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {examplePrompts.map((example, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setPrompt(example)}
                                                className="text-left text-xs p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition"
                                                disabled={isGenerating}
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isGenerating || !prompt.trim()}
                                    className="w-full p-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold rounded-xl flex items-center justify-center gap-3 transition shadow-lg disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                            Generating Quiz...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-6 w-6" />
                                            Generate Quiz
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Generated Quiz Display */}
                        {generatedQuiz && (
                            <div className="space-y-6">
                                {/* Action Buttons */}
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold">Generated Quiz</h2>
                                    <div className="flex gap-3">
                                        {user?.role === "teacher" && (
                                            <button
                                                onClick={handleCreateQuiz}
                                                disabled={isCreatingQuiz}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 rounded-lg flex items-center gap-2 transition"
                                            >
                                                {isCreatingQuiz ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4" />
                                                )}
                                                Create Quiz
                                            </button>
                                        )}
                                        <button
                                            onClick={downloadQuiz}
                                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center gap-2 transition"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download
                                        </button>
                                    </div>
                                </div>

                                {/* Metadata Section */}
                                {generatedQuiz.metadata && (
                                    <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-6 rounded-xl border border-cyan-500/30">
                                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-cyan-400" />
                                            Quiz Information
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-400">Subject</p>
                                                <p className="text-lg font-semibold text-cyan-300">
                                                    {generatedQuiz.metadata.subject || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">Total Questions</p>
                                                <p className="text-lg font-semibold text-cyan-300">
                                                    {generatedQuiz.metadata.totalQuestions || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">Difficulty</p>
                                                <p className="text-lg font-semibold text-cyan-300">
                                                    {generatedQuiz.metadata.difficulty || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">Type</p>
                                                <p className="text-lg font-semibold text-cyan-300">
                                                    {generatedQuiz.metadata.type || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* MCQ Section */}
                                {generatedQuiz.mcqs.length > 0 && (
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                                                Multiple Choice Questions ({generatedQuiz.mcqs.length})
                                            </h3>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(
                                                        generatedQuiz.mcqs
                                                            .map(
                                                                (q, i) =>
                                                                    `Q${i + 1}. ${q.questionText}\nA. ${q.options[0]}\nB. ${q.options[1]}\nC. ${q.options[2]}\nD. ${q.options[3]}\nCorrect: ${q.correctOption}\nExplanation: ${q.explanation}\n`
                                                            )
                                                            .join("\n"),
                                                        "mcq"
                                                    )
                                                }
                                                className="p-2 hover:bg-white/10 rounded-lg transition"
                                            >
                                                {copiedSection === "mcq" ? (
                                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                                ) : (
                                                    <Copy className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="space-y-6">
                                            {generatedQuiz.mcqs.map((mcq, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-black/40 p-5 rounded-lg border border-white/10"
                                                >
                                                    <p className="font-semibold text-lg mb-3">
                                                        <span className="text-cyan-400">Q{idx + 1}.</span> {mcq.questionText}
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                        {mcq.options.map((option, optIdx) => (
                                                            <div
                                                                key={optIdx}
                                                                className={`p-3 rounded-lg border ${mcq.correctOption === String.fromCharCode(65 + optIdx)
                                                                    ? "bg-emerald-900/30 border-emerald-500/50"
                                                                    : "bg-white/5 border-white/10"
                                                                    }`}
                                                            >
                                                                <span className="font-bold text-cyan-300">
                                                                    {String.fromCharCode(65 + optIdx)}.
                                                                </span>{" "}
                                                                {option}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-start gap-2 text-sm">
                                                        <AlertCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <span className="font-semibold text-emerald-400">
                                                                Correct Answer: {mcq.correctOption}
                                                            </span>
                                                            {mcq.explanation && (
                                                                <p className="text-gray-400 mt-1">{mcq.explanation}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Descriptive Section */}
                                {generatedQuiz.descriptive.length > 0 && (
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-purple-400" />
                                                Descriptive Questions ({generatedQuiz.descriptive.length})
                                            </h3>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(
                                                        generatedQuiz.descriptive
                                                            .map(
                                                                (q, i) =>
                                                                    `Q${i + 1}. ${q.questionText}\nExpected Answer: ${q.expectedAnswer}\n`
                                                            )
                                                            .join("\n"),
                                                        "descriptive"
                                                    )
                                                }
                                                className="p-2 hover:bg-white/10 rounded-lg transition"
                                            >
                                                {copiedSection === "descriptive" ? (
                                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                                ) : (
                                                    <Copy className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {generatedQuiz.descriptive.map((desc, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-black/40 p-5 rounded-lg border border-white/10"
                                                >
                                                    <p className="font-semibold text-lg mb-3">
                                                        <span className="text-purple-400">Q{idx + 1}.</span> {desc.questionText}
                                                    </p>
                                                    {desc.expectedAnswer && (
                                                        <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                                                            <p className="text-xs text-purple-300 font-semibold mb-1">
                                                                Expected Answer:
                                                            </p>
                                                            <p className="text-gray-300">{desc.expectedAnswer}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Programming Section */}
                                {generatedQuiz.programming.length > 0 && (
                                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <Code className="h-5 w-5 text-orange-400" />
                                                Programming Questions ({generatedQuiz.programming.length})
                                            </h3>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(
                                                        generatedQuiz.programming
                                                            .map(
                                                                (q, i) =>
                                                                    `Q${i + 1}. ${q.questionText}\nLanguage: ${q.language}\nConstraints: ${q.constraints}\nSample Input:\n${q.sampleInput}\nSample Output:\n${q.sampleOutput}\nTest Cases:\n${q.testCases.map((tc, j) => `${j + 1}. Input: ${tc.input} | Output: ${tc.output}`).join("\n")}\n`
                                                            )
                                                            .join("\n"),
                                                        "programming"
                                                    )
                                                }
                                                className="p-2 hover:bg-white/10 rounded-lg transition"
                                            >
                                                {copiedSection === "programming" ? (
                                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                                ) : (
                                                    <Copy className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="space-y-6">
                                            {generatedQuiz.programming.map((prog, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-black/40 p-5 rounded-lg border border-white/10"
                                                >
                                                    <p className="font-semibold text-lg mb-3">
                                                        <span className="text-orange-400">Q{idx + 1}.</span> {prog.questionText}
                                                    </p>

                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-500/30">
                                                            <p className="text-xs text-orange-300 font-semibold">Language</p>
                                                            <p className="text-white">{prog.language}</p>
                                                        </div>
                                                        <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-500/30">
                                                            <p className="text-xs text-orange-300 font-semibold">Constraints</p>
                                                            <p className="text-white text-sm">{prog.constraints}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                                            <p className="text-xs text-gray-400 font-semibold mb-2">Sample Input</p>
                                                            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                                                {prog.sampleInput}
                                                            </pre>
                                                        </div>
                                                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                                            <p className="text-xs text-gray-400 font-semibold mb-2">Sample Output</p>
                                                            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                                                {prog.sampleOutput}
                                                            </pre>
                                                        </div>
                                                    </div>

                                                    {prog.testCases.length > 0 && (
                                                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                                            <p className="text-xs text-gray-400 font-semibold mb-3">
                                                                Test Cases ({prog.testCases.length})
                                                            </p>
                                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                {prog.testCases.map((tc, tcIdx) => (
                                                                    <div
                                                                        key={tcIdx}
                                                                        className="grid grid-cols-2 gap-3 p-3 bg-black/40 rounded border border-white/5"
                                                                    >
                                                                        <div>
                                                                            <p className="text-xs text-cyan-400 mb-1">Input {tcIdx + 1}</p>
                                                                            <pre className="text-xs text-gray-300 font-mono">
                                                                                {tc.input}
                                                                            </pre>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-emerald-400 mb-1">Output {tcIdx + 1}</p>
                                                                            <pre className="text-xs text-gray-300 font-mono">
                                                                                {tc.output}
                                                                            </pre>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No content warning */}
                                {generatedQuiz.mcqs.length === 0 &&
                                    generatedQuiz.descriptive.length === 0 &&
                                    generatedQuiz.programming.length === 0 && (
                                        <div className="bg-yellow-900/20 p-6 rounded-xl border border-yellow-500/30 text-center">
                                            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
                                            <p className="text-yellow-300 font-semibold">
                                                No structured quiz content was generated. Please try a different prompt.
                                            </p>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
