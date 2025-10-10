import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CheckCircle2, XCircle, Clock, Percent, User, Award } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';

// --- Helper Components ---

const Loader = () => (
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-red-500"></div>
);

const LoaderFull = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <Loader />
  </div>
);

const ErrorFull = ({ error }) => (
  <div className="flex items-center justify-center min-h-screen bg-black p-4">
    <div className="text-center p-8 bg-gray-900 rounded-2xl border border-gray-700 max-w-md">
      <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white">Oops! Something went wrong.</h2>
      <p className="mt-2 text-gray-400">{error}</p>
    </div>
  </div>
);


// --- Main Page Components ---

const StatCard = ({ Icon, label, value, color }) => (
    <motion.div 
        className="bg-gray-900 rounded-xl p-4 flex items-center space-x-4 border border-gray-700/50"
        whileHover={{ scale: 1.05, backgroundColor: '#1f2937' }}
        transition={{ type: "spring", stiffness: 300 }}
    >
        <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20`}}>
            <Icon className="h-6 w-6" style={{ color: color }}/>
        </div>
        <div>
            <div className="text-sm font-medium text-gray-400">{label}</div>
            <div className="text-xl font-bold text-white">{value}</div>
        </div>
    </motion.div>
);

const ResultSummaryCard = ({ result, user }) => {
    const scorePercentage = result.accuracy;
    const passThreshold = 70;
    const hasPassed = scorePercentage >= passThreshold;

    return (
        <motion.div 
            className="bg-gray-950 p-8 rounded-2xl border-t-4 border-red-600 flex flex-col md:flex-row items-center justify-between text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="text-center md:text-left mb-6 md:mb-0">
                <div className={`inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full text-sm font-semibold ${hasPassed ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                    <Award size={16}/>
                    <span>{hasPassed ? "Great Job!" : "Needs Improvement"}</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white">{result.quiz?.title}</h1>
                
                <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                    <User className="h-10 w-10 text-gray-400 p-2 bg-gray-800 rounded-full flex-shrink-0" />
                    <div>
                        <p className="text-sm text-gray-500">Results for</p>
                        <p className="font-bold text-white">{user?.name}</p>
                    </div>
                </div>
            </div>
            <div className="w-32 h-32 flex-shrink-0">
                 <CircularProgressbar
                    value={scorePercentage}
                    text={`${Math.round(scorePercentage)}%`}
                    styles={buildStyles({
                        textSize: '24px',
                        pathColor: hasPassed ? '#22c55e' : '#ef4444', // Green for pass, red for fail
                        textColor: '#FFFFFF',
                        trailColor: 'rgba(255, 255, 255, 0.1)',
                    })}
                />
            </div>
        </motion.div>
    );
};

const QuestionCard = ({ response, index }) => {
    const { questionText, options, studentAnswer, correctAnswer, isCorrect } = response;
    
    return (
        <motion.div 
            className="bg-gray-900 p-6 rounded-2xl border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <div className="flex justify-between items-start mb-4">
                <p className="text-lg font-medium text-gray-200 pr-4">
                    <span className="text-red-500 font-bold">Q{index + 1}.</span> {questionText}
                </p>
                {isCorrect ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" /> // Green checkmark
                ) : (
                    <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                )}
            </div>
            <div className="space-y-3">
                {options.map((option, optIndex) => {
                    const isSelectedAnswer = option === studentAnswer;
                    const isCorrectAnswer = option === correctAnswer;
                    
                    let stateClass = "border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300";
                    if(isCorrectAnswer) {
                        // Green highlight for the correct answer
                        stateClass = "border-green-600 bg-green-900/50 text-green-300 font-semibold";
                    } else if (isSelectedAnswer && !isCorrectAnswer) {
                        stateClass = "border-red-600 bg-red-900/50 text-red-400 font-semibold";
                    }

                    return (
                        <div key={optIndex} className={`p-4 border-2 rounded-lg flex items-center justify-between transition-all duration-300 ${stateClass}`}>
                            <span>{option}</span>
                            {isSelectedAnswer && (
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-600 text-gray-200">
                                    Your Answer
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};


// --- Main Quiz Results Component ---

const QuizResultsPage = () => {
    const { resultId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const PASS_THRESHOLD = 70; // Define pass percentage here

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError("Authentication error. Please log in again.");
                    setLoading(false);
                    return;
                }
                const response = await axios.get(`http://localhost:8000/api/results/${resultId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResult(response.data);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch quiz results.");
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [resultId]);

    if (loading) return <LoaderFull />;
    if (error) return <ErrorFull error={error} />;
    if (!result) return null;

    const timeInMinutes = result.timeTaken ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : 'N/A';
    
    return (
        <div className="bg-black min-h-screen text-white font-sans">
            <main className="w-full p-4 md:p-8 flex flex-col gap-8">
                
                <ResultSummaryCard result={result} user={result.user} />
                
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h2 className="text-2xl font-bold text-white mb-4">Performance Metrics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard Icon={CheckCircle2} label="Correct" value={`${result.score} / ${result.totalQuestions}`} color="#22c55e"/>
                        <StatCard Icon={XCircle} label="Incorrect" value={result.totalQuestions - result.score} color="#ef4444"/>
                        <StatCard Icon={Percent} label="Accuracy" value={`${Math.round(result.accuracy)}%`} color={result.accuracy >= PASS_THRESHOLD ? "#22c55e" : "#ef4444"}/>
                        <StatCard Icon={Clock} label="Time Taken" value={timeInMinutes} color="#FFFFFF"/>
                    </div>
                </motion.div>
                
                <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <h2 className="text-3xl font-bold text-white border-b-2 border-gray-800 pb-4">
                        Question Review
                    </h2>
                    {result.responses?.map((res, index) => (
                        <QuestionCard key={index} response={res} index={index} />
                    ))}
                </motion.div>
            </main>
        </div>
    );
};

export default QuizResultsPage;