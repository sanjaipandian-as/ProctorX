import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
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
import { Loader2, AlertCircle, BookOpen, Star, Award, ArrowRight, Home, LogOut } from 'lucide-react';
import API from "../../Api";

const Loader = ({ message = "Loading Dashboard..." }) => (
    <div className="flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-16 h-16 animate-spin text-[#00E1F9]" />
        <p className="text-lg text-gray-300">{message}</p>
    </div>
);

const Card = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-md p-6 transition-all duration-300 ${className}`}
    {...props}
  >
    {children}
  </div>
));

const StatCard = ({ title, value, subtitle, icon, iconBgColor = 'bg-[#00333A]' }) => {
    return (
        <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#2A2A2A] flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-400 font-medium">{title}</p>
                <p className="text-3xl font-bold text-[#00E1F9] mt-2">{value}</p>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-full ${iconBgColor}`}>
                {icon}
            </div>
        </div>
    );
};

const CustomCalendar = ({ highlightedDates }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDay = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const changeMonth = (offset) => {
        setCurrentDate(new Date(year, month + offset, 1));
    }

    const calendarDays = [];
    for (let i = 0; i < startingDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = new Date(year, month, day).toDateString();
        const todayStr = new Date().toDateString();

        const isHighlighted = highlightedDates.includes(dateStr);
        const isToday = dateStr === todayStr;

        calendarDays.push(
            <div key={day} className={`flex items-center justify-center h-9 w-9 rounded-full text-sm transition-colors ${isHighlighted ? 'bg-[#00E1F9] text-black font-bold' : isToday ? 'bg-[#2A2A2A] text-white' : 'text-gray-300 hover:bg-[#2A2A2A]'}`}>
                {day}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeMonth(-1)} className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#2A2A2A]">&lt;</button>
                <h3 className="font-bold text-white text-base">
                    {currentDate.toLocaleString('default', { month: 'long' })} {year}
                </h3>
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
                    API.get("/students/me", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    API.get("/api/results/my-results", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
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
    }, [navigate]);

    const summaryStats = useMemo(() => {
        if (!Array.isArray(quizzes) || quizzes.length === 0) {
            return { totalQuizzes: 0, averageScore: "0.0", bestScore: "0.0" };
        }
        const totalQuizzes = quizzes.length;
        const averageScore = (quizzes.reduce((acc, q) => acc + (q.accuracy ?? 0), 0) / totalQuizzes).toFixed(1);
        const bestScore = Math.max(...quizzes.map(q => q.accuracy ?? 0)).toFixed(1);
        return { totalQuizzes, averageScore, bestScore };
    }, [quizzes]);

    const chartData = useMemo(() =>
        Array.isArray(quizzes) ? quizzes
        .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
        .slice(-10)
        .map((q) => ({
            date: new Date(q.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            Score: q.accuracy ?? 0,
        })) : [],
    [quizzes]);


    const quizDates = useMemo(() => Array.isArray(quizzes) ? quizzes.map((q) => new Date(q.completedAt).toDateString()) : [], [quizzes]);

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader />
            </div>
        );

    if (error && !profile)
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-red-400 p-8 text-center">
                 <AlertCircle className="h-16 w-16 text-red-500 mb-4"/>
                <p className="text-xl">{error}</p>
                 <button onClick={() => navigate('/login')} className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition text-sm font-medium border border-[#4A4A4A] text-white">
                    Go to Login
                </button>
            </div>
        );
    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
             <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-white/10 backdrop-blur-md border-b border-white/10 shadow-md h-16">
                 <div className="flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-blue-400" />
                     <span className="text-xl font-bold text-white">ProctorX</span>
                     <span className="text-xl font-light text-gray-500">/</span>
                    <span className="text-lg text-gray-300">Student Dashboard</span>
                 </div>
                 <nav className="flex items-center gap-4">
                     <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition text-sm font-medium border border-[#4A4A4A]">
                         <HomeIcon />
                         <span>Home</span>
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

            <main className="flex-1 p-4 md:p-10 pt-20 md:pt-24 overflow-y-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Hello, {profile?.name || 'Student'}</h1>
                        <p className="text-gray-400 mt-1">Welcome back! Here's your performance overview.</p>
                    </div>
                    {profile && (
                        <div className="flex items-center gap-3 mt-4 sm:mt-0">
                            <p className="text-sm text-right hidden md:block">
                                <span className="font-semibold text-white">{profile.name}</span><br/>
                                <span className="text-gray-400">{profile.email}</span>
                            </p>
                            <img src={profile.profilePicture || `https://ui-avatars.com/api/?name=${profile.name}&background=0D8ABC&color=fff&bold=true`} alt="Profile" className="w-10 h-10 rounded-full border-2 border-[#2A2A2A]"/>
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    <StatCard icon={<BookOpen className="w-6 h-6 text-[#00E1F9]"/>} title="Quizzes Taken" value={summaryStats.totalQuizzes} />
                    <StatCard icon={<Star className="w-6 h-6 text-[#00E1F9]"/>} title="Average Score" value={`${summaryStats.averageScore}%`} />
                    <StatCard icon={<Award className="w-6 h-6 text-[#00E1F9]"/>} title="Best Score" value={`${summaryStats.bestScore}%`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <Card className="lg:col-span-2">
                        <h2 className="text-xl font-semibold text-white mb-4">Recent Performance Trend (Last 10)</h2>
                        {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00E1F9" stopOpacity={0.6}/>
                                            <stop offset="95%" stopColor="#00E1F9" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                                    <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={11} unit="%" domain={[0, 100]} tickLine={false} axisLine={false}/>
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
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-gray-500">
                                Take at least two quizzes to see your performance graph.
                            </div>
                        )}
                    </Card>

                    <Card>
                         <h3 className="text-xl font-semibold text-white mb-4">Quiz Activity</h3>
                         <CustomCalendar highlightedDates={quizDates} />
                    </Card>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold text-white mb-5">Recent Results</h2>
                    {quizzes.length === 0 ? (
                        <Card className="text-center py-16 text-gray-500">
                            You haven't completed any quizzes yet.
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {quizzes.slice(0, 5).map((quizResult) => { 
                                const accuracy = quizResult.accuracy ?? 0;
                                const scoreColor = accuracy > 75 ? "text-emerald-400" : accuracy > 50 ? "text-yellow-400" : "text-red-400";
                                const bgColor = accuracy > 75 ? "bg-emerald-900/30" : accuracy > 50 ? "bg-yellow-900/30" : "bg-red-900/30";

                                return (
                                    <Card
                                        key={quizResult._id}
                                        className="!p-0 flex flex-col md:flex-row items-stretch justify-between hover:bg-[#2a2e34] cursor-pointer group"
                                        onClick={() => navigate(`/results/${quizResult._id}`)}
                                    >
                                       <div className="flex items-center gap-4 p-4 md:p-5 flex-grow">
                                            <div className={`p-3 rounded-lg ${bgColor}`}>
                                               <Award className={`w-6 h-6 ${scoreColor}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-base text-white group-hover:text-[#00E1F9] transition-colors">{quizResult.quiz?.title || "Untitled Quiz"}</h3>
                                                <p className="text-xs text-gray-400 mt-1">Completed: {new Date(quizResult.completedAt).toLocaleDateString()}</p>
                                            </div>
                                       </div>

                                       <div className="flex items-center justify-end gap-6 px-4 py-3 md:px-5 md:py-5 border-t border-[#2A2A2A] md:border-t-0 md:border-l">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400">Score</p>
                                                <p className={`text-lg font-semibold ${scoreColor}`}>{quizResult.score ?? 'N/A'}/{quizResult.totalQuestions ?? 'N/A'}</p>
                                            </div>
                                             <div className="text-center">
                                                <p className="text-xs text-gray-400">Accuracy</p>
                                                <p className={`text-lg font-semibold ${scoreColor}`}>{accuracy.toFixed(1)}%</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#00E1F9] transition-colors" />
                                       </div>
                                    </Card>
                                )
                            })}
                            {quizzes.length > 5 && (
                                <div className="text-center mt-4">
                                     <button onClick={() => alert("Navigate to all results page - not implemented")} className="text-sm text-[#00E1F9] hover:underline">
                                        View All Results
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