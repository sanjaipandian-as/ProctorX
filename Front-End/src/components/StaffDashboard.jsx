import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useAuth } from "../context/AuthContext";

const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>);
const QuestionCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>);
const UserTieIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full p-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>);
const CopyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-2 cursor-pointer hover:text-pink-400" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>);
const ArrowLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>);
const ChartBarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 110 2H3a1 1 0 01-1-1zm5-4a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1zm5 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm-5 4a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1z" /></svg>);
const QuizIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>);
const StudentIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>);
const CheckCircle2 = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-green-500 flex-shrink-0"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>);
const XCircle = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-red-500 flex-shrink-0"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="h-4 w-4" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V12h2.293l6.5-6.5z" /></svg>);
const DuplicateIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="h-4 w-4" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" /><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zM-1 7a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1A.5.5 0 0 1-1 7z" /></svg>);
const ResetIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0121.5 12M20 20l-1.5-1.5A9 9 0 002.5 12" /></svg>);

function Toast({ message, type }) {
    return (<div className={`fixed top-5 right-5 px-4 py-2 rounded-xl shadow-lg text-sm font-medium transition-all ${type === "success" ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"}`}>{message}</div>);
}

const CircularStat = ({ label, value, maxValue, color }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (<div className="flex flex-col items-center space-y-3"><div className="w-28 h-28"><CircularProgressbar value={percentage} text={`${value || 0}${maxValue ? `/${maxValue}` : ''}`} styles={buildStyles({ textSize: '12px', pathColor: color, textColor: 'white', trailColor: '#4b5563' })} /></div><div className="text-sm font-semibold text-gray-300">{label}</div></div>);
};

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [otpTimers, setOtpTimers] = useState({});
    const [toast, setToast] = useState(null);
    const [currentView, setCurrentView] = useState('summary');
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
            quizzes.forEach((quiz) => {
                if (quiz.otpExpiresAt) {
                    const diff = new Date(quiz.otpExpiresAt).getTime() - now;
                    updatedTimers[quiz.quizId] = diff > 0 ? diff : 0;
                }
            });
            setOtpTimers(updatedTimers);
        }, 1000);
        return () => clearInterval(interval);
    }, [quizzes]);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8000/api/quizzes", { headers: { Authorization: `Bearer ${token}` } });
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
            setStats({ totalAttempts: 125 });
        } catch {
            setStats({ totalAttempts: 'N/A' });
        }
    }

    const fetchTeacherInfo = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:8000/teachers/details", { headers: { Authorization: `Bearer ${token}` } });
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
            const res = await axios.get(`http://localhost:8000/api/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
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
            await axios.delete(`http://localhost:8000/api/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
            setSelectedQuiz(null);
            fetchQuizzes();
            showToast("Quiz deleted successfully");
        } catch {
            showToast("Failed to delete quiz", "error");
        }
    };

    const handleEdit = (quizId) => {
        window.location.href = `/edit-quiz/${quizId}`;
    };

    const handleDuplicate = async (quizId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(`http://localhost:8000/api/quizzes/${quizId}/duplicate`, {}, { headers: { Authorization: `Bearer ${token}` } });
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
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:8000/api/results/quiz/${quiz.quizId}`, { headers: { Authorization: `Bearer ${token}` } });
            setResultsData(res.data);
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
            const res = await axios.post(`http://localhost:8000/api/quizzes/${quizId}/generate-otp`, {}, { headers: { Authorization: `Bearer ${token}` } });
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

const handleResetAttempt = async (quizId, studentId) => {
  try {
    const token = localStorage.getItem("token");

    // Validate IDs before sending request
    if (!quizId || !studentId) {
      alert("Invalid quiz or student ID");
      return;
    }

    const response = await fetch(
      `http://localhost:8000/teachers/quiz/${quizId}/student/${studentId}/reset`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to reset attempt");
    }

    alert(data.message); // or update state/UI
  } catch (error) {
    console.error("Error resetting attempt:", error);
    alert(error.message);
  }
};



    const formatTime = (ms) => {
        if (ms <= 0) return "Expired";
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const filteredQuizzes = useMemo(() => {
        return quizzes
            .filter(quiz => statusFilter === 'all' || quiz.status === statusFilter)
            .filter(quiz => quiz.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [quizzes, searchTerm, statusFilter]);

    const resetViews = () => {
        setSelectedQuiz(null);
        setViewingResultsOf(null);
        setSelectedResultDetail(null);
    };

    const renderContent = () => {
        if (quizLoading) {
            return <p className="text-gray-400 text-center text-lg">Loading Quiz Details...</p>;
        }

        if (selectedQuiz) {
            return (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => setSelectedQuiz(null)} className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-100 transition">
                            <ArrowLeftIcon /> Back to Quizzes
                        </button>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text flex items-center gap-2"><QuizIcon /> {selectedQuiz.title}</h2>
                        <div className="flex items-center gap-4">
                            <button onClick={() => handleDeleteQuiz(selectedQuiz.quizId)} className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 px-5 py-2 rounded-xl text-white hover:from-red-500 hover:to-pink-500 transition transform hover:scale-105 shadow-md"><TrashIcon /> Delete</button>
                        </div>
                    </div>
                    <p className="text-gray-300 mb-2">Status: <span className={selectedQuiz.status === "active" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>{selectedQuiz.status}</span></p>
                    <p className="text-gray-400 text-sm mb-2 cursor-pointer" onClick={() => handleCopyId(selectedQuiz.quizId)}>
                        Quiz Code: <span className="font-semibold text-purple-300">{selectedQuiz.quizId}</span>
                        <CopyIcon />
                    </p>
                    {selectedQuiz.otp && (<p className="text-sm text-purple-300 mb-4">OTP: <span className="font-semibold">{selectedQuiz.otp}</span> ({formatTime(otpTimers[selectedQuiz.quizId])})<button className="ml-3 px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded text-white text-xs hover:from-indigo-400 hover:to-purple-400" onClick={() => handleGenerateOtp(selectedQuiz.quizId)}>Generate New OTP</button></p>)}
                    <p className="text-gray-400 text-sm mb-6">Created on {new Date(selectedQuiz.createdAt).toLocaleDateString()}</p>
                    <h3 className="text-xl font-semibold text-purple-300 mb-4">Questions</h3>
                    <ul className="space-y-5">
                        {selectedQuiz.questions.map((q, i) => (
                            <li key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-md">
                                <p className="font-medium text-white">{q.questionText}</p>
                                <ul className="list-disc list-inside text-gray-300 mt-3 space-y-1">
                                    {q.options.map((opt, idx) => (<li key={idx} className={q.correctAnswer === idx.toString() ? "text-emerald-400 font-semibold" : ""}>{opt}</li>))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        }

        if (selectedResultDetail) {
            return (
                <div>
                    <button onClick={() => setSelectedResultDetail(null)} className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-100 transition mb-6">
                        <ArrowLeftIcon /> Back to Results List
                    </button>
                    <div className="bg-gray-900 font-sans grid grid-cols-1 md:grid-cols-4 gap-6">
                        <aside className="bg-white/5 shadow-lg p-6 rounded-2xl space-y-8 md:col-span-1 flex flex-col items-center">
                            <p className="text-lg text-center text-gray-200 font-semibold mb-6">{viewingResultsOf?.title}</p>
                            <CircularStat label="Score" value={selectedResultDetail.score} maxValue={selectedResultDetail.totalQuestions} color="#f59e0b" />
                            <CircularStat label="Accuracy" value={Math.round(selectedResultDetail.accuracy)} maxValue={100} color="#10b981" />
                            <CircularStat label="Attempted" value={selectedResultDetail.responses?.length} maxValue={selectedResultDetail.totalQuestions} color="#8b5cf6" />
                        </aside>
                        <main className="md:col-span-3">
                            <header className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-200">{viewingResultsOf?.title}</h1>
                                <p className="text-gray-400 mt-2">Results for <span className="font-semibold text-purple-300">{selectedResultDetail.user?.name}</span></p>
                            </header>
                            <div className="bg-white/5 p-6 rounded-2xl shadow-lg">
                                <h2 className="text-2xl font-bold text-gray-200 border-b border-gray-700 pb-4 mb-6">Question Review</h2>
                                <div className="space-y-6">
                                    {selectedResultDetail.responses?.map((res, index) => (
                                        <div key={index} className="border-b border-gray-700 pb-6 last:border-b-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-lg font-semibold text-gray-200">{index + 1}. {res.questionText}</p>
                                                {res.isCorrect ? <CheckCircle2 /> : <XCircle />}
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                {res.options.map((option, optIndex) => {
                                                    const isCorrect = option === res.correctAnswer;
                                                    const isSelected = option === res.studentAnswer;
                                                    let optionClass = "border-gray-600 bg-gray-900 text-gray-300";
                                                    if (isCorrect) {
                                                        optionClass = "border-green-600 bg-green-900/40 text-green-300 font-semibold";
                                                    } else if (isSelected && !isCorrect) {
                                                        optionClass = "border-red-600 bg-red-900/40 text-red-300 font-semibold";
                                                    }
                                                    return (
                                                        <div key={optIndex} className={`p-3 border-2 rounded-lg flex items-center justify-between ${optionClass}`}>
                                                            <span>{option}</span>
                                                            {isSelected && (<span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-600 text-gray-200">Your Answer</span>)}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            );
        }

        if (viewingResultsOf) {
            const quizTitle = viewingResultsOf.title;
            const totalSubmissions = resultsData.length;
            const averageScore = totalSubmissions > 0 ? (resultsData.reduce((acc, r) => acc + r.score, 0) / totalSubmissions).toFixed(2) : 0;
            const highestScore = totalSubmissions > 0 ? Math.max(...resultsData.map(r => r.score)) : 0;
            const lowestScore = totalSubmissions > 0 ? Math.min(...resultsData.map(r => r.score)) : 0;

            return (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => setViewingResultsOf(null)} className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-100 transition">
                            <ArrowLeftIcon /> Back to Quizzes
                        </button>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">Results for "{quizTitle}"</h1>
                        <div></div>
                    </div>
                    {resultsLoading ? (<p>Loading results...</p>) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 text-center">
                                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20"><p className="text-gray-300 text-sm">Submissions</p><p className="text-2xl font-bold">{totalSubmissions}</p></div>
                                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20"><p className="text-gray-300 text-sm">Average Score</p><p className="text-2xl font-bold text-emerald-400">{averageScore}</p></div>
                                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20"><p className="text-gray-300 text-sm">Highest Score</p><p className="text-2xl font-bold text-amber-400">{highestScore}</p></div>
                                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20"><p className="text-gray-300 text-sm">Lowest Score</p><p className="text-2xl font-bold text-red-400">{lowestScore}</p></div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl">
                                <h2 className="text-xl font-semibold mb-4 text-purple-300">Student Submissions</h2>
                                {totalSubmissions === 0 ? <p className="text-gray-400">No students have submitted this quiz yet.</p> : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/20">
                                                <th className="p-3">Student Name</th>
                                                <th className="p-3">Email</th>
                                                <th className="p-3">Score</th>
                                                <th className="p-3">Accuracy</th>
                                                <th className="p-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resultsData.map(result => (
                                                <tr key={result._id} className="border-b border-white/10 hover:bg-white/5">
                                                    <td className="p-3">{result.user?.name}</td>
                                                    <td className="p-3">{result.user?.email}</td>
                                                    <td className="p-3 font-semibold text-emerald-400">{result.score} / {result.totalQuestions}</td>
                                                    <td className="p-3">{result.accuracy.toFixed(2)}%</td>
                                                    <td className="p-3 text-right space-x-2">
                                                        <button onClick={() => setSelectedResultDetail(result)} className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">View Details</button>
                                                        <button
                                                            onClick={() => handleResetAttempt(viewingResultsOf.quizId, result.user._id)}
                                                            className="px-3 py-1 text-sm bg-amber-600 hover:bg-amber-500 rounded-lg transition inline-flex items-center gap-1.5"
                                                            title="Reset Attempt"
                                                        >
                                                            <ResetIcon /> Reset
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            );
        }

        if (currentView === 'quizzes') {
            return (
                <>
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">My Quizzes</h1>
                        <div className="flex items-center gap-4">
                            <input type="text" placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 w-64 focus:ring-purple-500 focus:border-purple-500" />
                            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                                <button onClick={() => setStatusFilter('all')} className={`px-3 py-1 text-sm rounded ${statusFilter === 'all' ? 'bg-purple-600' : 'bg-transparent text-gray-300'}`}>All</button>
                                <button onClick={() => setStatusFilter('active')} className={`px-3 py-1 text-sm rounded ${statusFilter === 'active' ? 'bg-emerald-600' : 'bg-transparent text-gray-300'}`}>Active</button>
                                <button onClick={() => setStatusFilter('inactive')} className={`px-3 py-1 text-sm rounded ${statusFilter === 'inactive' ? 'bg-red-600' : 'bg-transparent text-gray-300'}`}>Inactive</button>
                            </div>
                        </div>
                    </div>
                    {loading ? (<p className="text-gray-400">Loading quizzes...</p>) : filteredQuizzes.length === 0 ? (<p className="text-gray-500 text-center py-10">No quizzes found.</p>) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredQuizzes.map((quiz) => (
                                <div key={quiz.quizId} className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-purple-300 to-pink-400 text-transparent bg-clip-text"><QuizIcon /> {quiz.title}</h3>
                                        <p className="text-gray-300 mt-3 text-sm flex items-center gap-2"><QuestionCircleIcon /> {quiz.questions.length} Questions</p>
                                        <p className="text-sm mt-2">Status: <span className={quiz.status === "active" ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{quiz.status}</span></p>
                                    </div>
                                    <div className="mt-6 border-t border-white/10 pt-4 flex flex-col gap-3">
                                        <div className="flex gap-3">
                                            <button onClick={() => handleQuizClick(quiz.quizId)} className="flex-1 text-sm py-2 px-4 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 transition flex items-center justify-center gap-2">Details</button>
                                            <button onClick={() => handleViewResults(quiz)} className="flex-1 text-sm py-2 px-4 rounded-lg bg-sky-600/80 hover:bg-sky-500 transition flex items-center justify-center gap-2">Results</button>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleEdit(quiz.quizId)} className="flex-1 text-sm py-2 px-4 rounded-lg bg-gray-600/80 hover:bg-gray-500 transition flex items-center justify-center gap-2"><EditIcon /> Edit</button>
                                            <button onClick={() => handleDuplicate(quiz.quizId)} className="flex-1 text-sm py-2 px-4 rounded-lg bg-gray-600/80 hover:bg-gray-500 transition flex items-center justify-center gap-2"><DuplicateIcon /> Duplicate</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )
        }

        return (
            <>
                <h1 className="text-4xl font-bold mb-10 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">Dashboard Summary</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2"><QuizIcon /> Total Quizzes Created</h3>
                        <p className="text-5xl font-bold mt-4 bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">{loading ? '...' : quizzes.length}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2"><StudentIcon /> Total Quiz Attempts</h3>
                        <p className="text-5xl font-bold mt-4 bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text">{stats.totalAttempts}</p>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
            {toast && <Toast message={toast.message} type={toast.type} />}
            <header className="flex items-center justify-between px-10 py-8 bg-black/30 backdrop-blur-lg border-b border-white/10 shadow-lg">
                {user && (
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-400">
                            {teacherInfo?.profilePicture ? (
                                <img
                                    src={teacherInfo?.profilePicture || "/default-avatar.png"}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />

                            ) : (
                                <UserTieIcon />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-purple-300">{user.name}</h3>
                            <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                    </div>
                )}
                <nav className="flex flex-col items-end gap-3">
                    <button className={`px-4 py-2 w-40 text-center rounded-lg font-medium transition ${currentView === 'summary' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`} onClick={() => { setCurrentView('summary'); resetViews(); }}>Summary</button>
                    <button className={`px-4 py-2 w-40 text-center rounded-lg font-medium transition ${currentView === 'quizzes' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`} onClick={() => { setCurrentView('quizzes'); resetViews(); }}>My Quizzes</button>
                    <button className="flex items-center justify-center gap-2 w-40 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition transform hover:scale-105 shadow-lg font-medium" onClick={() => (window.location.href = "/create-quiz")}><PlusIcon /> Create Quiz</button>
                </nav>
            </header>
            <main className="flex-1 p-10 overflow-y-auto">{renderContent()}</main>
        </div>
    );
}