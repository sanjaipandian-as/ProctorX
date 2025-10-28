import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Plus, Trash2, ArrowLeft, Save, Loader2, BookOpen, Home, LogOut,
    AlertCircle, CheckCircle
} from 'lucide-react';
import API from "../../Api";
import Logo from "../assets/LOGO.png";

const PlusIcon = () => <Plus className="h-5 w-5" />;
const TrashIcon = () => <Trash2 className="h-5 w-5" />;
const HomeIcon = () => <Home className="h-5 w-5" />;
const LogoutIcon = () => <LogOut className="h-5 w-5" />;

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-20 right-5 px-4 py-2 rounded-xl shadow-lg text-sm font-medium transition-all z-[100] ${type === "success"
            ? "bg-emerald-600/90 text-white"
            : "bg-red-600/90 text-white"
            }`}>
            {message}
            <button
                onClick={onClose}
                className="ml-3 text-lg font-bold leading-none align-middle"
            >&times;</button>
        </div>
    );
}

function CreateQuiz() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        allowedStudents: 0,
        questions: [{ questionText: "", options: ["", "", "", ""], correctAnswer: 0 }],
        status: "inactive",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => setToast({ message, type });
    const closeToast = () => setToast(null);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value
        });
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        if (field === 'correctAnswer') newQuestions[index][field] = Number(value);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) return showToast('Quiz title cannot be empty.', 'error');
        if (formData.questions.some(q => !q.questionText.trim())) return showToast('All questions must have text.', 'error');
        if (formData.questions.some(q => q.options.some(opt => !opt.trim()))) return showToast('All options must have text.', 'error');

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            const payload = {
                ...formData,
                questions: formData.questions.map(q => ({ ...q, correctAnswer: String(q.correctAnswer) }))
            };

            await API.post("/api/quizzes/create", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            showToast("Quiz created successfully!");
            setTimeout(() => navigate("/staff-dashboard"), 1500);

        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to create quiz";
            showToast(errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            {toast && <Toast {...toast} onClose={closeToast} />}


            <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-lg border-b border-white/10 shadow h-16 flex items-center px-2 justify-between">
                <div className="flex items-center gap-3">
                    <img src={Logo} alt="" className="h-15 w-15 text-cyan-400" />
                    <span className="text-xl font-bold text-white">ProctorX</span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/staff-dashboard')}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
                    >
                        <HomeIcon className="h-5 w-5 text-white" />
                    </button>

                    <button
                        onClick={() => alert('Logout clicked')}
                        className="p-2 rounded-lg bg-red-900/40 hover:bg-red-900/70"
                    >
                        <LogoutIcon className="h-5 w-5 text-red-400" />
                    </button>
                </div>
            </header>



            <main className="flex-1 p-5 md:p-10 pt-34">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <h1 className="text-3xl font-bold">Create Quiz</h1>


                    <div className="bg-gray-900 p-5 rounded-xl space-y-6 border border-gray-800">
                        <div>
                            <label className="text-gray-400">Quiz Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full mt-1 p-3 rounded bg-gray-800 border border-gray-700 focus:border-cyan-400"
                                placeholder="Enter quiz title"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-gray-400">Allowed Students</label>
                            <input
                                type="number"
                                name="allowedStudents"
                                value={formData.allowedStudents}
                                onChange={handleChange}
                                className="w-full mt-1 p-3 rounded bg-gray-800 border border-gray-700 focus:border-cyan-400"
                                min={0}
                            />
                        </div>
                    </div>


                    <div className="space-y-6">
                        {formData.questions.map((q, qIndex) => (
                            <div key={qIndex} className="bg-gray-900 p-5 rounded-lg border border-gray-800 space-y-4">
                                <textarea
                                    rows={3}
                                    placeholder="Question text..."
                                    value={q.questionText}
                                    onChange={(e) =>
                                        handleQuestionChange(qIndex, 'questionText', e.target.value)
                                    }
                                    className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {q.options.map((opt, optIndex) => (
                                        <input
                                            key={optIndex}
                                            value={opt}
                                            onChange={(e) =>
                                                handleOptionChange(qIndex, optIndex, e.target.value)
                                            }
                                            placeholder={`Option ${optIndex + 1}`}
                                            className="p-3 rounded bg-gray-800 border border-gray-700"
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-5 text-sm">
                                    {q.options.map((_, optIndex) => (
                                        <label key={optIndex} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`correct-${qIndex}`}
                                                value={optIndex}
                                                checked={q.correctAnswer === optIndex}
                                                onChange={(e) =>
                                                    handleQuestionChange(qIndex, "correctAnswer", Number(e.target.value))
                                                }
                                            />
                                            Option {optIndex + 1}
                                        </label>
                                    ))}
                                </div>

                                {formData.questions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(qIndex)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <TrashIcon />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addQuestion}
                        className="w-full p-3 rounded-md bg-cyan-900 text-cyan-300 hover:bg-cyan-800 flex items-center justify-center gap-2"
                    >
                        <PlusIcon /> Add Question
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full p-4 rounded-md bg-cyan-400 text-black font-semibold hover:bg-cyan-300 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <CheckCircle />
                        )}
                        {isSubmitting ? "Creating..." : "Create Quiz"}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default CreateQuiz;
