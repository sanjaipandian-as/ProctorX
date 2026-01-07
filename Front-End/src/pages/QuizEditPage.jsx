import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, Loader2, BookOpen, Home, LogOut, AlertCircle, Code, FileText, CheckSquare } from 'lucide-react';
import API from '../../Api';
import LOGO from "../assets/LOGO.png"; // Make sure you have this path correct

// --- Icons ---
const PlusIcon = () => <Plus className="h-5 w-5" />;
const TrashIcon = () => <Trash2 className="h-5 w-5" />;
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>);
const LogoutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>);

// --- Default Boilerplate Code ---
const defaultCode = {
    javascript: `// Javascript Starter Code
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');

function solve() {
    // Write your code here
    
}
solve();`,

    python: `# Python Starter Code
import sys

def solve():
    # Read input
    data = sys.stdin.read().split()
    # Write logic here

if __name__ == "__main__":
    solve()`,

    java: `// Java Starter Code
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your code here
        
    }
}`,

    cpp: `// C++ Starter Code
#include <cmath>
#include <cstdio>
#include <vector>
#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    // Enter your code below
    
    return 0;
}`
};

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
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
    
    // Only allowing these 4 languages
    const languages = ["javascript", "python", "java", "cpp"];

    const showToast = (message, type = "success") => setToast({ message, type });
    const closeToast = () => setToast(null);

    const handleLogout = () => {
        localStorage.removeItem("token");
        showToast("Logged out.");
        setTimeout(() => navigate("/login"), 1000);
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
                const normalized = {
                    ...data,
                    title: data.title || '',
                    status: data.status || 'inactive',
                    questions: questions.map(q => ({
                        _id: q._id,
                        questionType: q.questionType || 'mcq',
                        questionText: q.questionText || '',
                        marks: typeof q.marks === 'number' ? q.marks : (q.marks ? Number(q.marks) : 1),
                        options: Array.isArray(q.options) ? [...q.options].slice(0, 4).concat(Array(4 - Math.min(q.options.length,4)).fill('')).slice(0,4) : ['', '', '', ''],
                        correctAnswer: typeof q.correctAnswer !== 'undefined' && q.correctAnswer !== null && !isNaN(Number(q.correctAnswer)) ? Number(q.correctAnswer) : 0,
                        descriptiveAnswer: q.descriptiveAnswer || '',
                        // Ensure starterCode is an object with defaults if missing
                        starterCode: (q.starterCode && typeof q.starterCode === 'object') ? q.starterCode : { ...defaultCode },
                        // Ensure activeTab exists for UI state
                        activeTab: "javascript",
                        testcases: Array.isArray(q.testcases) ? (() => {
                            const t = q.testcases.slice(0, 8);
                            while (t.length < 8) t.push({ input: '', output: '' });
                            return t;
                        })() : Array.from({ length: 8 }, () => ({ input: '', output: '' })),
                    }))
                };
                setQuiz(normalized);
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.message || "Failed to load quiz. Please check the ID or try again.";
                setError(errorMsg);
                showToast(errorMsg, "error");
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleQuizTitleChange = (e) => setQuiz({ ...quiz, title: e.target.value });
    const handleQuizStatusChange = (e) => setQuiz({ ...quiz, status: e.target.value });

    const handleQuestionField = (index, field, value) => {
        const updated = [...quiz.questions];
        updated[index] = { ...updated[index], [field]: value };
        
        // Reset fields when changing type
        if (field === "questionType") {
            if (value === "coding") {
                if (!updated[index].starterCode || Object.keys(updated[index].starterCode).length === 0) {
                    updated[index].starterCode = { ...defaultCode };
                }
                if (!updated[index].activeTab) updated[index].activeTab = "javascript";
            }
        }

        setQuiz({ ...quiz, questions: updated });
    };

    // Handle changes to the starter code object
    const handleStarterCodeChange = (qIndex, lang, code) => {
        const updated = [...quiz.questions];
        updated[qIndex] = {
            ...updated[qIndex],
            starterCode: {
                ...updated[qIndex].starterCode,
                [lang]: code
            }
        };
        setQuiz({ ...quiz, questions: updated });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const updated = [...quiz.questions];
        if (!Array.isArray(updated[qIndex].options)) updated[qIndex].options = ['', '', '', ''];
        updated[qIndex].options[oIndex] = value;
        setQuiz({ ...quiz, questions: updated });
    };

    const handleTestcaseChange = (qIndex, tcIndex, field, value) => {
        const updated = [...quiz.questions];
        if (!Array.isArray(updated[qIndex].testcases)) updated[qIndex].testcases = Array.from({ length: 8 }, () => ({ input: '', output: '' }));
        const tcs = [...updated[qIndex].testcases];
        tcs[tcIndex] = { ...tcs[tcIndex], [field]: value };
        updated[qIndex].testcases = tcs;
        setQuiz({ ...quiz, questions: updated });
    };

    const addQuestion = () => {
        const newQuestion = {
            questionType: 'mcq',
            questionText: '',
            marks: 1,
            options: ['', '', '', ''],
            correctAnswer: 0,
            descriptiveAnswer: '',
            starterCode: { ...defaultCode },
            activeTab: "javascript",
            testcases: Array.from({ length: 8 }, () => ({ input: '', output: '' }))
        };
        setQuiz({ ...quiz, questions: [...(quiz.questions || []), newQuestion] });
    };

    const removeQuestion = (index) => {
        const updated = quiz.questions.filter((_, i) => i !== index);
        setQuiz({ ...quiz, questions: updated });
    };

    const validateBeforeSave = () => {
        if (!quiz.title || !quiz.title.trim()) {
            showToast('Quiz title cannot be empty.', 'error');
            return false;
        }
        if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
            showToast('Quiz must contain at least one question.', 'error');
            return false;
        }
        for (let i = 0; i < quiz.questions.length; i++) {
            const q = quiz.questions[i];
            if (!q.questionText || !q.questionText.trim()) {
                showToast(`Question ${i + 1} must have text.`, 'error');
                return false;
            }
            if (typeof q.marks === 'undefined' || q.marks === null || isNaN(Number(q.marks)) || Number(q.marks) <= 0) {
                showToast(`Question ${i + 1} must have positive marks.`, 'error');
                return false;
            }
            if (q.questionType === 'mcq') {
                if (!Array.isArray(q.options) || q.options.length < 4 || q.options.some(opt => !opt || !opt.toString().trim())) {
                    showToast(`Question ${i + 1} must have 4 non-empty options.`, 'error');
                    return false;
                }
                if (typeof q.correctAnswer === 'undefined' || isNaN(Number(q.correctAnswer)) || Number(q.correctAnswer) < 0 || Number(q.correctAnswer) > 3) {
                    showToast(`Question ${i + 1} must have a valid correct answer index (0-3).`, 'error');
                    return false;
                }
            }
            if (q.questionType === 'coding') {
                if (!Array.isArray(q.testcases) || q.testcases.length !== 8) {
                    showToast(`Question ${i + 1} must have 8 testcases.`, 'error');
                    return false;
                }
            }
        }
        return true;
    };

    const handleSaveChanges = async () => {
        if (!validateBeforeSave()) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Authentication token not found.");
            const payload = {
                title: quiz.title,
                status: quiz.status,
                questions: quiz.questions.map(q => ({
                    _id: q._id,
                    questionType: q.questionType,
                    questionText: q.questionText,
                    marks: Number(q.marks),
                    options: q.questionType === 'mcq' ? q.options.slice(0, 4) : undefined,
                    correctAnswer: q.questionType === 'mcq' ? Number(q.correctAnswer) : undefined,
                    descriptiveAnswer: q.questionType === 'descriptive' ? q.descriptiveAnswer || '' : undefined,
                    // Send the starterCode object
                    starterCode: q.questionType === 'coding' ? q.starterCode : undefined,
                    testcases: q.questionType === 'coding' ? q.testcases.map(tc => ({ input: tc.input || '', output: tc.output || '' })) : undefined
                }))
            };
            await API.put(`/api/quizzes/${quizId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
            showToast('Quiz updated successfully!');
            setTimeout(() => navigate('/staff-dashboard'), 1200);
        } catch (err) {
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

            <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 md:px-6 bg-white/10 backdrop-blur-md border-b border-white/10 h-16">
                <div className="flex items-center gap-3">
                    <img src={LOGO} alt="ProctorX" className="h-8 w-8" />
                    <span className="text-xl font-bold">ProctorX</span>
                    <span className="hidden md:inline text-lg text-gray-300">Edit Quiz</span>
                </div>
                <nav className="flex items-center gap-3">
                    <button onClick={() => navigate('/staff-dashboard')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] text-sm font-medium border border-[#4A4A4A]">
                        <HomeIcon /><span className="hidden md:inline">Dashboard</span>
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-800/30 text-sm font-medium border border-red-700 text-red-400 hover:bg-red-800/50 transition">
                        <LogoutIcon /><span className="hidden md:inline">Logout</span>
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
                        <button onClick={() => navigate('/staff-dashboard')} className="mt-6 px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#4A4A4A]">
                            <ArrowLeft className="h-4 w-4" /> Go Back
                        </button>
                    </div>
                ) : quiz ? (
                    <div className="max-w-5xl mx-auto">
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold">Edit Quiz</h1>
                                <p className="text-sm text-gray-400">{quiz.quizId}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => navigate('/staff-dashboard')} className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#4A4A4A] hover:bg-[#333] transition">Cancel</button>
                                <button onClick={handleSaveChanges} disabled={isSaving} className="px-4 py-2 rounded-lg bg-[#00E1F9] text-black font-semibold hover:bg-[#00B0CC] transition disabled:opacity-50 flex items-center gap-2">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </header>

                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-lg mb-8">
                            <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Title</label>
                                    <input value={quiz.title} onChange={handleQuizTitleChange} className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded focus:border-[#00E1F9] outline-none transition" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                                    <select value={quiz.status} onChange={handleQuizStatusChange} className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded focus:border-[#00E1F9] outline-none transition">
                                        <option value="inactive">Inactive</option>
                                        <option value="active">Active</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-lg mb-8">
                            <h2 className="text-xl font-semibold mb-6">Questions</h2>
                            <div className="space-y-6">
                                {quiz.questions.map((q, qIndex) => (
                                    <div key={q._id || qIndex} className="bg-[#0A0A0A] p-5 rounded-lg border border-[#2A2A2A]">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-base font-medium text-gray-200">Question {qIndex + 1}</div>
                                                <select value={q.questionType} onChange={(e) => handleQuestionField(qIndex, 'questionType', e.target.value)} className="px-2 py-1 bg-[#111111] border border-[#2A2A2A] rounded text-sm text-gray-300 focus:border-[#00E1F9] outline-none">
                                                    <option value="mcq">Multiple Choice</option>
                                                    <option value="descriptive">Descriptive</option>
                                                    <option value="coding">Coding</option>
                                                </select>
                                                <input type="number" min={1} value={q.marks} onChange={(e) => handleQuestionField(qIndex, 'marks', Number(e.target.value))} className="w-20 px-2 py-1 bg-[#111111] border border-[#2A2A2A] rounded text-sm text-gray-300 focus:border-[#00E1F9] outline-none" placeholder="Marks" />
                                            </div>
                                            <button onClick={() => removeQuestion(qIndex)} className="text-red-500 p-1 rounded-md bg-red-900/20 hover:bg-red-900/40 transition">
                                                <TrashIcon />
                                            </button>
                                        </div>

                                        <textarea value={q.questionText} onChange={(e) => handleQuestionField(qIndex, 'questionText', e.target.value)} rows={3} className="w-full mb-4 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded focus:border-[#00E1F9] outline-none transition text-white" placeholder="Enter the question text..." />

                                        {q.questionType === 'mcq' && (
                                            <>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                    {q.options.map((opt, oIndex) => (
                                                        <div key={oIndex}>
                                                            <label className="text-xs text-gray-400 mb-1 block">Option {oIndex + 1}</label>
                                                            <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded focus:border-[#00E1F9] outline-none" placeholder={`Option ${oIndex + 1}`} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1 block">Correct Answer</label>
                                                    <select value={q.correctAnswer} onChange={(e) => handleQuestionField(qIndex, 'correctAnswer', Number(e.target.value))} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded focus:border-[#00E1F9] outline-none">
                                                        {q.options.map((opt, oIndex) => (
                                                            <option key={oIndex} value={oIndex}>{`Option ${oIndex + 1}${opt ? `: ${opt.substring(0, 40)}${opt.length > 40 ? '...' : ''}` : ''}`}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        {q.questionType === 'descriptive' && (
                                            <div className="mb-4">
                                                <label className="text-xs text-gray-400 mb-1 block">Reference / Model Answer (optional)</label>
                                                <textarea value={q.descriptiveAnswer} onChange={(e) => handleQuestionField(qIndex, 'descriptiveAnswer', e.target.value)} rows={4} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded focus:border-[#00E1F9] outline-none" placeholder="Suggested answer or grading notes" />
                                            </div>
                                        )}

                                        {q.questionType === 'coding' && (
                                            <>
                                                <div className="mb-4">
                                                    <label className="text-xs text-gray-300 mb-2 block">Starter Code (Visible to Students)</label>
                                                    
                                                    {/* Language Tabs */}
                                                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                                                        {languages.map(lang => (
                                                            <button
                                                                key={lang}
                                                                type="button"
                                                                onClick={() => handleQuestionField(qIndex, "activeTab", lang)}
                                                                className={`px-3 py-1 rounded text-xs uppercase border transition-colors ${
                                                                    q.activeTab === lang 
                                                                    ? "bg-cyan-600 border-cyan-400 text-white" 
                                                                    : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"
                                                                }`}
                                                            >
                                                                {lang}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Code Editor for Active Tab */}
                                                    <textarea 
                                                        value={q.starterCode[q.activeTab] || ""} 
                                                        onChange={(e) => handleStarterCodeChange(qIndex, q.activeTab, e.target.value)} 
                                                        rows={6} 
                                                        className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded font-mono text-xs text-gray-300 focus:border-[#00E1F9] outline-none" 
                                                        placeholder={`// Enter starter code for ${q.activeTab}...`} 
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <h4 className="text-sm font-semibold text-gray-200 mb-2">Testcases (8)</h4>
                                                    <div className="space-y-2">
                                                        {Array.from({ length: 8 }).map((_, tcIndex) => {
                                                            const tc = (q.testcases && q.testcases[tcIndex]) || { input: '', output: '' };
                                                            return (
                                                                <div key={tcIndex} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div>
                                                                        <label className="text-xs text-gray-400 mb-1 block">Input #{tcIndex + 1}</label>
                                                                        <input value={tc.input} onChange={(e) => handleTestcaseChange(qIndex, tcIndex, 'input', e.target.value)} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded focus:border-[#00E1F9] outline-none" placeholder="stdin" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs text-gray-400 mb-1 block">Expected Output #{tcIndex + 1}</label>
                                                                        <input value={tc.output} onChange={(e) => handleTestcaseChange(qIndex, tcIndex, 'output', e.target.value)} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded focus:border-[#00E1F9] outline-none" placeholder="expected stdout" />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button onClick={addQuestion} className="mt-6 w-full flex items-center justify-center gap-2 bg-[#00333A] hover:bg-[#00444A] text-[#00E1F9] font-semibold py-3 px-4 rounded-lg border border-[#00E1F9]/30 transition">
                                <PlusIcon /> Add Question
                            </button>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}