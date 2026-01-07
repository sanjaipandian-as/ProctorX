import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Loader2, AlertCircle, BookOpen, Star, Award, ArrowRight, ShieldCheck } from 'lucide-react';
import API from "../../Api";
import BG_TEAL from '../assets/BG_TEA.png';
import LOGO from "../assets/LOGO.png";

const Loader = ({ message = "Loading Dashboard..." }) => (
  <div className="flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-16 h-16 animate-spin text-[#00E1F9]" />
    <p className="text-lg text-gray-300">{message}</p>
  </div>
);

const Card = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-md p-6 transition-all duration-300 hover:border-[#4A4A4A] ${className}`}
    {...props}
  >
    {children}
  </div>
));

const StatCard = ({ title, value, subtitle, icon, iconBgColor = 'bg-[#00333A]' }) => (
  <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#2A2A2A] flex items-center justify-between hover:border-[#4A4A4A] transition-colors">
    <div>
      <p className="text-sm text-gray-400 font-medium">{title}</p>
      <p className="text-3xl font-bold text-[#00E1F9] mt-2">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-full ${iconBgColor}`}>{icon}</div>
  </div>
);

const CustomCalendar = ({ highlightedDates }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const changeMonth = (offset) => setCurrentDate(new Date(year, month + offset, 1));

  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = new Date(year, month, day).toDateString();
    const todayStr = new Date().toDateString();
    const isHighlighted = highlightedDates.includes(dateStr);
    const isToday = dateStr === todayStr;
    calendarDays.push(
      <div key={day} className={`flex items-center justify-center h-9 w-9 rounded-full text-sm transition-colors ${isHighlighted ? 'bg-[#00E1F9] text-black font-bold' : isToday ? 'bg-[#2A2A2A] text-white' : 'text-gray-300 hover:bg-[#2A2A2A]'}`}>{day}</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-0">
        <button onClick={() => changeMonth(-1)} className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#2A2A2A]">&lt;</button>
        <h3 className="font-bold text-white text-base">{currentDate.toLocaleString('default', { month: 'long' })} {year}</h3>
        <button onClick={() => changeMonth(1)} className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#2A2A2A]">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysOfWeek.map(day => <div key={day} className="font-semibold text-xs text-gray-500 uppercase">{day}</div>)}
        {calendarDays}
      </div>
    </div>
  );
};

const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>);
const LogoutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>);

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllResults, setShowAllResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated. Redirecting to login...");
      setLoading(false);
      return;
    }

    const fetchProfileAndResults = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, resultsRes] = await Promise.all([
          API.get("/students/me", { headers: { Authorization: `Bearer ${token}` } }),
          API.get("/api/results/my-results", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setProfile(profileRes.data);
        setQuizzes(Array.isArray(resultsRes.data) ? resultsRes.data : []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Please try refreshing. If the problem persists, contact support.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndResults();
  }, []);

  const summaryStats = useMemo(() => {
    if (!Array.isArray(quizzes) || quizzes.length === 0) return { totalQuizzes: 0, averageScore: "0.0", bestScore: "0.0" };
    const validQuizzes = quizzes.filter(q => typeof q.accuracy === 'number');
    if (validQuizzes.length === 0) return { totalQuizzes: quizzes.length, averageScore: "0.0", bestScore: "0.0" };

    const totalQuizzes = quizzes.length;
    const averageScore = (validQuizzes.reduce((acc, q) => acc + q.accuracy, 0) / validQuizzes.length).toFixed(1);
    const bestScore = Math.max(...validQuizzes.map(q => q.accuracy)).toFixed(1);
    return { totalQuizzes, averageScore, bestScore };
  }, [quizzes]);

  const chartData = useMemo(() =>
    Array.isArray(quizzes) ? quizzes
      .filter(q => q.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-10)
      .map(q => ({
        date: new Date(q.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Score: q.accuracy ?? 0,
      })) : [],
    [quizzes]
  );

  const quizDates = useMemo(() => Array.isArray(quizzes) ? quizzes.map(q => new Date(q.completedAt).toDateString()) : [], [quizzes]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader /></div>;

  if (error && !profile)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-red-400 p-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <p className="text-xl">{error}</p>
        <button onClick={() => navigate('/login')} className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition text-sm font-medium border border-[#4A4A4A] text-white">Go to Login</button>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 md:px-6 bg-white/10 backdrop-blur-md border-b border-white/10 shadow-md h-16">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="ProctorX Logo" className="h-10 w-10 text-blue-400" />
          <span className="text-xl font-bold text-white">ProctorX</span>
          <span className="text-xl font-light text-gray-500 hidden sm:inline">/</span>
          <span className="text-lg text-gray-300 hidden sm:inline">Student Dashboard</span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => navigate('/')} aria-label="Home" className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition text-sm font-medium border border-[#4A4A4A]">
            <HomeIcon />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button onClick={() => { alert("Logout clicked"); }} aria-label="Logout" className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-red-800/30 border border-red-700 hover:bg-red-800/50 transition text-sm font-medium text-red-400">
            <LogoutIcon />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-10 pt-20 md:pt-24">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Hello, {profile?.name || 'Student'}</h1>
            <p className="text-gray-400 mt-1">Welcome back! Here's your performance overview.</p>
          </div>
          {profile && (
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <p className="text-sm text-right hidden sm:block">
                <span className="font-semibold text-white">{profile.name}</span><br />
                <span className="text-gray-400">{profile.email}</span>
              </p>
              <img src={profile.profilePicture || `httpshttps://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=0D8ABC&color=fff&bold=true`} alt="Profile" className="w-10 h-10 rounded-full border-2 border-[#2A2A2A]" />
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<BookOpen className="w-6 h-6 text-[#00E1F9]" />} title="Quizzes Taken" value={summaryStats.totalQuizzes} />
          <StatCard icon={<Star className="w-6 h-6 text-[#00E1F9]" />} title="Average Score" value={`${summaryStats.averageScore}%`} />
          <StatCard icon={<Award className="w-6 h-6 text-[#00E1F9]" />} title="Best Score" value={`${summaryStats.bestScore}%`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-4">
          <Card
            className="lg:col-span-2 relative pb-0"

          >
            <h2 className="text-xl font-semibold text-white mb-4">Recent Performance Trend (Last 10)</h2>
            {chartData.length > 1 ? (
              <div className="h-[300px] sm:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E1F9" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#00E1F9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} unit="%" domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 10, 10, 0.8)",
                        borderColor: "#2A2A2A",
                        color: "#e5e7eb",
                        borderRadius: '8px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#fff' }}
                      itemStyle={{ color: '#00E1F9' }}
                      formatter={(value) => `${value.toFixed(1)}%`}
                    />
                    <Area type="monotone" dataKey="Score" stroke="#00E1F9" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] sm:h-[350px] flex items-center justify-center text-gray-500">
                Take at least two quizzes to see your performance graph.
              </div>
            )}
          </Card>
          <Card>
            <h3 className="text-xl font-semibold text-white mb-4">Quiz Activity</h3>
            <CustomCalendar highlightedDates={quizDates} />
          </Card>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-white mb-5 flex items-center gap-3">
            Descriptive Evaluations
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-900/40 text-amber-500 rounded-full border border-amber-500/30 uppercase tracking-wider">Review Required</span>
          </h2>
          {quizzes.some(q => q.responses?.some(r => r.questionType?.toLowerCase() === 'descriptive')) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes
                .filter(q => q.responses?.some(r => r.questionType?.toLowerCase() === 'descriptive'))
                .slice(0, 4)
                .map((q) => {
                  const pendingCount = q.responses?.filter(r => r.questionType?.toLowerCase() === 'descriptive').length || 0;
                  return (
                    <Card key={`eval-${q._id}`} className="hover:bg-[#222222] !p-4 cursor-pointer border-l-4 border-l-amber-500" onClick={() => navigate(`/results/${q._id}`)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-100 group-hover:text-amber-500 transition-colors truncate max-w-[200px]">{q.quiz?.title || "Untitled Quiz"}</h4>
                          <p className="text-[11px] text-gray-500 mt-1">Submitted: {new Date(q.completedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status</p>
                          <span className="text-xs text-amber-500 font-medium">Under Review</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <AlertCircle size={12} className="text-amber-500" />
                          {pendingCount} Question{pendingCount > 1 ? 's' : ''} to grade
                        </span>
                        <span className="text-[#00E1F9] hover:underline">View Details &rarr;</span>
                      </div>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <Card className="text-center py-10 text-gray-500 border-dashed border-white/10 bg-transparent">
              <div className="flex flex-col items-center gap-2">
                <ShieldCheck size={32} className="text-gray-700" />
                <p>No descriptive answers are currently pending evaluation.</p>
              </div>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-white mb-5">Recent Results</h2>
          {quizzes.length === 0 ? (
            <Card className="text-center py-16 text-gray-500">You haven't completed any quizzes yet.</Card>
          ) : (
            <div className="space-y-6">
              {(showAllResults ? quizzes : quizzes.slice(0, 5)).map((quizResult) => {
                const accuracy = quizResult.accuracy ?? 0;
                const scoreColor = accuracy > 75 ? "text-emerald-400" : accuracy > 50 ? "text-yellow-400" : "text-red-400";
                const bgColor = accuracy > 75 ? "bg-emerald-900/30" : accuracy > 50 ? "bg-yellow-900/30" : "bg-red-900/30";
                return (
                  <Card key={quizResult._id} className="!p-0 flex flex-col md:flex-row items-stretch justify-between hover:bg-[#222222] !border-[#2A2A2A] hover:!border-[#00E1F9]/50 cursor-pointer group" onClick={() => navigate(`/results/${quizResult._id}`)}>
                    <div className="flex items-center gap-4 p-4 md:p-5 flex-grow">
                      <div className={`p-3 rounded-lg ${bgColor}`}>
                        <Award className={`w-6 h-6 ${scoreColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-white group-hover:text-[#00E1F9] transition-colors">{quizResult.quiz?.title || "Untitled Quiz"}</h3>
                        <p className="text-xs text-gray-400 mt-1">Completed: {new Date(quizResult.completedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-4 md:gap-6 px-4 py-3 md:px-5 md:py-5 border-t border-[#2A2A2A] md:border-t-0 md:border-l">
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Score</p>
                        <p className={`text-lg font-semibold ${scoreColor}`}>
                          {quizResult.score ?? 'N/A'}/{(quizResult.responses?.reduce((acc, r) => acc + (r.marks || 0), 0)) || quizResult.totalQuestions || 'N/A'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Accuracy</p>
                        <p className={`text-lg font-semibold ${scoreColor}`}>{accuracy.toFixed(1)}%</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#00E1F9] transition-colors ml-2" />
                    </div>
                  </Card>
                );
              })}
              {quizzes.length > 5 && (
                <div className="text-center mt-4">
                  <button onClick={() => setShowAllResults(!showAllResults)} className="text-sm text-[#00E1F9] hover:underline">
                    {showAllResults ? "Show Less" : "View All Results"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;