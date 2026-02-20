import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import API from "../../Api";
import LOGO from "../assets/LOGO.png";
import toast from 'react-hot-toast';

// Import all extracted components
import Toast from './StaffDashboard/Toast';
import QuizDetailsView from './StaffDashboard/QuizDetailsView';
import ResultDetailView from './StaffDashboard/ResultDetailView';
import ResultsListView from './StaffDashboard/ResultsListView';
import DashboardOverview from './StaffDashboard/DashboardOverview';
import AiQuiz from './AiQuiz';
import { HomeIcon, LogoutIcon } from './StaffDashboard/Icons';

export default function TeacherDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // State Management
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        averageScore: '0%',
        successRate: '0%',
        quizStats: {}
    });
    const [otpTimers, setOtpTimers] = useState({});
    const [toastMessage, setToastMessage] = useState(null);
    const [viewingResultsOf, setViewingResultsOf] = useState(null);
    const [resultsData, setResultsData] = useState([]);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [selectedResultDetail, setSelectedResultDetail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeView, setActiveView] = useState('dashboard'); // Track active view

    // Fetch teacher info
    useEffect(() => {
        const fetchTeacherInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                const userId = JSON.parse(atob(token.split('.')[1])).id;
                const response = await API.get(`/teachers/get/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTeacherInfo(response.data);
            } catch (error) {
                console.error('Error fetching teacher info:', error);
            }
        };
        fetchTeacherInfo();
    }, []);

    // Fetch quizzes
    useEffect(() => {
        fetchQuizzes();
    }, []);

    // Fetch stats
    useEffect(() => {
        fetchStats();
    }, []);

    // OTP Timer Management
    useEffect(() => {
        const interval = setInterval(() => {
            setOtpTimers(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(quizId => {
                    if (updated[quizId] > 0) {
                        updated[quizId] -= 1;
                    } else {
                        handleOtpExpiry(quizId);
                    }
                });
                return updated;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await API.get('/api/quizzes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuizzes(response.data);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            showToast('Failed to load quizzes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await API.get('/api/results/teacher-stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Set default stats if fetch fails
            setStats({
                totalAttempts: 0,
                averageScore: '0%',
                successRate: '0%',
                quizStats: {}
            });
        }
    };

    const handleQuizClick = async (quizId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await API.get(`/api/quizzes/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedQuiz(response.data);
        } catch (error) {
            console.error('Error fetching quiz details:', error);
            showToast('Failed to load quiz details', 'error');
        }
    };

    const handleDelete = async (quizId) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;
        try {
            const token = localStorage.getItem('token');
            await API.delete(`/api/quizzes/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Quiz deleted successfully', 'success');
            fetchQuizzes();
            setSelectedQuiz(null);
        } catch (error) {
            console.error('Error deleting quiz:', error);
            showToast('Failed to delete quiz', 'error');
        }
    };

    const handleEdit = (quizId) => {
        navigate(`/edit-quiz/${quizId}`);
    };

    const handleDuplicate = async (quizId) => {
        try {
            const token = localStorage.getItem('token');
            await API.post(`/api/quizzes/${quizId}/duplicate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Quiz duplicated successfully', 'success');
            fetchQuizzes();
        } catch (error) {
            console.error('Error duplicating quiz:', error);
            showToast('Failed to duplicate quiz', 'error');
        }
    };

    const handleGenerateOtp = async (quizId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await API.post(`/api/quizzes/${quizId}/generate-otp`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const { otp } = response.data;
            const expiresIn = 600; // 10 minutes in seconds

            setQuizzes(prev => prev.map(q =>
                q.quizId === quizId ? { ...q, otp } : q
            ));

            if (selectedQuiz?.quizId === quizId) {
                setSelectedQuiz(prev => ({ ...prev, otp }));
            }

            setOtpTimers(prev => ({ ...prev, [quizId]: expiresIn }));
            showToast('OTP generated successfully', 'success');
        } catch (error) {
            console.error('Error generating OTP:', error);
            showToast('Failed to generate OTP', 'error');
        }
    };

    const handleOtpExpiry = (quizId) => {
        setQuizzes(prev => prev.map(q =>
            q.quizId === quizId ? { ...q, otp: null } : q
        ));
        if (selectedQuiz?.quizId === quizId) {
            setSelectedQuiz(prev => ({ ...prev, otp: null }));
        }
    };

    const handleCopyQuizId = (quizId) => {
        navigator.clipboard.writeText(quizId);
        showToast('Quiz ID copied to clipboard', 'success');
    };

    const handleViewResults = async (quiz) => {
        setViewingResultsOf(quiz);
        setResultsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await API.get(`/api/results/quiz/${quiz.quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResultsData(response.data);
        } catch (error) {
            console.error('Error fetching results:', error);
            showToast('Failed to load results', 'error');
        } finally {
            setResultsLoading(false);
        }
    };

    const handleViewResultDetail = (result) => {
        setSelectedResultDetail(result);
    };

    const handleResetAttempt = async (resultId) => {
        if (!window.confirm('Are you sure you want to reset this attempt? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            await API.delete(`/api/results/${resultId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Attempt reset successfully', 'success');
            handleViewResults(viewingResultsOf);
        } catch (error) {
            console.error('Error resetting attempt:', error);
            showToast('Failed to reset attempt', 'error');
        }
    };

    const handleUpdateMarks = async (questionIndex, newMarks, toggleEdit) => {
        if (!selectedResultDetail) return;

        const updatedResponses = [...selectedResultDetail.responses];
        const response = updatedResponses[questionIndex];

        if (toggleEdit) {
            response.isEditingManual = !response.isEditingManual;
            setSelectedResultDetail({ ...selectedResultDetail, responses: updatedResponses });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await API.post(`/api/results/${selectedResultDetail._id}/update-marks`, {
                responseIndex: questionIndex,
                marks: parseFloat(newMarks)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            response.obtainedMarks = parseFloat(newMarks);
            response.isEvaluated = true;
            response.isEditingManual = false;

            const newTotalScore = updatedResponses.reduce((sum, r) => sum + (r.obtainedMarks || 0), 0);
            setSelectedResultDetail({
                ...selectedResultDetail,
                responses: updatedResponses,
                score: newTotalScore
            });

            showToast('Marks updated successfully', 'success');
        } catch (error) {
            console.error('Error updating marks:', error);
            showToast('Failed to update marks', 'error');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/staff-login');
    };

    const showToast = (message, type) => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds <= 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const filteredQuizzes = quizzes.filter(q =>
        q != null &&
        q.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Render different views based on state
    const renderContent = () => {
        // AI Quiz Generation View
        if (activeView === 'ai-quiz') {
            return <AiQuiz />;
        }

        // Result Detail View
        if (selectedResultDetail) {
            return (
                <ResultDetailView
                    selectedResultDetail={selectedResultDetail}
                    viewingResultsOf={viewingResultsOf}
                    onBack={() => setSelectedResultDetail(null)}
                    onUpdateMarks={handleUpdateMarks}
                />
            );
        }

        // Results List View
        if (viewingResultsOf) {
            return (
                <ResultsListView
                    viewingResultsOf={viewingResultsOf}
                    resultsData={resultsData}
                    resultsLoading={resultsLoading}
                    onBack={() => setViewingResultsOf(null)}
                    onViewDetail={handleViewResultDetail}
                    onResetAttempt={handleResetAttempt}
                />
            );
        }

        // Quiz Details View
        if (selectedQuiz) {
            return (
                <QuizDetailsView
                    selectedQuiz={selectedQuiz}
                    otpTimers={otpTimers}
                    onBack={() => setSelectedQuiz(null)}
                    onDelete={handleDelete}
                    onCopyId={handleCopyQuizId}
                    onGenerateOtp={handleGenerateOtp}
                    formatTime={formatTime}
                />
            );
        }

        // Dashboard Overview
        return (
            <DashboardOverview
                loading={loading}
                quizzes={quizzes}
                stats={stats}
                filteredQuizzes={filteredQuizzes}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onViewResults={handleViewResults}
                onQuizClick={handleQuizClick}
            />
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 text-gray-900">
            <Toaster position="top-right" />
            {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} />}

            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
                {/* Sidebar */}
                {/* Sidebar */}
                <aside className="w-full lg:w-72 bg-white border-r border-gray-100 flex flex-col z-20 shadow-xl lg:shadow-none h-full">
                    <div className="p-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#FFB343]/10 p-2.5 rounded-xl">
                                <img src={LOGO} alt="ProctorX" className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">ProctorX</span>
                        </div>
                    </div>

                    {teacherInfo && (
                        <div className="mx-6 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 mb-6">
                            <div className="flex items-center gap-3">
                                <img
                                    src={teacherInfo.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherInfo.name)}&background=FFB343&color=fff`}
                                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherInfo.name)}&background=FFB343&color=fff`; }}
                                    alt="Teacher"
                                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-sm font-bold text-gray-900 truncate">{teacherInfo.name}</h2>
                                    <p className="text-gray-500 text-[10px] truncate font-medium">{teacherInfo.email}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <nav className="px-4 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => {
                                setSelectedQuiz(null);
                                setViewingResultsOf(null);
                                setSelectedResultDetail(null);
                                setActiveView('dashboard');
                            }}
                            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl w-full text-left transition-all duration-200 group relative ${activeView === 'dashboard'
                                ? 'bg-[#FFB343] text-white shadow-lg shadow-orange-200'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <HomeIcon className={`w-5 h-5 ${activeView === 'dashboard' ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className="font-semibold text-sm">Dashboard</span>
                            {activeView === 'dashboard' && (
                                <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            )}
                        </button>

                        <div className="pt-4 pb-2">
                            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Create</p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        setSelectedQuiz(null);
                                        setViewingResultsOf(null);
                                        setSelectedResultDetail(null);
                                        setActiveView('ai-quiz');
                                    }}
                                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl w-full text-left transition-all duration-200 group ${activeView === 'ai-quiz'
                                        ? 'bg-orange-50 text-[#FFB343] font-bold border border-orange-100'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <div className={`p-1.5 rounded-lg transition-colors ${activeView === 'ai-quiz' ? 'bg-orange-100' : 'bg-gray-100 group-hover:bg-white'}`}>
                                        <svg className={`w-4 h-4 ${activeView === 'ai-quiz' ? 'text-[#FFB343]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium">AI Generation</span>
                                </button>

                                <button
                                    onClick={() => {
                                        navigate('/create-quiz');
                                        setActiveView('create-quiz');
                                    }}
                                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl w-full text-left transition-all duration-200 group ${activeView === 'create-quiz'
                                        ? 'bg-orange-50 text-[#FFB343] font-bold border border-orange-100'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <div className={`p-1.5 rounded-lg transition-colors ${activeView === 'create-quiz' ? 'bg-orange-100' : 'bg-gray-100 group-hover:bg-white'}`}>
                                        <svg className={`w-4 h-4 ${activeView === 'create-quiz' ? 'text-[#FFB343]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium">Manual Quiz</span>
                                </button>
                            </div>
                        </div>
                    </nav>

                    <div className="p-4 mt-auto border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl w-full text-left transition-all duration-200 text-gray-500 hover:bg-rose-50 hover:text-rose-600 group"
                        >
                            <LogoutIcon className="w-5 h-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
                            <span className="font-semibold text-sm">Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8">
                    {renderContent()}
                </main>
            </div>
        </div >
    );
}