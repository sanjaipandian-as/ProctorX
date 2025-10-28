import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus, Trash2, ArrowLeft, Save, Loader2, BookOpen, Home, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import API from "../../Api";

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

function CreateQuiz() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        allowedStudents: 0,
        questions: [{ questionText: "", options: ["", "", "", ""], correctAnswer: 0 }],
        status: "inactive",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
    };

    const closeToast = () => {
        setToast(null);
    };

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
        if (field === 'correctAnswer') {
            newQuestions[index][field] = Number(value);
        }
        setFormData({ ...formData, questions: newQuestions });
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        const newQuestions = [...formData.questions];
        if (!newQuestions[qIndex].options) {
            newQuestions[qIndex].options = ['', '', '', ''];
        }
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
        if (formData.questions.length <= 1) {
            showToast("A quiz must have at least one question.", "error");
            return;
        }
        const newQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData({ ...formData, questions: newQuestions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) {
            showToast('Quiz title cannot be empty.', 'error');
            return;
        }
        if (formData.questions.length === 0) {
            showToast('Quiz must have at least one question.', 'error');
            return;
        }
        if (formData.questions.some(q => !q.questionText.trim())) {
            showToast('All questions must have text.', 'error');
            return;
        }
        if (formData.questions.some(q => q.options.some(opt => !opt.trim()))) {
            showToast('All options must have text.', 'error');
            return;
        }
        if (formData.questions.some(q => q.correctAnswer === null || q.correctAnswer < 0 || q.correctAnswer > 3)) {
            showToast('Please select a valid correct answer for every question.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");

            const payload = {
                ...formData,
                questions: formData.questions.map(q => ({
                    ...q,
                    correctAnswer: String(q.correctAnswer)
                }))
            };

            await API.post("/api/quizzes/create", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            showToast("Quiz created successfully!");
            setTimeout(() => navigate("/staff-dashboard"), 1500);
        } catch (err) {
            console.error("Error creating quiz:", err.response?.data || err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to create quiz";
            setError(errorMsg);
            showToast(errorMsg, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-white/10 backdrop-blur-md border-b border-white/10 shadow-md h-16">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-blue-400" />
                    <span className="text-xl font-bold text-white">ProctorX</span>
                    <span className="text-xl font-light text-gray-500">/</span>
                    <span className="text-lg text-gray-300">Create Quiz</span>
                </div>
                <nav className="flex items-center gap-4">
                    <button onClick={() => navigate('/staff-dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition text-sm font-medium border border-[#4A4A4A]">
                        <HomeIcon />
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={() => { alert("Logout clicked"); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-800/30 border border-red-700 hover:bg-red-800/50 transition text-sm font-medium text-red-400"
                    >
                        <LogoutIcon />
                        <span>Logout</span>
                    </button>
                </nav>
            </header>

            <main className="flex-1 p-6 md:p-10 pt-20 md:pt-24 overflow-y-auto">
                <form onSubmit={handleSubmit} className="">
                    <header className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                        <h1 className="text-3xl font-bold text-white">Create New Quiz</h1>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => navigate('/staff-dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition text-sm font-medium border border-[#4A4A4A]">
                                <ArrowLeft className="h-4 w-4" /> Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00E1F9] text-black hover:bg-[#00B0CC] transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                {isSubmitting ? 'Creating...' : 'Create Quiz'}
                            </button>
                        </div>
                    </header>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-lg mb-8 shadow-md">
                        <h2 className="text-xl font-semibold text-white mb-5">Quiz Details</h2>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">Quiz Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    placeholder="Enter quiz title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-md px-4 py-2 text-gray-200 focus:ring-1 focus:ring-[#00E1F9] focus:border-[#00E1F9] placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="allowedStudents" className="block text-sm font-medium text-gray-400 mb-1">Allowed Students (0 for unlimited)</label>
                                <input
                                    type="number"
                                    id="allowedStudents"
                                    name="allowedStudents"
                                    placeholder="Enter number of students"
                                    value={formData.allowedStudents}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-md px-4 py-2 text-gray-200 focus:ring-1 focus:ring-[#00E1F9] focus:border-[#00E1F9] placeholder-gray-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="quizStatus" className="block text-sm font-medium text-gray-400 mb-1">Initial Status</label>
                                <select
                                    id="quizStatus"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
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
                            {formData.questions.map((q, qIndex) => (
                                <div key={qIndex} className="bg-[#0A0A0A] p-5 rounded-lg border border-[#2A2A2A]">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-base font-medium text-gray-300">Question {qIndex + 1}</label>
                                        {formData.questions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeQuestion(qIndex)}
                                                className="text-red-500 hover:text-red-400 p-1.5 rounded-md bg-red-900/40 hover:bg-red-900/70 transition"
                                                title="Delete Question"
                                            >
                                                <TrashIcon />
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        value={q.questionText}
                                        onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                                        placeholder="Enter the question text..."
                                        rows={3}
                                        required
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
                                                    required
                                                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-md px-3 py-2 text-gray-200 focus:ring-1 focus:ring-[#00E1F9] focus:border-[#00E1F9] placeholder-gray-500"
                                                    placeholder={`Option ${oIndex + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Correct Answer</label>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                                            {q.options.map((opt, optIndex) => (
                                                <label key={optIndex} className="flex items-center space-x-2 text-gray-300 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`correct-answer-${qIndex}`}
                                                        value={optIndex}
                                                        checked={q.correctAnswer === optIndex}
                                                        onChange={(e) =>
                                                            handleQuestionChange(qIndex, "correctAnswer", parseInt(e.target.value, 10))
                                                        }
                                                        required
                                                        className="form-radio h-4 w-4 text-[#00E1F9] bg-[#0A0A0A] border-[#2A2A2A] focus:ring-offset-0 focus:ring-1 focus:ring-[#00E1F9]"
                                                    />
                                                    <span>Option {optIndex + 1}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="mt-6 w-full flex items-center justify-center gap-2 bg-[#00333A] hover:bg-[#00444A] text-[#00E1F9] font-semibold py-3 px-4 rounded-lg transition border border-[#00555A]"
                        >
                            <PlusIcon /> Add Question
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#00E1F9] text-black hover:bg-[#00B0CC] transition text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                        {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
                    </button>

                </form>
            </main>
        </div>
    );
}

export default CreateQuiz;