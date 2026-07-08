import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Award, Compass, ShieldAlert, ChevronRight, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Loader = () => (
  <div className="flex flex-col items-center justify-center gap-4 h-full py-20">
    <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading records...</p>
  </div>
);

const Card = React.forwardRef(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm transition-all duration-300 ${className}`}
    {...props}
  >
    {children}
  </div>
));

const StatCard = ({ icon, title, value, textColor, bgColor, borderColor }) => (
  <Card className="flex flex-col justify-between h-full hover:shadow-md">
    <div>
      <div className={`text-xl mb-4 p-3 w-fit rounded-xl ${bgColor} border ${borderColor} ${textColor}`}>
        {icon}
      </div>
      <p className="text-3xl font-extrabold text-black">{value}</p>
      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1.5">{title}</p>
    </div>
  </Card>
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

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

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
      <div
        key={day}
        className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-colors mx-auto ${isHighlighted ? 'bg-black text-white' : isToday ? 'bg-gray-100 text-black' : 'text-gray-500 hover:bg-gray-50 hover:text-black'
          }`}
      >
        {day}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="text-gray-400 hover:text-black p-1 rounded-full border border-transparent hover:border-gray-200 transition-all font-bold">&lt;</button>
        <h3 className="font-bold text-black text-sm uppercase tracking-wide">
          {currentDate.toLocaleString('default', { month: 'long' })} {year}
        </h3>
        <button onClick={() => changeMonth(1)} className="text-gray-400 hover:text-black p-1 rounded-full border border-transparent hover:border-gray-200 transition-all font-bold">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {daysOfWeek.map(day => <div key={day} className="font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-2">{day}</div>)}
        {calendarDays}
      </div>
    </div>
  );
};

