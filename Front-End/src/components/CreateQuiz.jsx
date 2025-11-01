import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Trash2,
    Home,
    LogOut,
    Upload,
    Download,
    HelpCircle,
    Loader2,
    CheckCircle,
} from "lucide-react";
import API from "../../Api";
import Logo from "../assets/LOGO.png";

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={`fixed top-20 right-5 z-[100] transform-gpu px-4 py-2 rounded-xl shadow-lg text-sm font-medium transition-all ${type === "success"
                ? "bg-emerald-600/90 text-white"
                : "bg-red-600/90 text-white"
                }`}
        >
            {message}
            <button
                onClick={onClose}
                className="ml-3 text-lg font-bold leading-none align-middle"
            >
                &times;
            </button>
        </div>
    );
}

function HelpModal({ onClose, content }) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-lg max-w-2xl w-full m-4">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-cyan-500" />
                        CSV Formatting Help
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl font-bold"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-5 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-gray-300 mb-4">
                        If you have questions in another format (like a Word doc or text
                        file), you can use an AI assistant (like Gemini or ChatGPT) to format
                        it correctly.
                        <br />
                        <br />
                        Just **copy the prompt below**, paste it into the AI chat, and then
                        paste your own quiz questions right after it. The AI will provide
                        the CSV data for you to save and upload.
                    </p>
                    <pre className="bg-gray-800 p-4 rounded-md text-gray-200 text-sm whitespace-pre-wrap font-mono">
                        {content}
                    </pre>
                </div>
                <div className="p-4 bg-gray-800/50 border-t border-gray-700 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-cyan-600 text-white font-semibold hover:bg-cyan-500"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}

const helpPromptText = `Rules: - Use headers: questionText,option1,option2,option3,option4,correctAnswerIndex - 
Every row must have exactly 6 columns 
- Put all text in double quotes 
- Fix commas or quotes inside text 
- The correctAnswerIndex should be a number (0–3) 
- No missing or extra commas.  
- Dont use "," in the option for that use "-". Give me this as a downloadble file`;

