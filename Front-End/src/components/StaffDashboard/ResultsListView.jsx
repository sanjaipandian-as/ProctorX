import { ArrowLeft, User, BarChart2, Award, TrendingDown, Eye, RefreshCw, Trophy, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResultsListView({
    viewingResultsOf,
    resultsData,
    resultsLoading,
    onBack,
    onViewDetail,
    onResetAttempt
}) {
    const quizTitle = viewingResultsOf.title;
    const totalSubmissions = resultsData.length;
    const averageScore = totalSubmissions > 0 ? (resultsData.reduce((acc, r) => acc + (r.score ?? 0), 0) / totalSubmissions).toFixed(1) : 0;
    const highestScore = totalSubmissions > 0 ? Math.max(...resultsData.map(r => r.score ?? 0)) : 0;
    const lowestScore = totalSubmissions > 0 ? Math.min(...resultsData.map(r => r.score ?? 0)) : 0;

    // Helper to get initials for avatar
    const getInitials = (name) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : '??';
    };

    // Helper for score badge color
    const getScoreColor = (score, total) => {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return "bg-green-100 text-green-700 border-green-200";
        if (percentage >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
        return "bg-red-100 text-red-700 border-red-200";
    };

    return (
        <div className="max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#FFB343] transition-colors font-medium mb-3 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Quizzes
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Results: <span className="text-[#FFB343]">{quizTitle}</span>
                    </h1>
                    <p className="text-gray-500 mt-1">Overview of student performance and submissions</p>
                </div>

                {/* Quick Action? maybe export later */}
            </div>

            {resultsLoading ? (
                <div className="flex flex-col justify-center items-center h-96">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-orange-100 border-t-[#FFB343] rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BarChart2 className="h-6 w-6 text-[#FFB343] opacity-50" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-lg mt-4 font-medium">Analyzing results...</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <span className="text-gray-600 font-medium text-sm">Total Submissions</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{totalSubmissions}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-100/50 rounded-lg text-emerald-600">
                                        <Award className="h-5 w-5" />
                                    </div>
                                    <span className="text-gray-600 font-medium text-sm">Average Score</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{averageScore}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-amber-100/50 rounded-lg text-amber-600">
                                        <Trophy className="h-5 w-5" />
                                    </div>
                                    <span className="text-gray-600 font-medium text-sm">Highest Score</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{highestScore}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-red-100/50 rounded-lg text-red-600">
                                        <TrendingDown className="h-5 w-5" />
                                    </div>
                                    <span className="text-gray-600 font-medium text-sm">Lowest Score</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{lowestScore}</p>
                            </div>
                        </div>
                    </div>

                    {/* Results Table Section */}
                    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Student Performance</h2>
                                <p className="text-sm text-gray-500">Detailed list of all submissions</p>
                            </div>
                            <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                                {totalSubmissions} Students
                            </div>
                        </div>

                        {totalSubmissions === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Users className="h-8 w-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">No submissions yet</h3>
                                <p className="text-gray-500 max-w-sm">Students haven't taken this quiz yet. Check back later!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                            <th className="px-6 py-4">Student</th>
                                            <th className="px-6 py-4">Submitted</th>
                                            <th className="px-6 py-4">Score</th>
                                            <th className="px-6 py-4">Accuracy</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {resultsData.map((result, index) => {
                                            const maxScore = result.responses?.reduce((acc, r) => acc + (r.marks || 0), 0) || result.totalQuestions || 0;

                                            return (
                                                <motion.tr
                                                    key={result._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-gray-50/80 transition-colors group"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFB343] to-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
                                                                {getInitials(result.user?.name)}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900">{result.user?.name || 'Unknown User'}</div>
                                                                <div className="text-xs text-gray-500">{result.user?.email || 'No email'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-600 font-medium">
                                                            {new Date().toLocaleDateString()} {/* You might want to use result.createdAt if available */}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Just now
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreColor(result.score || 0, maxScore)}`}>
                                                            {result.score ?? 0} / {maxScore}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full"
                                                                    style={{ width: `${result.accuracy || 0}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700">{(result.accuracy ?? 0).toFixed(0)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => onViewDetail(result)}
                                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                                title="View Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => onResetAttempt(result._id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Reset Attempt"
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
