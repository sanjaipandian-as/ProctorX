import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
    AlertCircle, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Percent, 
    User, 
    Award, 
    Check, 
    X,
    ShieldCheck 
} from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';

const Loader = () => (
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-red-500"></div>
);

const LoaderFull = () => (
    <div className="flex items-center justify-center min-h-screen bg-[#F4F4F0]">
        <Loader />
    </div>
);

const ErrorFull = ({ error }) => (
    <div className="flex items-center justify-center min-h-screen bg-[#F4F4F0] p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-200 max-w-md shadow-md">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Oops! Something went wrong.</h2>
            <p className="mt-2 text-gray-600">{error}</p>
        </div>
    </div>
);

const Header = ({ title }) => {
    const navigate = useNavigate();

    return (
        <header className="flex items-center justify-between w-full bg-white border-b-2 border-gray-500 shadow-sm h-16">
            <div className="flex items-center gap-3 pl-5">
                <ShieldCheck className="h-12 w-10 text-red-600" /> 
                <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
            </div>
            <button
                className="h-full w-16 bg-black text-white flex items-center justify-center hover:bg-gray-800 p-0"
                onClick={() => navigate('/')} // <-- Navigate to home
            >
                <X className="w-1/2 h-1/2" />
            </button>
        </header>
    );
};


const CircularStatCard = ({ label, value, percentage, color = "#f59e0b" }) => (
    <div className="flex flex-col items-center p-3 rounded-lg transition-colors">
        <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3">
            <CircularProgressbar
                value={percentage}
                text={value}
                styles={buildStyles({
                    textSize: '24px',
                    pathColor: color,
                    textColor: '#111827',
                    trailColor: '#e5e7eb',
                    strokeLinecap: 'butt',
                    textFontWeight: 'bold', 
                })}
            />
        </div>
        <span className="text-sm font-bold text-gray-800">{label}</span>
    </div>
);


const QuestionPalette = ({ responses }) => (
    <div className="w-full p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Question Palette</h3>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {responses.map((res, index) => (
                <a
                    key={index}
                    href={`#q-${index + 1}`}
                    className={`flex items-center justify-center h-10 w-10 rounded font-semibold text-white transition-colors ${
                        res.isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                    {index + 1}
                </a>
            ))}
        </div>
    </div>
);

const QuestionCard = ({ response, index }) => {
    const { questionText, options, studentAnswer, correctAnswer, isCorrect } = response;
    
    return (
        <motion.div 
            id={`q-${index + 1}`}
            className="p-6 border-b-8 border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
        >
            <div className="flex justify-between items-start mb-4">
                <p className="text-lg font-medium text-gray-800 pr-4">
                    <span className="text-red-600 font-bold">Q{index + 1}.</span> {questionText}
                </p>
                {isCorrect ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
                ) : (
                    <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                )}
            </div>
            <div className="space-y-3">
                {options.map((option, optIndex) => {
                    const isSelectedAnswer = option === studentAnswer;
                    const isCorrectAnswer = option === correctAnswer;
                    
                   
                    let stateClass = "border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700";
                    if(isCorrectAnswer) {
                        stateClass = "border-green-500 bg-green-50 text-green-700 font-semibold";
                    } else if (isSelectedAnswer && !isCorrectAnswer) {
                        stateClass = "border-red-500 bg-red-50 text-red-600 font-semibold";
                    }

                    return (
                        <div key={optIndex} className={`p-4 border-2 rounded-lg flex items-center justify-between transition-all duration-300 ${stateClass}`}>
                            <span>{option}</span>
                            {isSelectedAnswer && (
                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-200 text-gray-700">
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

const QuizResultsPage = () => {
    const { resultId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const submittedAt = new Date(result.createdAt).toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    const incorrectValue = result.totalQuestions - result.score;
    const incorrectPercentage = (incorrectValue / result.totalQuestions) * 100;
    
    const attemptedCount = result.responses?.filter(r => r.studentAnswer !== null).length || 0;
    const attemptedPercentage = (attemptedCount / result.totalQuestions) * 100;


    return (
        <div className="bg-[#F4F4F0] h-screen text-gray-900 font-sans flex flex-col">
            <Header title={result.quiz?.title || "Assessment Results"} />
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <aside className="w-full md:w-1/4 lg:w-1/5 bg-yellow-50  border-r-2 border-gray-500 flex flex-col p-4 sm:p-6 overflow-y-auto">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                            Performance
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <CircularStatCard 
                                label="Score" 
                                value={`${result.score}/${result.totalQuestions}`} 
                                percentage={(result.score / result.totalQuestions) * 100}
                            />
                            <CircularStatCard 
                                label="Accuracy" 
                                value={`${Math.round(result.accuracy)}%`} 
                                percentage={result.accuracy}
                            />
                            
                            <CircularStatCard 
                                label="Attempted" 
                                value={`${attemptedCount}/${result.totalQuestions}`}
                                percentage={attemptedPercentage}
                            />
                            
                            <CircularStatCard 
                                label="Incorrect" 
                                value={incorrectValue}
                                percentage={incorrectPercentage}
                                color="#ef4444" 
                            />
                        </div>
                    </motion.div>
                </aside>

                
                <main className="w-full md:w-2/3 lg:w-4/4 flex flex-col gap-8 p-4  md:p-8 overflow-y-auto bg-white">
                    
                   
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                <h2 className="text-2xl font-bold text-gray-900">Well done! You did well on this assessment.</h2>
                            </div>
                            <p className="text-sm text-gray-600 ml-11">Submitted on {submittedAt}</p>
                        </div>
                        <button className="text-sm font-semibold text-red-600 hover:underline flex-shrink-0 text-left md:text-right">
                            Request Re-evaluation
                        </button>
                    </div>
                    
                    
                    <h2 className="text-3xl font-bold text-gray-900 border-b-3 border-grey-300 pb-4">
                        Question Review
                    </h2>
                    <QuestionPalette responses={result.responses || []} />
                    <div className="w-full">
                        {result.responses?.map((res, index) => (
                            <QuestionCard key={index} response={res} index={index} />
                        ))}
                    </div>

                </main>
            </div>
        </div>
    );
};

export default QuizResultsPage;


