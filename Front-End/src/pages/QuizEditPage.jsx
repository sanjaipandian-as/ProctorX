import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, Loader2, BookOpen, Home, LogOut, AlertCircle } from 'lucide-react';
import API from '../../Api';

const PlusIcon = () => <Plus className="h-5 w-5" />;
const TrashIcon = () => <Trash2 className="h-5 w-5" />;
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>);
const LogoutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>);

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-20 right-5 px-4 py-2 rounded-xl shadow-lg text-sm font-medium transition-all z-[100] ${type === "success" ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"}`}>
            {message}
            <button onClick={onClose} className="ml-3 text-lg font-bold leading-none align-middle">&times;</button>
        </div>
    );
}

export default function EditQuizPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    const closeToast = () => {
        setToast(null);
    };

    useEffect(() => {
        const fetchQuiz = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Authentication token not found. Please log in again.");

                const { data } = await API.get(`/api/quizzes/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const questions = Array.isArray(data.questions) ? data.questions : [];

                const quizWithDefaults = {
                    ...data,
                    title: data.title || '',
                    status: data.status || 'inactive',
                    questions: questions.map(q => ({
                        ...q,
                        questionText: q.questionText || '',
                        options: Array.isArray(q.options)
                            ? [...q.options, '', '', '', ''].slice(0, 4)
                            : ['', '', '', ''],
                        correctAnswer: typeof q.correctAnswer !== 'undefined' && !isNaN(Number(q.correctAnswer)) && Number(q.correctAnswer) >= 0 && Number(q.correctAnswer) < 4
                            ? Number(q.correctAnswer)
                            : 0
                    }))
                };
                setQuiz(quizWithDefaults);
            } catch (err) {
                console.error("Fetch Quiz Error:", err);
                const errorMsg = err.response?.data?.message || err.message || "Failed to load quiz. Please check the ID or try again.";
                setError(errorMsg);
                showToast(errorMsg, "error");
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleQuizTitleChange = (e) => {
        setQuiz({ ...quiz, title: e.target.value });
    };

    const handleQuizStatusChange = (e) => {
        setQuiz({ ...quiz, status: e.target.value });
    };

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...quiz.questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setQuiz({ ...quiz, questions: updatedQuestions });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const updatedQuestions = [...quiz.questions];
        if (!updatedQuestions[qIndex].options) {
            updatedQuestions[qIndex].options = ['', '', '', ''];
        }
        updatedQuestions[qIndex].options[oIndex] = value;
        setQuiz({ ...quiz, questions: updatedQuestions });
    };

    const addQuestion = () => {
        const newQuestion = {
            questionText: '',
            options: ['', '', '', ''],
            correctAnswer: 0
        };
        const currentQuestions = Array.isArray(quiz.questions) ? quiz.questions : [];
        setQuiz({ ...quiz, questions: [...currentQuestions, newQuestion] });
    };

    const removeQuestion = (index) => {
        const updatedQuestions = quiz.questions.filter((_, i) => i !== index);
        setQuiz({ ...quiz, questions: updatedQuestions });
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setError('');
        if (!quiz.title.trim()) {
            showToast('Quiz title cannot be empty.', 'error');
            setIsSaving(false);
            return;
        }
        if (quiz.questions.some(q => !q.questionText.trim())) {
            showToast('All questions must have text.', 'error');
            setIsSaving(false);
            return;
        }
        if (quiz.questions.some(q => q.options.some(opt => !opt.trim()))) {
            showToast('All options must have text.', 'error');
            setIsSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            const payload = {
                ...quiz,
                questions: quiz.questions.map(q => ({
                    ...q,
                    correctAnswer: String(q.correctAnswer)
                }))
            };

            await API.put(`/api/quizzes/${quizId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Quiz updated successfully!');
            setTimeout(() => navigate('/staff-dashboard'), 1500);
        } catch (err) {
            console.error("Save Quiz Error:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to save changes. Please try again.';
            setError(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 md:px-6 bg-white/10 backdrop-blur-md border-b border-white/10 shadow-md h-16">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-blue-400" />
                    <span className="text-xl font-bold text-white">ProctorX</span>
                    <span className="hidden md:inline text-xl font-light text-gray-500">/</span>
                    <span className="hidden md:inline text-lg text-gray-300">Edit Quiz</span>
                </div>
                <nav className="flex items-center gap-2 md:gap-4">
                    <button onClick={() => navigate('/staff-dashboard')} className="flex items-center gap-2 px-3 py-2 md:px-4 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition text-sm font-medium border border-[#4A4A4A]">
                        <HomeIcon />
                        <span className="hidden md:inline">Dashboard</span>
                    </button>
                    <button
                        onClick={() => { alert("Logout clicked"); }}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 rounded-lg bg-red-800/30 border border-red-700 hover:bg-red-800/50 transition text-sm font-medium text-red-400"
                    >
                        <LogoutIcon />
                        <span className="hidden md:inline">Logout</span>
                    </button>
                </nav>
            </header>

            <main className="flex-1 p-4 md:p-10 pt-20 md:pt-24 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-[#00E1F9]" />
                    </div>
                ) : error && !quiz ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                        <p className="text-xl text-red-400">{error}</p>
                        <button onClick={() => navigate('/staff-dashboard')} className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition text-sm font-medium border border-[#4A4A4A]">
                            <ArrowLeft className="h-4 w-4" /> Go Back to Dashboard
                        </button>
                    </div>
                ) : quiz ? (
                    
                    <div className="max-w-4xl mx-auto">
                        <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                            <h1 className="text-3xl font-bold text-white">Edit Quiz</h1>
                            <div className="flex items-center gap-3">
                                <button onClick={() => navigate('/staff-dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition text-sm font-medium border border-[#4A4A4A]">
                                    <ArrowLeft className="h-4 w-4" /> Cancel
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00E1F9] text-black hover:bg-[#00B0CC] transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </header>

                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-lg mb-8 shadow-md">
                            <h2 className="text-xl font-semibold text-white mb-5">Quiz Details</h2>
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="quizTitle" className="block text-sm font-medium text-gray-400 mb-1">Quiz Title</label>
                                    <input
                                        type="text"
                                        id="quizTitle"
                                        value={quiz.title}
                                        onChange={handleQuizTitleChange}
                                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-md px-4 py-2 text-gray-200 focus:ring-1 focus:ring-[#00E1F9] focus:border-[#00E1F9] placeholder-gray-500"
                                        placeholder="Enter the title for your quiz"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="quizStatus" className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                                    <select
                                        id="quizStatus"
                                        value={quiz.status}
                                        onChange={handleQuizStatusChange}
                                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-md px-4 py-2 text-gray-200 focus:ring-1 focus:ring-[#00E1F9] focus:border-[#00E1F9]"
                                    >
                                        <option value="inactive">Inactive</option>
                                        <option value="active">Active</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold text-white mb-6">Questions</h2>
                            <div className="space-y-6">
                                {quiz.questions.map((q, qIndex) => (
                                    <div key={q._id || qIndex} className="bg-[#0A0A0A] p-5 rounded-lg border border-[#2A2A2A]">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="block text-base font-medium text-gray-300">Question {qIndex + 1}</label>
                                            <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-400 p-1.5 rounded-md bg-red-900/40 hover:bg-red-900/70 transition" title="Delete Question">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                        <textarea
                                            value={q.questionText}
                                            onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                            placeholder="Enter the question text..."
                                            rows={3}
                                            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-md px-4 py-2 mb-4 text-gray-200 focus:ring-1 focus:ring-[#00E1F9] focus:border-[#00E1F9] placeholder-gray-500 resize-none"
                                        />

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex}>
                                                    <label className="block text-xs font-medium text-gray-400 mb-1">Option {oIndex + 1}</label>
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-md px-3 py-2 text-gray-200 focus:ring-1 focus:ring-[#00E1F9] focus:border-[#00E1F9] placeholder-gray-500"
                                                        placeholder={`Option ${oIndex + 1}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Correct Answer</label>
                                            <select
                                                value={q.correctAnswer}
                                                onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', Number(e.target.value))}
                                                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-md px-3 py-2 text-gray-200 focus:ring-1 focus:ring-[#00E1F9] focus:border-[#00E1F9]"
                                            >
                                                {q.options.map((opt, oIndex) => (
                                                    <option key={oIndex} value={oIndex}>
                                                        {`Option ${oIndex + 1}${opt ? `: ${opt.substring(0, 30)}${opt.length > 30 ? '...' : ''}` : ''}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addQuestion}
                                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#00333A] hover:bg-[#00444A] text-[#00E1F9] font-semibold py-3 px-4 rounded-lg transition border border-[#00555A]"
                            >
                                <PlusIcon /> Add Question
                            </button>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}
