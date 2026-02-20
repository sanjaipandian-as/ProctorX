import React, { useState, useMemo, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Users, Clock, AlertCircle, Download, ChevronDown, Filter, Search } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image'; // Switched library
import toast from 'react-hot-toast';

export default function AnalyticsView({ stats, quizzes }) {
    const [selectedQuizId, setSelectedQuizId] = useState('all');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const reportRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter Logic for Main View
    const selectedQuiz = useMemo(() =>
        selectedQuizId === 'all' ? null : quizzes.find(q => q.quizId === selectedQuizId),
        [selectedQuizId, quizzes]
    );

    // Filter Logic for Dropdown Search
    const filteredDropdownQuizzes = useMemo(() => {
        return quizzes.filter(q => q.title.toLowerCase().includes(dropdownSearch.toLowerCase()));
    }, [quizzes, dropdownSearch]);

    // Derived Stats
    const displayStats = useMemo(() => {
        if (selectedQuizId === 'all') return stats;
        const lookupId = selectedQuiz?._id;
        const qStats = (lookupId && stats.quizStats?.[lookupId]) ? stats.quizStats[lookupId] : {};
        return {
            totalAttempts: qStats.attempts || 0,
            averageScore: qStats.avgScore || '0%',
            successRate: qStats.successRate || '0%'
        };
    }, [selectedQuizId, selectedQuiz, stats]);

    // Chart Data
    const chartData = useMemo(() => {
        if (selectedQuizId === 'all') {
            return quizzes
                .map(q => ({
                    name: q.title.length > 15 ? q.title.substring(0, 15) + '...' : q.title,
                    fullTitle: q.title,
                    attempts: stats.quizStats?.[q._id]?.attempts || 0,
                    avgScore: parseFloat(stats.quizStats?.[q._id]?.avgScore || 0)
                }))
                .sort((a, b) => b.attempts - a.attempts)
                .slice(0, 5);
        } else {
            const lookupId = selectedQuiz?._id;
            const qStats = (lookupId && stats.quizStats?.[lookupId]) ? stats.quizStats[lookupId] : null;
            if (qStats?.formattedScoreDist) return qStats.formattedScoreDist;
            return [
                { name: '0-20%', count: 0 },
                { name: '21-40%', count: 0 },
                { name: '41-60%', count: 0 },
                { name: '61-80%', count: 0 },
                { name: '81-100%', count: 0 },
            ];
        }
    }, [selectedQuizId, selectedQuiz, quizzes, stats]);

    const pieData = useMemo(() => {
        const rate = parseFloat(displayStats.successRate) || 0;
        return [
            { name: 'Passed', value: rate },
            { name: 'Failed', value: 100 - rate },
        ];
    }, [displayStats]);

    const COLORS = ['#10B981', '#EF4444'];

    // Activity Data
    const activityData = useMemo(() => {
        if (stats.activityData) return stats.activityData;
        return [
            { day: 'Mon', attempts: 0 },
            { day: 'Tue', attempts: 0 },
            { day: 'Wed', attempts: 0 },
            { day: 'Thu', attempts: 0 },
            { day: 'Fri', attempts: 0 },
            { day: 'Sat', attempts: 0 },
            { day: 'Sun', attempts: 0 },
        ];
    }, [stats]);

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        const toastId = toast.loading('Generating Report PDF...');

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            const safeTitle = selectedQuizId === 'all'
                ? 'Global_Analytics'
                : (selectedQuiz?.title || 'Quiz_Report').replace(/[^a-z0-9]/gi, '_');
            const fileName = `${safeTitle}_Report.pdf`;

            // Using html-to-image (toPng) instead of html2canvas
            // It generally handles modern CSS like oklch much better
            const dataUrl = await toPng(reportRef.current, {
                cacheBust: true,
                backgroundColor: '#ffffff', // Force white background
                pixelRatio: 2 // High resolution
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Create an image element to get dimensions
            const img = new Image();
            img.src = dataUrl;
            await new Promise(resolve => { img.onload = resolve; });

            const imgHeight = (img.height * pdfWidth) / img.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(fileName);
            toast.success(<b>Report downloaded!</b>, { id: toastId });

        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error(`Download failed: ${error.message || 'Unknown Error'}`, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper for safe inline styles
    const cardStyle = { backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: '1px', borderStyle: 'solid' };

    return (
        <div
            ref={reportRef}
            className="space-y-6 p-4 rounded-3xl"
            style={{ backgroundColor: '#ffffff' }}
        >
            {/* Header / Filter Row */}
            <div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl shadow-sm relative z-20"
                style={cardStyle}
            >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="p-2 rounded-lg text-[#FFB343]" style={{ backgroundColor: '#FFF7ED' }}>
                        <Filter className="h-5 w-5" />
                    </div>

                    {/* Custom Dropdown */}
                    <div className="relative flex-1 sm:flex-none min-w-[280px]">
                        <button
                            onClick={() => { setIsDropdownOpen(!isDropdownOpen); setDropdownSearch(''); }}
                            className="w-full flex items-center justify-between pl-4 pr-3 py-2.5 rounded-xl text-gray-700 font-medium transition-all shadow-sm"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                outline: 'none'
                            }}
                        >
                            <span className="truncate pr-2">
                                {selectedQuizId === 'all' ? 'Global Overview (All Quizzes)' : selectedQuiz?.title}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute z-40 top-full left-0 mt-2 w-full rounded-xl shadow-xl max-h-80 overflow-y-auto custom-scrollbar p-1.5"
                                        style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}
                                    >
                                        <div className="sticky top-0 pb-2 z-10 px-1 pt-1" style={{ backgroundColor: '#ffffff' }}>
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search quizzes..."
                                                    value={dropdownSearch}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setDropdownSearch(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-gray-700"
                                                    style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => { setSelectedQuizId('all'); setIsDropdownOpen(false); }}
                                            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1"
                                            style={{
                                                color: selectedQuizId === 'all' ? '#FFB343' : '#4B5563',
                                                backgroundColor: selectedQuizId === 'all' ? '#FFF7ED' : 'transparent'
                                            }}
                                        >
                                            Global Overview (All Quizzes)
                                        </button>
                                        <div className="h-px my-1 mx-2" style={{ backgroundColor: '#f3f4f6' }}></div>

                                        {filteredDropdownQuizzes.length > 0 ? filteredDropdownQuizzes.map(q => (
                                            <button
                                                key={q.quizId}
                                                onClick={() => { setSelectedQuizId(q.quizId); setIsDropdownOpen(false); }}
                                                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors truncate"
                                                style={{
                                                    color: selectedQuizId === q.quizId ? '#FFB343' : '#4B5563',
                                                    backgroundColor: selectedQuizId === q.quizId ? '#FFF7ED' : 'transparent'
                                                }}
                                            >
                                                {q.title}
                                            </button>
                                        )) : (
                                            <div className="p-3 text-center text-gray-400 text-sm">No quizzes found</div>
                                        )}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto text-center" data-html2canvas-ignore="true">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#FFB343' }}
                    >
                        {isGenerating ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        <span>{isGenerating ? 'Generating...' : 'Export PDF Report'}</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards Row - Using Inline Styles for Backgrounds */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl shadow-sm"
                    style={cardStyle}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-sm font-medium"> Total Attempts</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{displayStats.totalAttempts}</h3>
                        </div>
                        <div className="p-3 rounded-xl" style={{ backgroundColor: '#EFF6FF' }}>
                            <Users className="h-6 w-6" style={{ color: '#3B82F6' }} />
                        </div>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ backgroundColor: '#F3F4F6' }}>
                        <div className="h-2 rounded-full" style={{ width: '70%', backgroundColor: '#3B82F6' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {selectedQuizId === 'all' ? '+12% from last month' : `For "${selectedQuiz?.title}"`}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl shadow-sm"
                    style={cardStyle}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Avg Score</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{displayStats.averageScore}</h3>
                        </div>
                        <div className="p-3 rounded-xl" style={{ backgroundColor: '#ECFDF5' }}>
                            <Trophy className="h-6 w-6" style={{ color: '#10B981' }} />
                        </div>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ backgroundColor: '#F3F4F6' }}>
                        <div className="h-2 rounded-full" style={{ width: displayStats.averageScore, backgroundColor: '#10B981' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {selectedQuizId === 'all' ? 'Average across all quizzes' : 'Average participant score'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl shadow-sm"
                    style={cardStyle}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Efficiency</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                {selectedQuizId === 'all' ? '~12m' : `${(selectedQuiz?.questions?.length || 5) * 2}m`}
                            </h3>
                        </div>
                        <div className="p-3 rounded-xl" style={{ backgroundColor: '#FFFBEB' }}>
                            <Clock className="h-6 w-6" style={{ color: '#F59E0B' }} />
                        </div>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ backgroundColor: '#F3F4F6' }}>
                        <div className="h-2 rounded-full" style={{ width: '60%', backgroundColor: '#F59E0B' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Avg completion time</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Bar Chart */}
                <div className="lg:col-span-2 p-6 rounded-2xl shadow-sm" style={cardStyle}>
                    <h3 className="text-lg font-bold text-gray-900 mb-6">
                        {selectedQuizId === 'all' ? 'Quiz Engagement & Scores' : 'Score Distribution (Est.)'}
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#F3F4F6' }}
                                />
                                {selectedQuizId === 'all' ? (
                                    <>
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" axisLine={false} tickLine={false} unit="%" />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar yAxisId="left" dataKey="attempts" name="Attempts" fill="#FFB343" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        <Bar yAxisId="right" dataKey="avgScore" name="Avg Score %" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </>
                                ) : (
                                    <Bar dataKey="count" name="Students" fill="#FFB343" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="p-6 rounded-2xl shadow-sm" style={cardStyle}>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Success Rate</h3>
                    <div className="h-64 flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-gray-900">{pieData[0].value.toFixed(0)}%</span>
                            <span className="text-xs text-gray-500">Pass Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl shadow-sm" style={cardStyle}>
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData}>
                                <defs>
                                    <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="attempts" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorAttempts)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div
                    className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-center"
                    style={{ background: 'linear-gradient(135deg, #FFB343 0%, #F97316 100%)' }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full translate-x-32 -translate-y-32"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-16 translate-y-16"></div>

                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Deep Dive Report</h3>
                        <p className="mb-6 max-w-sm" style={{ color: '#FFEDD5' }}>
                            {selectedQuizId === 'all'
                                ? "Download a comprehensive PDF report of all quiz performance and student engagement."
                                : `Download detailed results, response times, and item analysis for "${selectedQuiz?.title}".`
                            }
                        </p>

                        <div className="flex gap-3 data-html2canvas-ignore">
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="px-5 py-2.5 font-semibold rounded-xl transition-colors shadow-sm w-full sm:w-auto text-center disabled:opacity-75 disabled:cursor-not-allowed"
                                style={{ backgroundColor: '#ffffff', color: '#EA580C' }}
                            >
                                {isGenerating ? 'Generating PDF...' : 'Download PDF Report'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