function CreateQuiz() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        allowedStudents: 0,
        questions: [
            { questionText: "", options: ["", "", "", ""], correctAnswer: 0 },
        ],
        status: "inactive",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [toast, setToast] = useState(null);
    const [showHelpModal, setShowHelpModal] = useState(false);

    const showToast = (message, type = "success") => setToast({ message, type });
    const closeToast = () => setToast(null);

    const handleLogout = () => {
        localStorage.removeItem("token");
        showToast("Logged out successfully.", "success");
        setTimeout(() => navigate("/login"), 1000);
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === "number" ? parseInt(value, 10) || 0 : value,
        });
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        if (field === "correctAnswer") newQuestions[index][field] = Number(value);
        setFormData({ ...formData, questions: newQuestions });
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[qIndex].options[optIndex] = value;
        setFormData({ ...formData, questions: newQuestions });
    };

    const addQuestion = () => {
        setFormData({
            ...formData,
            questions: [
                ...formData.questions,
                { questionText: "", options: ["", "", "", ""], correctAnswer: 0 },
            ],
        });
    };

    const removeQuestion = (index) => {
        if (formData.questions.length <= 1)
            return showToast("A quiz must have at least one question.", "error");
        setFormData({
            ...formData,
            questions: formData.questions.filter((_, i) => i !== index),
        });
    };

    const downloadTemplate = () => {
        const header =
            '"questionText","option1","option2","option3","option4","correctAnswerIndex"\n';
        const example =
            '"What is 2 + 2?","3","4","5","6",1\n"What is the capital of France?","London","Berlin","Paris","Madrid",2\n';
        const csvContent = "data:text/csv;charset=utf-8," + header + example;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "quiz_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== "text/csv") {
            showToast("Invalid file type. Please upload a .csv file.", "error");
            return;
        }

        setIsParsing(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                const lines = csvText.split("\n").filter((line) => line.trim() !== "");

                if (lines.length <= 1) {
                    throw new Error("CSV file is empty or missing headers.");
                }

                const headers = lines[0]
                    .split(",")
                    .map((h) => h.trim().replace(/"/g, ""));
                const expectedHeaders = [
                    "questionText",
                    "option1",
                    "option2",
                    "option3",
                    "option4",
                    "correctAnswerIndex",
                ];

                if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
                    console.error("Invalid headers:", headers);
                    throw new Error(
                        "CSV headers are incorrect. Please use the template."
                    );
                }

                const newQuestions = [];
                for (let i = 1; i < lines.length; i++) {
                    const columns = lines[i].split(",");

                    if (columns.length !== 6) {
                        throw new Error(
                            `Error on line ${i + 1}: Each row must have exactly 6 columns.`
                        );
                    }

                    const [questionText, o1, o2, o3, o4, correctIndexStr] = columns.map(
                        (c) => c.trim().replace(/"/g, "")
                    );

                    if (!questionText || !o1 || !o2 || !o3 || !o4 || !correctIndexStr) {
                        throw new Error(`Error on line ${i + 1}: All fields are required.`);
                    }

                    const correctAnswer = parseInt(correctIndexStr, 10);
                    if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
                        throw new Error(
                            `Error on line ${i + 1
                            }: Correct Answer Index must be a number between 0 and 3.`
                        );
                    }

                    newQuestions.push({
                        questionText,
                        options: [o1, o2, o3, o4],
                        correctAnswer,
                    });
                }

                if (newQuestions.length > 0) {
                    setFormData({ ...formData, questions: newQuestions });
                    showToast(
                        `Successfully imported ${newQuestions.length} questions!`,
                        "success"
                    );
                } else {
                    throw new Error("No valid questions found in the file.");
                }
            } catch (err) {
                showToast(err.message, "error");
            } finally {
                setIsParsing(false);
                event.target.value = null;
            }
        };

        reader.onerror = () => {
            showToast("Failed to read the file.", "error");
            setIsParsing(false);
        };

        reader.readAsText(file);
    };

    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.title.trim())
            return showToast("Quiz title cannot be empty.", "error");
        if (formData.questions.some((q) => !q.questionText.trim()))
            return showToast("All questions must have text.", "error");
        if (formData.questions.some((q) => q.options.some((opt) => !opt.trim())))
            return showToast("All options must have text.", "error");

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                showToast("Authentication error. Please log in again.", "error");
                return navigate("/login");
            }

            const payload = {
                ...formData,
                questions: formData.questions.map((q) => ({
                    ...q,
                    correctAnswer: String(q.correctAnswer),
                })),
            };

            await API.post("/api/quizzes/create", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            showToast("Quiz created successfully!");
            setTimeout(() => navigate("/staff-dashboard"), 1500);
        } catch (err) {
            const errorMsg =
                err.response?.data?.message || err.message || "Failed to create quiz";
            showToast(errorMsg, "error");
            if (err.response?.status === 401 || err.response?.status === 403) {
                setTimeout(() => navigate("/login"), 1500);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            {toast && <Toast {...toast} onClose={closeToast} />}
            {showHelpModal && (
                <HelpModal
                    content={helpPromptText}
                    onClose={() => setShowHelpModal(false)}
                />
            )}

            <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-lg border-b border-white/10 shadow h-16 flex items-center px-4 md:px-6 justify-between">
                <div className="flex items-center gap-3">
                    <img src={Logo} alt="ProctorX Logo" className="h-10 w-10" />
                    <span className="text-xl font-bold text-white">ProctorX</span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/staff-dashboard")}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                        aria-label="Dashboard"
                    >
                        <Home className="h-5 w-5 text-white" />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg bg-red-900/40 hover:bg-red-900/70 transition-colors"
                        aria-label="Log out"
                    >
                        <LogOut className="h-5 w-5 text-red-400" />
                    </button>
                </div>
            </header>

            <main className="flex-1 p-5 md:p-10 pt-20">
                <form onSubmit={handleSubmit} className="space-y-10 text-white">
                    <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mt-15">
                        Create Quiz
                    </h1>

                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl space-y-6">
                        <div>
                            <label htmlFor="title" className="text-sm font-medium text-gray-200">
                                Quiz Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full mt-2 p-3 rounded-lg bg-white/10 border border-white/20 focus:border-cyan-400 focus:ring-0 placeholder-gray-400 text-white"
                                placeholder="Enter quiz title"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="allowedStudents" className="text-sm font-medium text-gray-200">
                                Allowed Students (0 for unlimited)
                            </label>
                            <input
                                id="allowedStudents"
                                type="number"
                                name="allowedStudents"
                                value={formData.allowedStudents}
                                onChange={handleChange}
                                className="w-full mt-2 p-3 rounded-lg bg-white/10 border border-white/20 focus:border-cyan-400 focus:ring-0 placeholder-gray-400 text-white"
                                min={0}
                            />
                        </div>

                        <div className="border-t border-white/20 pt-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-base font-medium text-gray-100">
                                    Import Questions from CSV
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowHelpModal(true)}
                                    className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                                >
                                    <HelpCircle className="h-4 w-4" />
                                    Help
                                </button>
                            </div>

                            <p className="text-sm text-gray-200 bg-white/10 p-3 rounded-lg border border-white/20">
                                <strong>Have a Word/PDF?</strong> Download our template, open it in
                                Excel/Google Sheets, and copy your questions into the correct columns.
                                Then, save as a .csv and upload here. Click the <strong>Help</strong> button
                                for AI formatting assistance.
                            </p>

                            <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                                <li>This will <strong>replace</strong> all current questions.</li>
                                <li>The CSV file must use this exact 6-column format:</li>
                                <li className="pl-4">
                                    <code className="text-xs bg-white/10 border border-white/20 px-1 py-0.5 rounded">
                                        questionText,option1,option2,option3,option4,correctAnswerIndex
                                    </code>
                                </li>
                            </ul>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <label className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-br from-cyan-900/30 to-cyan-700/20 text-white hover:from-cyan-800/40 hover:to-cyan-600/30 border border-cyan-500/30 cursor-pointer flex items-center justify-center gap-2 transition-all">
                                    <Upload className="h-5 w-5" />
                                    {isParsing ? "Parsing..." : "Upload .csv File"}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        disabled={isParsing}
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={downloadTemplate}
                                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-700/30 text-white hover:from-gray-700/70 hover:to-gray-600/40 border border-white/20 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Download className="h-5 w-5" />
                                    Download Template
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-cyan-400">Questions</h2>
                        {formData.questions.map((q, qIndex) => (
                            <div
                                key={qIndex}
                                className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-lg space-y-4 relative transition-all hover:border-cyan-400/50"
                            >
                                <span className="absolute -top-3 -left-3 bg-cyan-500 text-black text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border border-black">
                                    {qIndex + 1}
                                </span>

                                <textarea
                                    rows={3}
                                    placeholder="Question text..."
                                    value={q.questionText}
                                    onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)}
                                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 focus:border-cyan-400 focus:ring-0 placeholder-gray-400 text-white"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {q.options.map((opt, optIndex) => (
                                        <div key={optIndex} className="relative">
                                            <input
                                                value={opt}
                                                onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                                placeholder={`Option ${optIndex + 1}`}
                                                className={`w-full p-3 pl-10 rounded-lg bg-white/10 border focus:ring-0 placeholder-gray-400 text-white ${q.correctAnswer === optIndex
                                                        ? "border-emerald-500"
                                                        : "border-white/20 focus:border-cyan-400"
                                                    }`}
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                {q.correctAnswer === optIndex ? (
                                                    <CheckCircle className="text-emerald-500" size={16} />
                                                ) : (
                                                    `${String.fromCharCode(65 + optIndex)}.`
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-200">
                                        <span className="font-medium text-white mr-2">Correct Answer:</span>
                                        {q.options.map((_, optIndex) => (
                                            <label
                                                key={optIndex}
                                                className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`correct-${qIndex}`}
                                                    value={optIndex}
                                                    checked={q.correctAnswer === optIndex}
                                                    onChange={(e) =>
                                                        handleQuestionChange(qIndex, "correctAnswer", Number(e.target.value))
                                                    }
                                                    className="h-4 w-4 accent-cyan-500 bg-gray-700 border-gray-600"
                                                />
                                                Option {String.fromCharCode(65 + optIndex)}
                                            </label>
                                        ))}
                                    </div>

                                    {formData.questions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(qIndex)}
                                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-900/30 flex items-center gap-2 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                            <span className="sm:hidden">Remove</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addQuestion}
                        className="w-full p-3 rounded-lg bg-gradient-to-r from-cyan-800/40 to-cyan-600/40 text-cyan-300 hover:from-cyan-700/60 hover:to-cyan-500/50 border border-cyan-500/30 flex items-center justify-center gap-2 transition-all"
                    >
                        <Plus className="h-5 w-5" /> Add Question
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full p-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-semibold hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 flex justify-center items-center gap-2 transition-all"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        {isSubmitting ? "Creating..." : "Create Quiz"}
                    </button>
                </form>

            </main>
        </div>
    );
}

export default CreateQuiz;