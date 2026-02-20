import { Sparkles, Users, BarChart3, Save, ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StatCard from './StatCard';
import AnalyticsView from './AnalyticsView';
import {
    CollectionIcon,
    UsersIcon,
    NewChartBarIcon,
    TrendingUpIcon,
    PlusIcon,
    QuestionCircleIcon,
    ClockIcon,
    CalendarIcon,
    TargetIcon,
    EditIcon,
    DuplicateIcon
} from './Icons';

// Skeleton Card Component
const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full min-h-[320px] flex flex-col animate-pulse">
        <div className="p-5 flex-1 flex flex-col space-y-4">
            <div className="flex justify-between items-start">
                <div className="h-5 w-16 bg-slate-200 rounded-md"></div>
                <div className="flex gap-2">
                    <div className="h-6 w-6 bg-slate-200 rounded-md"></div>
                    <div className="h-6 w-6 bg-slate-200 rounded-md"></div>
                </div>
            </div>

            <div className="h-6 w-3/4 bg-slate-200 rounded-lg mt-2"></div>

            <div className="space-y-2 flex-1 mt-4">
                <div className="h-3 w-full bg-slate-100 rounded"></div>
                <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto pt-4">
                <div className="h-14 bg-slate-50 rounded-lg"></div>
                <div className="h-14 bg-slate-50 rounded-lg"></div>
            </div>
        </div>
        <div className="p-3 bg-slate-50 border-t border-gray-100 flex gap-2">
            <div className="h-9 flex-1 bg-slate-200 rounded-xl"></div>
            <div className="h-9 flex-1 bg-slate-200 rounded-xl"></div>
        </div>
    </div>
);

export default function DashboardOverview({
    loading,
    quizzes,
    stats,
    filteredQuizzes,
    searchQuery,
    setSearchQuery,
    onEdit,
    onDuplicate,
    onViewResults,
    onQuizClick
}) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('quizzes');

    return (
        <>
            {/* Content Switcher */}
            {activeTab === 'quizzes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Quizzes"
                        value={loading ? <div className="h-8 w-12 bg-slate-200 rounded animate-pulse" /> : quizzes.length}
                        subtitle={`${Array.isArray(quizzes) ? quizzes.filter(q => q?.status === 'active').length : 0} active`}
                        icon={<CollectionIcon />}
                        iconBgColor="bg-gradient-to-br from-orange-100 to-orange-200"
                    />
                    <StatCard
                        title="Total Attempts"
                        value={stats.totalAttempts}
                        subtitle="Across all quizzes"
                        icon={<UsersIcon />}
                        iconBgColor="bg-gradient-to-br from-blue-100 to-blue-200"
                    />
                    <StatCard
                        title="Average Score"
                        value={stats.averageScore || '0%'}
                        subtitle="Student performance"
                        icon={<NewChartBarIcon />}
                        iconBgColor="bg-gradient-to-br from-green-100 to-green-200"
                    />
                    <StatCard
                        title="Success Rate"
                        value={stats.successRate || '0%'}
                        subtitle="Passing attempts"
                        icon={<TrendingUpIcon />}
                        iconBgColor="bg-gradient-to-br from-purple-100 to-purple-200"
                    />
                </div>
            )}

            {/* Tabs and Search */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4 border-b border-gray-100">
                <div className="flex self-start md:self-auto space-x-1">
                    <button
                        onClick={() => setActiveTab('quizzes')}
                        className={`px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${activeTab === 'quizzes' ? 'text-[#FFB343] border-[#FFB343] bg-orange-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent'}`}
                    >
                        My Quizzes
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-3 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-colors border-b-2 ${activeTab === 'analytics' ? 'text-[#FFB343] border-[#FFB343] bg-orange-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-transparent'}`}
                    >
                        Analytics
                    </button>
                </div>

                {activeTab === 'quizzes' && (
                    <div className="relative w-full md:w-96 lg:w-[480px] pb-2 md:pb-3">
                        <div className="absolute inset-y-0 left-0 pl-4 pb-2 md:pb-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB343]/20 focus:border-[#FFB343] text-sm md:text-base shadow-sm transition-all text-gray-700"
                            placeholder="Search your quizzes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Quizzes List or Analytics */}
            {activeTab === 'quizzes' ? (
                <div className="max-h-[calc(100vh-20rem)] overflow-y-auto pr-2 pb-10">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Create New Quiz Card */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => navigate('/create-quiz')}
                                className="bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#FFB343] hover:bg-orange-50/30 transition-all group flex flex-col items-center justify-center p-8 h-full min-h-[320px] shadow-sm hover:shadow-md cursor-pointer text-center"
                            >
                                <div className="bg-orange-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                    <PlusIcon className="h-8 w-8 text-[#FFB343]" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Create New Quiz</h3>
                                <p className="text-sm text-gray-500">Start from scratch or use AI</p>
                            </motion.button>

                            {filteredQuizzes.map((quiz, index) => (
                                quiz && (
                                    <motion.div
                                        key={quiz.quizId}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-full group"
                                    >
                                        {/* Card Header */}
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${quiz.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {quiz.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                                <div className="flex gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); onEdit(quiz.quizId); }} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                        <EditIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); onDuplicate(quiz.quizId); }} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Duplicate">
                                                        <DuplicateIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#FFB343] transition-colors" title={quiz.title}>
                                                {quiz.title}
                                            </h3>

                                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                                                {quiz.description || "No description provided."}
                                            </p>

                                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                                <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                    <span className="block text-xs text-gray-500 uppercase font-semibold">Questions</span>
                                                    <span className="block text-lg font-bold text-gray-900">{quiz.questions?.length || 0}</span>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                    <span className="block text-xs text-gray-500 uppercase font-semibold">Time</span>
                                                    <span className="block text-lg font-bold text-gray-900">{quiz.questions?.length * 2}m</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                                            <button
                                                onClick={() => onViewResults(quiz)}
                                                className="flex-1 py-2 px-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
                                            >
                                                <BarChart3 className="h-4 w-4" /> Analytics
                                            </button>
                                            <button
                                                onClick={() => onQuizClick(quiz.quizId)}
                                                className="flex-1 py-2 px-3 text-sm font-semibold text-white bg-gradient-to-r from-[#FFB343] to-[#FF9F2E] rounded-xl hover:shadow-md transition-all flex items-center justify-center gap-2"
                                            >
                                                Manage <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <AnalyticsView stats={stats} quizzes={quizzes} />
            )}
        </>
    );
}