const QuizCountdownItem = ({ quiz, onStart }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!quiz.scheduledAt) return;
    const calculateTimeLeft = () => {
      const diff = new Date(quiz.scheduledAt).getTime() - Date.now();
      return diff > 0 ? diff : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz.scheduledAt]);

  const isStarted = quiz.status === 'ACTIVE';
  const isScheduled = !!quiz.scheduledAt;
  
  // For manual quizzes (not scheduled), students can enter the waiting room anytime to wait for the host.
  // For scheduled quizzes, students can only enter 5 mins before.
  const isWaitingRoomOpen = isStarted || !isScheduled || (isScheduled && timeLeft !== null && timeLeft <= 5 * 60 * 1000);

  const formatTimeDetailed = (ms) => {
    if (ms === null) return { days: '00', hours: '00', minutes: '00', seconds: '00' };
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hrs = Math.floor(min / 60);
    const days = Math.floor(hrs / 24);

    return {
      days: days.toString().padStart(2, '0'),
      hours: (hrs % 24).toString().padStart(2, '0'),
      minutes: (min % 60).toString().padStart(2, '0'),
      seconds: (sec % 60).toString().padStart(2, '0')
    };
  };

  const time = formatTimeDetailed(timeLeft);

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-sm flex flex-col lg:flex-row items-center gap-6 ${
      isStarted ? 'bg-white border-green-200' : 'bg-white border-gray-200'
    }`}>
      {/* Left: Info */}
      <div className="flex-1 w-full lg:w-auto lg:border-r border-gray-100 lg:pr-6">
        <div className="flex justify-between items-start">
           <div>
             <h4 className="text-lg font-extrabold text-black">{quiz.title}</h4>
             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1.5">
               Duration: {quiz.durationInMinutes} mins
             </p>
           </div>
           <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest border ${
             isStarted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
           }`}>
             {isStarted ? 'Live Now' : (isScheduled ? 'Scheduled' : 'Manual Start')}
           </span>
        </div>
        {!isStarted && isScheduled && (
          <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-widest">
            Scheduled: {new Date(quiz.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        )}
      </div>

      {/* Middle: Timer or OTP */}
      <div className="flex-1 w-full lg:w-auto flex flex-col items-center justify-center min-w-[250px] py-4 lg:py-0 border-y lg:border-y-0 border-gray-100">
        {!isStarted ? (
          isScheduled ? (
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Starts In</p>
              <div className="flex justify-center gap-4">
                 <div className="flex flex-col items-center">
                   <span className="text-2xl font-black text-black tabular-nums">{time.days}</span>
                   <span className="text-[9px] uppercase tracking-wider text-gray-400 mt-1">Days</span>
                 </div>
                 <span className="text-xl font-bold text-gray-300 mt-0.5">:</span>
                 <div className="flex flex-col items-center">
                   <span className="text-2xl font-black text-black tabular-nums">{time.hours}</span>
                   <span className="text-[9px] uppercase tracking-wider text-gray-400 mt-1">Hrs</span>
                 </div>
                 <span className="text-xl font-bold text-gray-300 mt-0.5">:</span>
                 <div className="flex flex-col items-center">
                   <span className="text-2xl font-black text-black tabular-nums">{time.minutes}</span>
                   <span className="text-[9px] uppercase tracking-wider text-gray-400 mt-1">Min</span>
                 </div>
                 <span className="text-xl font-bold text-gray-300 mt-0.5">:</span>
                 <div className="flex flex-col items-center">
                   <span className="text-2xl font-black text-black tabular-nums">{time.seconds}</span>
                   <span className="text-[9px] uppercase tracking-wider text-gray-400 mt-1">Sec</span>
                 </div>
              </div>
            </div>
          ) : (
            <div className="text-center w-full">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Status</p>
               <div className="bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-6 inline-block w-full max-w-[240px]">
                 <span className="text-sm font-bold text-gray-600 tracking-wider">Waiting for Host...</span>
               </div>
            </div>
          )
        ) : (
          <div className="text-center w-full">
             <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2.5">Entry Code</p>
             <div className="bg-green-50/50 border border-green-100 rounded-lg py-2.5 px-6 inline-block w-full max-w-[240px]">
               <span className="text-2xl sm:text-3xl font-mono font-black text-green-700 tracking-[0.2em] ml-1">{quiz.otp || '------'}</span>
             </div>
          </div>
        )}
      </div>

      {/* Right: Action */}
      <div className="w-full lg:w-auto lg:pl-4 shrink-0 flex flex-col items-center justify-center">
        <button
          onClick={() => isWaitingRoomOpen && onStart(quiz.quizId)}
          disabled={!isWaitingRoomOpen}
          className={`w-full lg:w-[200px] py-3.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 ${
            isStarted 
              ? 'bg-black text-white hover:bg-gray-900' 
              : isWaitingRoomOpen 
                ? 'bg-gray-800 text-white hover:bg-black' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
          }`}
        >
          {isStarted ? "Start Assessment \u2192" : "Enter Waiting Room \u2192"}
        </button>
        {!isStarted && !isWaitingRoomOpen && isScheduled && (
          <p className="text-[9px] text-gray-400 font-bold mt-2 text-center uppercase tracking-wider">
            Opens 5 mins before
          </p>
        )}
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await api.get(`/api/students/dashboard?t=${new Date().getTime()}`);
        setProfile(res.data.profile);
        setQuizzes(res.data.quizzes || []);
        setUpcomingQuizzes(res.data.upcomingQuizzes || []);
      } catch (err) {
        if (!silent) setError("Failed to load dashboard data. Check your credentials.");
      } finally {
        if (!silent) setLoading(false);
      }
    };
    
    fetchDashboard();

    // Auto-poll every 10 seconds so OTPs and quiz status auto-refresh exactly when they start
    const pollInterval = setInterval(() => {
      fetchDashboard(true);
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) return;

    try {
      setJoining(true);
      const res = await api.post("/api/classrooms/join", { code: classCode });
      toast.success(res.data.message || `Joined classroom!`);
      setClassCode("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid classroom code.");
    } finally {
      setJoining(false);
    }
  };

  const summaryStats = useMemo(() => {
    const totalQuizzes = quizzes.length;
    const averageScore =
      totalQuizzes > 0
        ? (quizzes.reduce((acc, q) => acc + q.accuracy, 0) / totalQuizzes).toFixed(1)
        : "0.0";
    const bestScore =
      totalQuizzes > 0
        ? Math.max(...quizzes.map(q => q.accuracy)).toFixed(1)
        : "0.0";
    return { totalQuizzes, averageScore, bestScore };
  }, [quizzes]);

  const chartData = useMemo(() => {
    return [...quizzes]
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .map((q) => ({
        date: new Date(q.completedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: q.accuracy,
      }));
  }, [quizzes]);

  const quizDates = useMemo(() => quizzes.map((q) => new Date(q.completedAt).toDateString()), [quizzes]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-sm text-center shadow-sm">
          <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-900 mb-2">Access Denied</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-gray-50 text-black font-sans pb-12"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Sleek Topbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-extrabold text-lg">
              PX
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">Student Portal</h1>
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mt-1">Assessment Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-extrabold text-black text-sm">{profile?.name}</p>
              <p className="text-xs text-gray-500 font-medium">{profile?.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
              <img
                src={profile?.profilePicture || "https://placehold.co/100x100/eeeeee/000000?text=User"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 space-y-8">

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<Compass className="w-5 h-5" />} title="Quizzes Taken" value={summaryStats.totalQuizzes} textColor="text-black" bgColor="bg-gray-100" borderColor="border-gray-200" />
          <StatCard icon={<ShieldAlert className="w-5 h-5" />} title="Average Score" value={`${summaryStats.averageScore}%`} textColor="text-gray-600" bgColor="bg-white" borderColor="border-gray-200" />
          <StatCard icon={<Award className="w-5 h-5" />} title="Best Score" value={`${summaryStats.bestScore}%`} textColor="text-green-600" bgColor="bg-green-50" borderColor="border-green-100" />
        </div>

        {/* Join Classroom Card */}
        <Card className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white hover:border-gray-300">
          <div className="flex-1">
            <h3 className="text-sm font-extrabold text-black flex items-center gap-2 uppercase tracking-wide">
              <Compass className="w-4 h-4 text-black" /> Self-Enroll in Classroom
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">Have a classroom sharing code? Enter it below to join and access restricted exams.</p>
          </div>
          <form onSubmit={handleJoinClassroom} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="e.g. CL-XXXXXX"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black uppercase font-mono tracking-wider w-full sm:w-48 transition-all"
              required
            />
            <button
              type="submit"
              disabled={joining}
              className="px-6 py-2.5 rounded-lg bg-black hover:bg-gray-900 text-white font-bold text-xs transition-all shadow-sm whitespace-nowrap disabled:opacity-50"
            >
              {joining ? "Joining..." : "Join Class"}
            </button>
          </form>
        </Card>

        {/* Upcoming & Live Assessments */}
        <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-2xl space-y-6 shadow-sm">
          <h2 className="text-sm font-extrabold text-black flex items-center gap-2 uppercase tracking-wide border-b border-gray-100 pb-4">
            <Clock className="w-4 h-4 text-black" /> Upcoming & Active Assessments
          </h2>
          {upcomingQuizzes.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl py-12 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No assigned assessments</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {upcomingQuizzes.map((quiz) => (
                <QuizCountdownItem
                  key={quiz.id}
                  quiz={quiz}
                  onStart={(qId) => navigate(`/exam/${qId || quiz.quizId}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Chart + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h2 className="text-sm font-extrabold text-black uppercase tracking-wide border-b border-gray-100 pb-4 mb-6">Quiz Performance Track</h2>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} unit="%" dx={-10} />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      color: "#000",
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                    itemStyle={{ color: '#000' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#000000" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} activeDot={{ r: 4, fill: "#000", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                Complete at least two exams to chart progress
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wide border-b border-gray-100 pb-4 mb-6 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-black" /> Exam Schedule
            </h3>
            <CustomCalendar highlightedDates={quizDates} />
          </Card>
        </div>

        {/* Results List */}
        <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-2xl shadow-sm space-y-6">
          <h2 className="text-sm font-extrabold text-black uppercase tracking-wide border-b border-gray-100 pb-4">Recent assessment results</h2>
          {quizzes.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl py-12 text-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No results recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => {
                const isPass = quiz.accuracy >= 50;
                const scoreColor = isPass ? "text-green-700" : "text-red-600";
                const bgColor = isPass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
                const iconColor = isPass ? "text-green-600" : "text-red-500";

                return (
                  <div
                    key={quiz.resultId}
                    className="p-5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer transition-all shadow-sm hover:shadow-md group"
                    onClick={() => navigate(`/results/${quiz.resultId}`)}
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className={`p-3 rounded-xl border ${bgColor}`}>
                        <Award className={`w-5 h-5 ${iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-black text-sm group-hover:text-gray-700 transition-colors">{quiz.quizTitle}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">Attempted on {new Date(quiz.completedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-4 sm:pt-0">
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Score</p>
                        <p className={`text-sm font-extrabold ${scoreColor} mt-0.5`}>{quiz.score} / {quiz.totalQuestions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Accuracy</p>
                        <p className={`text-sm font-extrabold ${scoreColor} mt-0.5`}>{quiz.accuracy.toFixed(1)}%</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
export { StudentDashboard };
