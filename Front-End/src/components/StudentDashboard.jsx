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

// --- INLINE SVGS to remove react-icons dependency ---
const FaTrophy = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M552 64H448V48C448 21.49 426.51 0 400 0H176c-26.51 0-48 21.49-48 48v16H24C10.745 64 0 74.745 0 88v56c0 30.928 25.072 56 56 56h8v272c0 30.928 25.072 56 56 56h288c30.928 0 56-25.072 56-56V200h8c30.928 0 56-25.072 56-56V88c0-13.255-10.745-24-24-24zM176 48h224v16H176V48zm-48 128h32v64H96v-64h32zm320 0h32v64h-32v-64z"></path></svg>
);
const MdQuiz = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"></path></svg>
);
const FaStar = ({ className }) => (
    <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"></path></svg>
);
const MdArrowForward = ({ size }) => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height={size} width={size} xmlns="http://www.w3.org/2000/svg"><path d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg>
);

// --- INLINE Loader component to remove local dependency ---
const Loader = () => (
    <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-fuchsia-500"></div>
        <p className="text-lg text-gray-300">Loading Dashboard...</p>
    </div>
);

// --- A styled card component ---
const Card = React.forwardRef(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={`bg-[#1F2328] rounded-2xl p-6 transition-all duration-300 ${className}`}
    {...props}
  >
    {children}
  </div>
));

// --- A component for the main statistic cards ---
const StatCard = ({ icon, title, value, color }) => (
    <Card className={`relative overflow-hidden flex flex-col justify-between h-full`}>
        <div>
            <div className={`text-3xl mb-4 p-3 w-fit rounded-full`} style={{backgroundColor: `${color}1A`, color: color}}>
                {icon}
            </div>
            <p className="text-4xl font-bold text-white">{value}</p>
            <p className="text-gray-400 mt-1">{title}</p>
        </div>
    </Card>
);

