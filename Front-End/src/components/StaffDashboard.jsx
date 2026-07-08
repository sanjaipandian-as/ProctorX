import { useEffect, useState, useMemo } from "react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import toast from "react-hot-toast";
import {
  Play,
  Eye,
  Trash,
  Edit,
  Copy,
  ChevronLeft,
  Plus,
  Download,
  RefreshCw,
  BarChart,
  BookOpen,
  Users,
  UserPlus,
  Trash2,
  LogOut,
  FolderPlus,
  Clock,
} from 'lucide-react';
import { useNavigate } from "react-router-dom";

const CircularStat = ({ label, value, maxValue, color }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex flex-col items-center space-y-3 bg-gray-50 border border-gray-200 p-6 rounded-2xl shadow-sm">
      <div className="w-24 h-24">
        <CircularProgressbar
          value={percentage}
          text={`${value || 0}${maxValue ? `/${maxValue}` : ''}`}
          styles={buildStyles({
            textSize: '14px',
            pathColor: color || '#000000',
            textColor: '#000000',
            trailColor: '#e2e8f0'
          })}
        />
      </div>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
};

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [otpTimers, setOtpTimers] = useState({});
  const [currentView, setCurrentView] = useState('quizzes'); // 'quizzes', 'classrooms', 'summary'
  const [viewingResultsOf, setViewingResultsOf] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Classroom States
  const [classrooms, setClassrooms] = useState([]);
  const [classroomsLoading, setClassroomsLoading] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [studentEmailToAdd, setStudentEmailToAdd] = useState("");
  const [studentSuggestions, setStudentSuggestions] = useState([]);

  const handleStudentEmailChange = async (e) => {
    const val = e.target.value;
    setStudentEmailToAdd(val);
    if (val.trim().length >= 2) {
      try {
        const res = await api.get(`/api/classrooms/students/search?q=${encodeURIComponent(val)}`);
        setStudentSuggestions(res.data);
      } catch (err) {
        console.error("Suggestions lookup failed", err);
      }
    } else {
      setStudentSuggestions([]);
    }
  };

  const fetchQuizzes = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/api/quizzes");
      const fetchedQuizzes = Array.isArray(res.data) ? res.data : [];
      setQuizzes(fetchedQuizzes);
      
      setSelectedQuiz(prev => {
        if (!prev) return prev;
        const updated = fetchedQuizzes.find(q => q.id === prev.id);
        if (!updated) return prev;
        // Merge updated summary data into the detailed quiz object, preserving the questions array
        return { ...prev, ...updated, questions: prev.questions };
      });
    } catch (err) {
      if (!silent) toast.error("Failed to load quizzes");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    fetchClassrooms();
    if (user) {
      fetchTeacherInfo();
    }
    
    // Auto-poll quizzes every 10 seconds for OTP and status updates
    const pollInterval = setInterval(() => {
      fetchQuizzes(true);
    }, 10000);
    
    return () => clearInterval(pollInterval);
  }, [user]);

  // Keep OTP timers updated
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

  const fetchTeacherInfo = async () => {
    try {
      const res = await api.get("/api/teachers/me");
      setTeacherInfo(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClassrooms = async () => {
    setClassroomsLoading(true);
    try {
      const res = await api.get('/api/classrooms');
      setClassrooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setClassroomsLoading(false);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      await api.post('/api/classrooms', { name: newClassName });
      toast.success(`Classroom "${newClassName}" created successfully!`);
      setNewClassName("");
      fetchClassrooms();
    } catch (err) {
      toast.error("Failed to create classroom");
    }
  };

  const handleViewClassroom = async (id) => {
    try {
      const res = await api.get(`/api/classrooms/${id}`);
      setSelectedClassroom(res.data);
    } catch (err) {
      toast.error("Failed to load classroom details");
    }
  };

  const handleAddStudentToClassroom = async (e) => {
    e.preventDefault();
    if (!studentEmailToAdd.trim()) return;
    try {
      await api.post(`/api/classrooms/${selectedClassroom.id}/students`, { email: studentEmailToAdd });
      toast.success("Student enrolled successfully!");
      setStudentEmailToAdd("");
      handleViewClassroom(selectedClassroom.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to enroll student. Ensure email is correct.");
    }
  };

  const handleRemoveStudentFromClassroom = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this student from the classroom?")) return;
    try {
      await api.delete(`/api/classrooms/${selectedClassroom.id}/students/${studentId}`);
      toast.success("Student removed successfully");
      handleViewClassroom(selectedClassroom.id);
    } catch (err) {
      toast.error("Failed to remove student");
    }
  };

  const handleQuizClick = async (quizId) => {
    setQuizLoading(true);
    try {
      const res = await api.get(`/api/quizzes/${quizId}`);
      setSelectedQuiz(res.data);
    } catch (err) {
      toast.error("Failed to load quiz details");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleViewResults = async (quiz) => {
    setViewingResultsOf(quiz);
    setResultsLoading(true);
    try {
      const res = await api.get(`/api/results/quiz/${quiz.quizId}`);
      setResultsData(res.data);
    } catch (err) {
      toast.error("Failed to load student attempts");
    } finally {
      setResultsLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz? All results will be deleted.")) return;
    try {
      await api.delete(`/api/quizzes/${quizId}`);
      toast.success("Quiz deleted successfully");
      setSelectedQuiz(null);
      fetchQuizzes();
    } catch (err) {
      toast.error("Failed to delete quiz");
    }
  };

  const handleDuplicate = async (quizId) => {
    try {
      await api.post(`/api/quizzes/${quizId}/duplicate`);
      toast.success("Quiz duplicated successfully");
      fetchQuizzes();
    } catch (err) {
      toast.error("Failed to duplicate quiz");
    }
  };

  const handleEdit = (quizId) => {
    navigate(`/edit-quiz/${quizId}`);
  };

  const handleExportExcel = async (quizId) => {
    try {
      const res = await api.get(`/api/results/export/${quizId}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Results_${quizId}.xlsx`;
      link.click();
      toast.success("Excel report exported successfully!");
    } catch (err) {
      toast.error("Failed to export Excel spreadsheet");
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success(`Copied Quiz Code: ${id}`);
  };

  const handleGenerateOtp = async (quizId) => {
    try {
      const res = await api.post(`/api/quizzes/${quizId}/generate-otp`);
      toast.success(`New OTP Generated: ${res.data.otp}`);
      fetchQuizzes();
      if (selectedQuiz && selectedQuiz.quizId === quizId) {
        setSelectedQuiz(prev => ({ ...prev, otp: res.data.otp, otpExpiresAt: res.data.otpExpiresAt }));
      }
    } catch (err) {
      toast.error("Failed to generate new OTP");
    }
  };

  const handleStatusChange = async (quizId, newStatus) => {
    try {
      await api.put(`/api/quizzes/${quizId}/status`, { status: newStatus });
      toast.success(`Quiz status updated to ${newStatus}`);
      fetchQuizzes();
      if (selectedQuiz && selectedQuiz.quizId === quizId) {
        setSelectedQuiz(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error("Failed to update status");
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

  const dashboardStats = useMemo(() => {
    const totalSubmissions = quizzes.reduce((sum, q) => sum + (q.totalAttempts || 0), 0);
    const activeQuizzes = quizzes.filter(q => q.status === 'ACTIVE').length;
    return {
      totalQuizzes: quizzes.length,
      activeQuizzes,
      totalSubmissions
    };
  }, [quizzes]);

  return (
    <div 
      className="h-screen w-screen flex flex-col bg-white text-black font-sans overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Inject custom light scrollbar styles to avoid the dark webkit scrollbar track from global CSS */}
      <style>{`
        .light-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .light-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .light-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1) !important;
          border-radius: 9999px !important;
        }
        .light-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>

      {/* Top Header Panel */}
      <div className="h-[72px] border-b border-gray-200 px-6 md:px-10 flex items-center justify-between shrink-0 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg">
            PX
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 tracking-tight leading-none">{user?.name}</h1>
            <p className="text-gray-500 text-[10px] mt-1">Instructor Portal | ID: {teacherInfo?.staffId || "N/A"}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/create-quiz")}
            className="px-4 py-2 bg-black hover:bg-gray-900 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 text-xs shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Create Quiz
          </button>
          <button
            onClick={logout}
            className="px-3.5 py-2 border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 font-bold rounded-lg transition-all flex items-center gap-1.5 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Double-Panel Workspace Layout (Borderless Separation + Transparent Scrollbar) */}
      <div className="flex flex-1 overflow-hidden w-full">
        
        {/* LEFT PANEL: Navigation & Control Filters */}
        <div className="w-[360px] md:w-[400px] shrink-0 bg-[#fbfbfc] p-6 overflow-y-auto light-scrollbar space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Tab Selection Navigation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                Navigation
              </div>

              <button
                onClick={() => { setCurrentView('quizzes'); setSelectedQuiz(null); setViewingResultsOf(null); }}
                className={`w-full px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                  currentView === 'quizzes' 
                    ? "bg-black text-white shadow-sm" 
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Quizzes Panel
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${currentView === 'quizzes' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {quizzes.length}
                </span>
              </button>

              <button
                onClick={() => { setCurrentView('classrooms'); setSelectedQuiz(null); setViewingResultsOf(null); setSelectedClassroom(null); }}
                className={`w-full px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                  currentView === 'classrooms' 
                    ? "bg-black text-white shadow-sm" 
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Classrooms Directory
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${currentView === 'classrooms' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {classrooms.length}
                </span>
              </button>

              <button
                onClick={() => { setCurrentView('summary'); setSelectedQuiz(null); setViewingResultsOf(null); }}
                className={`w-full px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                  currentView === 'summary' 
                    ? "bg-black text-white shadow-sm" 
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart className="w-4 h-4" /> Performance Summary
                </span>
              </button>
            </div>

            {/* Dynamic Controls based on view */}
            {currentView === 'quizzes' && !selectedQuiz && !viewingResultsOf && (
              <div className="space-y-4 pt-4 border-t border-gray-200/60">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                  Filters & Search
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Search Quizzes</label>
                  <input
                    type="text"
                    placeholder="Search by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Status Filter</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-xs"
                  >
                    <option value="all">All Statuses</option>
                    <option value="PENDING">PENDING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
            )}

            {currentView === 'classrooms' && !selectedClassroom && (
              <div className="space-y-4 pt-4 border-t border-gray-200/60">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                  Quick Create Class
                </div>

                <form onSubmit={handleCreateClassroom} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Classroom Name (e.g. CS-101)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-xs"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-black hover:bg-gray-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <FolderPlus className="w-3.5 h-3.5" /> Create Classroom
                  </button>
                </form>
              </div>
            )}

            {currentView === 'classrooms' && selectedClassroom && (
              <div className="space-y-4 pt-4 border-t border-gray-200/60">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                  Enroll Student
                </div>

                <form onSubmit={handleAddStudentToClassroom} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="student@univ.edu"
                      value={studentEmailToAdd}
                      onChange={handleStudentEmailChange}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-xs"
                      required
                      autoComplete="off"
                    />
                    {studentSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-40 overflow-y-auto divide-y divide-gray-100">
                        {studentSuggestions.map((std) => (
                          <div
                            key={std.id}
                            onClick={() => {
                              setStudentEmailToAdd(std.email);
                              setStudentSuggestions([]);
                            }}
                            className="px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-bold">{std.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{std.email}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-black hover:bg-gray-900 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Student
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Core Blueprint summary widget */}
          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-4 space-y-2.5 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Assessment Stats</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="text-gray-500 font-medium">Total Quizzes</div>
                <div className="text-base font-extrabold mt-0.5">{dashboardStats.totalQuizzes}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="text-gray-500 font-medium">Active Quizzes</div>
                <div className="text-base font-extrabold mt-0.5">{dashboardStats.activeQuizzes}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 col-span-2">
                <div className="text-gray-500 font-medium">Total Submissions</div>
                <div className="text-base font-extrabold mt-0.5">{dashboardStats.totalSubmissions}</div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Scrollable Workspace area */}
        <div className="flex-1 bg-white p-6 md:p-10 overflow-y-auto light-scrollbar space-y-6">
          
          {/* Detail View: Selected Quiz Details */}
          {selectedQuiz && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <button 
                  onClick={() => setSelectedQuiz(null)} 
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to List
                </button>
                
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{selectedQuiz.title}</h2>
                
                <button
                  onClick={() => handleDeleteQuiz(selectedQuiz.quizId)}
                  className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all"
                >
                  Delete Quiz
                </button>
              </div>

              {/* Status and info metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status Settings</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-xs font-extrabold capitalize px-2 py-0.5 rounded ${
                      selectedQuiz.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700' 
                        : selectedQuiz.status === 'PENDING'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-gray-900 text-white'
                    }`}>{selectedQuiz.status}</span>
                    
                    <select
                      value={selectedQuiz.status}
                      onChange={(e) => handleStatusChange(selectedQuiz.quizId, e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none font-bold"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quiz passcode/code (click)</span>
                  <p 
                    className="text-xs font-mono font-bold cursor-pointer flex items-center gap-1.5 mt-2 hover:text-gray-700" 
                    onClick={() => handleCopyId(selectedQuiz.quizId)}
                  >
                    {selectedQuiz.quizId} <Copy className="w-3.5 h-3.5" />
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Duration</span>
                  <p className="text-gray-900 font-extrabold text-sm mt-1.5">{selectedQuiz.durationInMinutes} mins</p>
                </div>
              </div>

              {/* Active exam monitor panel */}
              {selectedQuiz.status === 'ACTIVE' && (
                <div className="bg-green-50/50 border border-green-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-green-900">Exam Live Security passcode (OTP)</p>
                    <p className="text-[11px] text-green-700 leading-normal">Provide this passcode to students. It automatically refreshes over time.</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xl font-extrabold text-green-950 font-mono tracking-widest">{selectedQuiz.otp || 'NONE'}</span>
                      {selectedQuiz.otp && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">Expires in: {formatTime(otpTimers[selectedQuiz.quizId])}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateOtp(selectedQuiz.quizId)}
                      className="px-3.5 py-2 text-xs font-bold bg-white border border-green-300 text-green-900 rounded-lg hover:bg-green-100/50 transition-all shadow-sm"
                    >
                      Refresh OTP
                    </button>
                    <button
                      onClick={() => navigate(`/monitor/${selectedQuiz.quizId}`)}
                      className="px-4 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" /> Go Live Monitor
                    </button>
                  </div>
                </div>
              )}

              {/* Questions list display */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Questions configured ({selectedQuiz.questions?.length})</h4>
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 light-scrollbar">
                  {selectedQuiz.questions?.map((q, idx) => (
                    <div key={q.id} className="bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <p className="font-bold text-sm text-gray-900">{idx + 1}. {q.questionText}</p>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600 px-2 py-0.5 rounded shrink-0">
                          {q.questionType || "MCQ"} | {q.marks || 1} mark(s)
                        </span>
                      </div>
                      
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-lg text-xs font-medium border ${
                                q.correctAns === oIdx 
                                  ? 'bg-green-100 text-green-900 border-green-300' 
                                  : 'bg-white border-gray-200 text-gray-600'
                              }`}
                            >
                              <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.questionType === "descriptive" && q.descriptiveAnswer && (
                        <div className="bg-white border border-gray-200 p-3 rounded-lg text-xs">
                          <span className="block font-bold text-gray-400 uppercase text-[9px] mb-1">Expected descriptive key</span>
                          <p className="text-gray-700 leading-normal font-medium">{q.descriptiveAnswer}</p>
                        </div>
                      )}

                      {q.questionType === "coding" && q.testcases && (
                        <div className="bg-white border border-gray-200 p-3 rounded-lg text-xs space-y-3">
                          {q.starterCode && (
                            <div>
                              <span className="block font-bold text-gray-400 uppercase text-[9px] mb-1">Starter Code</span>
                              <pre className="bg-gray-50 border border-gray-100 p-2 rounded text-gray-700 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">{q.starterCode}</pre>
                            </div>
                          )}
                          <div>
                            <span className="block font-bold text-gray-400 uppercase text-[9px] mb-1">Test Cases ({q.testcases.length})</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                              {q.testcases.map((tc, tcIdx) => (
                                <div key={tcIdx} className="bg-gray-50 border border-gray-100 p-2 rounded text-[10px]">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-600">Case {tcIdx + 1}</span>
                                    {tc.hidden && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold">HIDDEN</span>}
                                  </div>
                                  <div className="text-gray-500"><span className="font-semibold">Input:</span> <span className="font-mono text-gray-800">{tc.input}</span></div>
                                  <div className="text-gray-500"><span className="font-semibold">Output:</span> <span className="font-mono text-gray-800">{tc.output}</span></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results Details Table View */}
          {viewingResultsOf && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <button 
                  onClick={() => setViewingResultsOf(null)} 
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Quizzes
                </button>
                <h2 className="text-lg font-extrabold text-gray-900">Results: "{viewingResultsOf.title}"</h2>
                <button
                  onClick={() => handleExportExcel(viewingResultsOf.quizId)}
                  className="px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export Excel report
                </button>
              </div>

              {resultsLoading ? (
                <p className="text-center text-gray-500 py-12 text-xs">Loading results...</p>
              ) : resultsData.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center text-gray-500 text-xs">
                  No submissions have been recorded for this quiz yet.
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4">Student Name</th>
                          <th className="px-6 py-4">Student Email</th>
                          <th className="px-6 py-4">Score</th>
                          <th className="px-6 py-4">Accuracy</th>
                          <th className="px-6 py-4">Warnings Triggered</th>
                          <th className="px-6 py-4">Submitted Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {resultsData.map(res => (
                          <tr key={res.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-bold text-gray-900">{res.student?.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-gray-600 font-mono">{res.student?.email || 'N/A'}</td>
                            <td className="px-6 py-4 font-bold text-green-700">{res.score} / {res.totalQuestions}</td>
                            <td className="px-6 py-4 font-semibold">{res.accuracy}%</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                res.warnings >= 4 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {res.warnings} warnings
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">{new Date(res.completedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quizzes directory view (DEFAULT) */}
          {currentView === 'quizzes' && !selectedQuiz && !viewingResultsOf && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-wide">
                  Quizzes Panel
                </h2>
                <span className="text-xs bg-gray-100 border border-gray-200 px-3 py-1 rounded-full font-bold text-gray-600">
                  {filteredQuizzes.length} assessment(s) matched
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="bg-gray-50 border border-gray-200 h-48 rounded-2xl" />
                  ))}
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-16 text-center text-gray-500 text-xs">
                  No quizzes matched the specified filters. Try creating one!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredQuizzes.map((quiz) => (
                    <div 
                      key={quiz.id} 
                      className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col justify-between hover:border-gray-400 transition-all hover:shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            quiz.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : quiz.status === 'PENDING'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-gray-900 text-white'
                          }`}>{quiz.status}</span>
                          <span className="text-xs font-bold text-gray-400">{quiz.durationInMinutes} mins</span>
                        </div>
                        
                        <h4 className="text-base font-extrabold text-gray-900 truncate leading-snug">{quiz.title}</h4>
                        <p className="text-[11px] text-gray-500">
                          Questions: <span className="font-bold text-gray-700">{quiz.totalQuestions}</span> | Submissions: <span className="font-bold text-gray-700">{quiz.totalAttempts || 0}</span>
                        </p>

                        {quiz.scheduledAt && (
                          <div className="text-[10px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-150 font-mono">
                            📅 Scheduled: {new Date(quiz.scheduledAt).toLocaleString()}
                          </div>
                        )}
                        {quiz.status === 'ACTIVE' && (
                          <div className="text-[10px] text-green-700 bg-green-50 p-2 rounded-lg border border-green-150 font-mono flex justify-between">
                            <span>🔑 Active OTP:</span>
                            <span className="font-bold tracking-wider">{quiz.otp || 'NONE'}</span>
                          </div>
                        )}
                      </div>

                      {/* Card actions */}
                      <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleQuizClick(quiz.quizId)}
                            className="flex-1 py-2 text-xs font-bold bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                          <button
                            onClick={() => handleViewResults(quiz)}
                            className="flex-1 py-2 text-xs font-bold bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <BarChart className="w-3.5 h-3.5" /> Attempts
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(quiz.quizId)}
                            className="flex-1 py-2 text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDuplicate(quiz.quizId)}
                            className="flex-1 py-2 text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Clone
                          </button>
                        </div>

                        {quiz.status === 'PENDING' && (
                          <div className="flex gap-2 w-full mt-1">
                            <button
                              onClick={() => navigate(`/edit-quiz/${quiz.quizId}`)}
                              className="flex-1 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-all flex items-center justify-center gap-1"
                            >
                              <Clock className="w-3.5 h-3.5" /> Schedule Time
                            </button>
                            <button
                              onClick={() => handleStatusChange(quiz.quizId, 'ACTIVE')}
                              className="flex-1 py-2 text-xs font-extrabold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-all flex items-center justify-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Go Live
                            </button>
                          </div>
                        )}

                        {quiz.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(quiz.quizId, 'COMPLETED')}
                              className="w-full mt-1 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all flex items-center justify-center"
                            >
                              End Exam
                            </button>
                            <button
                              onClick={() => navigate(`/monitor/${quiz.quizId}`)}
                              className="w-full py-2 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-all flex items-center justify-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Monitor Live Feed
                            </button>
                          </>
                        )}

                        {quiz.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleViewResults(quiz)}
                            className="w-full mt-1 py-2 text-xs font-extrabold text-white bg-gray-900 hover:bg-black rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <BarChart className="w-3.5 h-3.5" /> View Results
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Classrooms Directory grid view */}
          {currentView === 'classrooms' && !selectedClassroom && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-wide">
                  Classrooms Directory
                </h2>
                <span className="text-xs bg-gray-100 border border-gray-200 px-3 py-1 rounded-full font-bold text-gray-600">
                  {classrooms.length} classroom(s) active
                </span>
              </div>

              {classroomsLoading ? (
                <p className="text-center text-gray-500 py-12 text-xs">Loading classrooms...</p>
              ) : classrooms.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-16 text-center text-gray-500 text-xs">
                  No classrooms created yet. Use the Left panel to add one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classrooms.map((c) => (
                    <div 
                      key={c.id} 
                      className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col justify-between hover:border-gray-400 transition-all hover:shadow-sm"
                    >
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          {c.code}
                        </span>
                        <h4 className="text-base font-extrabold text-gray-900 truncate leading-snug">{c.name}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" /> Students enrolled: <span className="font-bold text-gray-700">{c._count?.students || 0}</span>
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleViewClassroom(c.id)}
                          className="w-full py-2 text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all flex items-center justify-center gap-1 text-gray-700"
                        >
                          <Eye className="w-3.5 h-3.5" /> Manage Students
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Classroom student list details */}
          {currentView === 'classrooms' && selectedClassroom && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <button 
                  onClick={() => setSelectedClassroom(null)} 
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Classrooms
                </button>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">{selectedClassroom.name}</h2>
                  <p className="text-[11px] text-gray-500 mt-1">Classroom Code: <span className="font-mono text-black font-extrabold">{selectedClassroom.code}</span></p>
                </div>
              </div>

              {/* Students Enrolled list */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">Enrolled Students ({selectedClassroom.students?.length || 0})</h3>
                </div>
                {selectedClassroom.students?.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 text-xs">
                    No students enrolled in this classroom yet. Use the Left panel form to enroll a student.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Email Address</th>
                          <th className="px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedClassroom.students?.map((std) => (
                          <tr key={std.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-bold text-gray-900">{std.name}</td>
                            <td className="px-6 py-4 text-gray-600 font-mono">{std.email}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleRemoveStudentFromClassroom(std.id)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 transition-all"
                                title="Remove Student"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Summary chart view */}
          {currentView === 'summary' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-wide">
                  Performance Overview
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <CircularStat label="Quizzes Created" value={dashboardStats.totalQuizzes} maxValue={null} color="#000000" />
                <CircularStat label="Active Quizzes" value={dashboardStats.activeQuizzes} maxValue={dashboardStats.totalQuizzes} color="#10b981" />
                <CircularStat label="Total Submissions" value={dashboardStats.totalSubmissions} maxValue={null} color="#000000" />
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}