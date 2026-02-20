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
import {
  Loader2, AlertCircle, BookOpen, Star, Award,
  ArrowRight, Clock, Calendar as CalendarIcon,
  TrendingUp, Target, Zap
} from 'lucide-react';
import API from "../../Api";
import { Topbar } from "./Topbar";
import { Button } from "../ui/Button";

// --- Components ---

const Loader = ({ message = "Loading Dashboard..." }) => (
  <div className="flex flex-col items-center justify-center gap-4">
    <Loader2 className="w-12 h-12 animate-spin text-[#FFB343]" />
    <p className="text-gray-600 font-medium">{message}</p>
  </div>
);

const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-[#FFB343]/30">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-orange-50 rounded-xl">
        <Icon className="w-6 h-6 text-[#FFB343]" />
      </div>
      {trend && (
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const CustomCalendar = ({ highlightedDates }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const changeMonth = (offset) => setCurrentDate(new Date(year, month + offset, 1));

  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) calendarDays.push(<div key={`empty-${i}`} />);
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = new Date(year, month, day).toDateString();
    const todayStr = new Date().toDateString();
    const isHighlighted = highlightedDates.includes(dateStr);
    const isToday = dateStr === todayStr;

    calendarDays.push(
      <div
        key={day}
        className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all
          ${isHighlighted ? 'bg-[#FFB343] text-white font-bold shadow-sm' :
            isToday ? 'bg-orange-50 text-[#FFB343] font-semibold border border-orange-200' :
              'text-gray-600 hover:bg-gray-50'}`}
      >
        {day}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            ←
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            →
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-3">
        {daysOfWeek.map((day, i) => (
          <div key={i} className="text-center text-xs font-bold text-gray-400">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
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
  const [showAllResults, setShowAllResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Session expired. Please sign in again.");
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
        setError("Unable to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndResults();
  }, []);

  const summaryStats = useMemo(() => {
    if (!Array.isArray(quizzes) || quizzes.length === 0)
      return { totalQuizzes: 0, averageScore: "0", bestScore: "0" };

    const validQuizzes = quizzes.filter(q => typeof q.accuracy === 'number');
    if (validQuizzes.length === 0)
      return { totalQuizzes: quizzes.length, averageScore: "0", bestScore: "0" };

    const totalQuizzes = quizzes.length;
    const averageScore = Math.round(validQuizzes.reduce((acc, q) => acc + q.accuracy, 0) / validQuizzes.length);
    const bestScore = Math.round(Math.max(...validQuizzes.map(q => q.accuracy)));
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

  const quizDates = useMemo(() =>
    Array.isArray(quizzes) ? quizzes.map(q => new Date(q.completedAt).toDateString()) : [],
    [quizzes]
  );

  // Skeleton Components
  const SkeletonPulse = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );

  const DashboardSkeleton = () => (
    <div className="max-w-7xl mx-auto px-6 pt-12 pb-16">
      {/* Header Skeleton */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <div>
            <SkeletonPulse className="h-10 w-64 mb-2" />
            <SkeletonPulse className="h-5 w-48" />
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
            <SkeletonPulse className="w-10 h-10 rounded-lg" />
            <div>
              <SkeletonPulse className="h-4 w-32 mb-1" />
              <SkeletonPulse className="h-3 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <SkeletonPulse className="w-12 h-12 rounded-xl" />
            </div>
            <div>
              <SkeletonPulse className="h-4 w-24 mb-2" />
              <SkeletonPulse className="h-8 w-16 mb-2" />
              <SkeletonPulse className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Calendar Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 h-[400px]">
          <div className="flex justify-between mb-6">
            <SkeletonPulse className="h-6 w-48" />
            <SkeletonPulse className="h-8 w-8 rounded-lg" />
          </div>
          <SkeletonPulse className="h-[280px] w-full rounded-xl" />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 h-[400px]">
          <SkeletonPulse className="h-6 w-32 mb-6" />
          <SkeletonPulse className="h-[300px] w-full rounded-xl" />
        </div>
      </div>

      {/* Recent Results Skeleton */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <SkeletonPulse className="h-8 w-48 mb-2" />
            <SkeletonPulse className="h-4 w-32" />
          </div>
          <SkeletonPulse className="h-5 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex justify-between mb-4">
                <SkeletonPulse className="w-12 h-12 rounded-xl" />
                <SkeletonPulse className="w-16 h-6 rounded-full" />
              </div>
              <SkeletonPulse className="h-6 w-3/4 mb-2" />
              <SkeletonPulse className="h-4 w-24 mb-6" />
              <div className="flex justify-between pt-4 border-t border-gray-100">
                <div className="space-y-1">
                  <SkeletonPulse className="h-3 w-10" />
                  <SkeletonPulse className="h-6 w-12" />
                </div>
                <div className="space-y-1 text-right">
                  <SkeletonPulse className="h-3 w-16 ml-auto" />
                  <SkeletonPulse className="h-6 w-16 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Topbar />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate('/student-login')}
            className="w-full bg-[#FFB343] hover:bg-[#E5A03C] text-white rounded-xl h-11"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Topbar />

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.name?.split(' ')[0] || 'Student'}
              </h1>
              <p className="text-gray-500">Here's your performance overview</p>
            </div>
            {profile && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <img
                  src={profile.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=FFB343&color=fff&bold=true`}
                  alt="Profile"
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                  <p className="text-xs text-gray-500">{profile.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={BookOpen}
            title="Total Quizzes"
            value={summaryStats.totalQuizzes}
            subtitle="Completed assessments"
          />
          <StatCard
            icon={TrendingUp}
            title="Average Score"
            value={`${summaryStats.averageScore}%`}
            subtitle="Overall performance"
            trend={summaryStats.averageScore >= 70 ? "↑ Good" : null}
          />
          <StatCard
            icon={Award}
            title="Best Score"
            value={`${summaryStats.bestScore}%`}
            subtitle="Highest achievement"
          />
        </div>

        {/* Chart & Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Chart */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Performance Trend</h2>
                <p className="text-sm text-gray-500">Last 10 quiz results</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-[#FFB343]" />
              </div>
            </div>

            {chartData.length > 1 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFB343" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FFB343" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      unit="%"
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: '12px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      labelStyle={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}
                      itemStyle={{ color: '#FFB343', fontWeight: '600' }}
                      formatter={(value) => [`${value.toFixed(1)}%`, 'Score']}
                    />
                    <Area
                      type="monotone"
                      dataKey="Score"
                      stroke="#FFB343"
                      strokeWidth={2.5}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center bg-gray-50 rounded-xl">
                <Target className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Not enough data</p>
                <p className="text-sm text-gray-400">Complete at least 2 quizzes to see trends</p>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <CalendarIcon className="w-5 h-5 text-[#FFB343]" />
              <h2 className="text-lg font-bold text-gray-900">Activity</h2>
            </div>
            <CustomCalendar highlightedDates={quizDates} />
          </div>
        </div>

        {/* Recent Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Results</h2>
              <p className="text-sm text-gray-500 mt-1">Your latest quiz attempts</p>
            </div>
            {quizzes.length > 5 && (
              <button
                onClick={() => setShowAllResults(!showAllResults)}
                className="text-sm font-semibold text-[#FFB343] hover:text-[#E5A03C] transition-colors"
              >
                {showAllResults ? "Show Less" : "View All"}
              </button>
            )}
          </div>

          {quizzes.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No quizzes yet</h3>
              <p className="text-gray-500 mb-6">Start your first assessment to see results here</p>
              <Button
                onClick={() => navigate('/')}
                className="bg-[#FFB343] hover:bg-[#E5A03C] text-white rounded-xl px-6"
              >
                Browse Quizzes
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(showAllResults ? quizzes : quizzes.slice(0, 6)).map((result) => {
                const accuracy = result.accuracy ?? 0;
                const scoreColor = accuracy >= 80 ? "text-emerald-600" : accuracy >= 60 ? "text-[#FFB343]" : "text-red-600";
                const bgColor = accuracy >= 80 ? "bg-emerald-50" : accuracy >= 60 ? "bg-orange-50" : "bg-red-50";
                const borderColor = accuracy >= 80 ? "border-emerald-200" : accuracy >= 60 ? "border-orange-200" : "border-red-200";

                return (
                  <div
                    key={result._id}
                    onClick={() => navigate(`/results/${result._id}`)}
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#FFB343] transition-all cursor-pointer group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${bgColor} border ${borderColor}`}>
                        <Award className={`w-6 h-6 ${scoreColor}`} />
                      </div>
                      {result.quiz?.category && (
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                          {result.quiz.category}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-[#FFB343] transition-colors line-clamp-2">
                      {result.quiz?.title || "Quiz"}
                    </h3>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(result.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Score</p>
                        <p className="text-xl font-bold text-gray-900">
                          {result.score ?? 0}<span className="text-sm text-gray-400">/{result.totalPossibleMarks || result.totalQuestions || '-'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Accuracy</p>
                        <p className={`text-2xl font-bold ${scoreColor}`}>
                          {accuracy.toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end">
                      <span className="text-xs font-semibold text-gray-400 group-hover:text-[#FFB343] transition-colors flex items-center gap-1">
                        View Details
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;