// --- Custom Calendar to remove react-calendar dependency ---
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
    // Add empty divs for days before the start of the month
    for (let i = 0; i < startingDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    // Add divs for each day of the month
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = new Date(year, month, day).toDateString();
        const todayStr = new Date().toDateString();

        const isHighlighted = highlightedDates.includes(dateStr);
        const isToday = dateStr === todayStr;
        
        calendarDays.push(
            <div key={day} className={`flex items-center justify-center h-10 w-10 rounded-full text-sm transition-colors ${isHighlighted ? 'bg-fuchsia-600 text-white font-bold' : isToday ? 'bg-gray-700 text-white' : 'text-gray-200 hover:bg-gray-800'}`}>
                {day}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeMonth(-1)} className="text-gray-400 hover:text-white p-2 rounded-full">&lt;</button>
                <h3 className="font-bold text-white text-lg">
                    {currentDate.toLocaleString('default', { month: 'long' })} {year}
                </h3>
                <button onClick={() => changeMonth(1)} className="text-gray-400 hover:text-white p-2 rounded-full">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
                {daysOfWeek.map(day => <div key={day} className="font-semibold text-xs text-gray-500 uppercase">{day}</div>)}
                {calendarDays}
            </div>
        </div>
    );
};

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated. Please log in.");
      setLoading(false);
      return;
    }

    const fetchProfileAndResults = async () => {
      try {
        const [profileRes, resultsRes] = await Promise.all([
          axios.get("http://localhost:8000/students/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8000/api/results/my-results", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProfile(profileRes.data);
        setQuizzes(resultsRes.data);
      } catch {
        setError("Failed to load your dashboard data. Please ensure the backend is running and you are logged in.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndResults();
  }, []);

  const summaryStats = useMemo(() => {
    const totalQuizzes = quizzes.length;
    const averageScore =
      totalQuizzes > 0
        ? (
            quizzes.reduce((acc, q) => acc + q.accuracy, 0) / totalQuizzes
          ).toFixed(1)
        : "N/A";
    const bestScore = 
      totalQuizzes > 0 
        ? Math.max(...quizzes.map(q => q.accuracy)).toFixed(1)
        : "N/A";
    return { totalQuizzes, averageScore, bestScore };
  }, [quizzes]);

  const chartData = quizzes
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
    .map((q) => ({
      date: new Date(q.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: q.accuracy,
    }));

  const quizDates = useMemo(() => quizzes.map((q) => new Date(q.completedAt).toDateString()), [quizzes]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#16191C]">
        <Loader />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#16191C] text-red-400 p-8 text-center">
        {error}
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#16191C] text-gray-400">
        Could not find profile data.
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-[#16191C] text-gray-200 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Hello, {profile.name}</h1>
                <p className="text-gray-400 mt-1">Welcome to your dashboard. Let's see your progress!</p>
            </div>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <p className="text-sm text-right">
                    <span className="font-semibold text-white">{profile.name}</span><br/>
                    <span className="text-gray-400">{profile.email}</span>
                </p>
                <img src={profile.profilePicture || "/default-profile.png"} alt="Profile" className="w-12 h-12 rounded-full"/>
            </div>
        </header>

        {/* --- Stats Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <StatCard icon={<MdQuiz className="w-6 h-6"/>} title="Quizzes Taken" value={summaryStats.totalQuizzes} color="#38BDF8"/>
            <StatCard icon={<FaStar className="w-6 h-6"/>} title="Average Score" value={`${summaryStats.averageScore}%`} color="#FBBE24"/>
            <StatCard icon={<FaTrophy className="w-6 h-6"/>} title="Best Score" value={`${summaryStats.bestScore}%`} color="#34D399"/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* --- Performance Chart --- */}
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Quiz Performance</h2>
            {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2b31" />
                        <XAxis dataKey="date" stroke="#888" fontSize={12} />
                        <YAxis stroke="#888" fontSize={12} unit="%" />
                        <Tooltip
                            contentStyle={{
                                background: "#1F2328",
                                border: "1px solid #2a2b31",
                                color: "#fff",
                                borderRadius: '12px'
                            }}
                            labelStyle={{fontWeight: 'bold'}}
                        />
                        <Area type="monotone" dataKey="score" stroke="#8884d8" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-500">
                    Take at least two quizzes to see your performance graph.
                </div>
            )}
          </Card>

          {/* --- Calendar --- */}
          <Card>
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Calendar</h3>
                <button className="text-sm font-medium text-gray-400 hover:text-white">View</button>
             </div>
             <CustomCalendar highlightedDates={quizDates} />
          </Card>
        </div>

        {/* --- My Results List --- */}
        <div>
            <h2 className="text-2xl font-semibold text-white mb-5">Recent Results</h2>
            {quizzes.length === 0 ? (
                <Card className="text-center py-16 text-gray-500">
                    You haven't completed any quizzes yet.
                </Card>
            ) : (
                <div className="space-y-4">
                    {quizzes.map((quiz) => {
                        const scoreColor = quiz.accuracy > 75 ? "text-emerald-400" : quiz.accuracy > 50 ? "text-yellow-400" : "text-red-400";
                        const bgColor = quiz.accuracy > 75 ? "bg-emerald-500/10" : quiz.accuracy > 50 ? "bg-yellow-500/10" : "bg-red-500/10";
                        
                        return (
                            <Card 
                                key={quiz._id}
                                className="!p-0 flex flex-col md:flex-row items-center justify-between hover:bg-[#2a2e34] cursor-pointer"
                                onClick={() => navigate(`/results/${quiz._id}`)}
                            >
                               <div className="p-6 flex items-center gap-4 w-full md:w-auto">
                                    <div className={`p-3 rounded-lg ${bgColor}`}>
                                        <FaTrophy className={`text-xl ${scoreColor}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{quiz.quiz?.title || "Untitled Quiz"}</h3>
                                        <p className="text-sm text-gray-400">Completed: {new Date(quiz.completedAt).toLocaleDateString()}</p>
                                    </div>
                               </div>

                               <div className="flex items-center gap-8 px-6 pb-6 md:pb-0 md:p-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-400">Score</p>
                                        <p className={`text-xl font-semibold ${scoreColor}`}>{quiz.score}/{quiz.totalQuestions}</p>
                                    </div>
                                     <div className="text-center">
                                        <p className="text-sm text-gray-400">Accuracy</p>
                                        <p className={`text-xl font-semibold ${scoreColor}`}>{quiz.accuracy.toFixed(1)}%</p>
                                    </div>
                                    <button className="text-gray-400 hover:text-white transition-colors">
                                        <MdArrowForward size={24} />
                                    </button>
                               </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

