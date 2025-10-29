import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CheckCircle2, XCircle, X, ShieldCheck } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';
import API from '../../Api';

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
    <div className="text-center p-6 sm:p-8 bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-md">
      <AlertCircle className="h-14 w-14 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Oops! Something went wrong.</h2>
      <p className="mt-2 text-gray-600 text-sm sm:text-base">{error}</p>
    </div>
  </div>
);

const Header = ({ title }) => {
  const navigate = useNavigate();

  const handleCloseClick = () => {
    const userRole = localStorage.getItem('userRole'); // Assuming role is stored as 'userRole'
    if (userRole === 'teacher') {
      navigate('/staff-dashboard');
    } else {
      navigate('/student-profile');
    }
  };

  return (
    <header className="flex items-center justify-between w-full bg-white border-b-2 border-gray-500 shadow-sm h-14 sm:h-16">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5">
        <ShieldCheck className="h-10 w-8 sm:h-12 sm:w-10 text-red-600" />
        <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{title}</h1>
      </div>
      <button
        className="h-full w-14 sm:w-16 bg-black text-white flex items-center justify-center hover:bg-gray-800 rounded-none"
        onClick={handleCloseClick}
      >
        <X className="w-4 h-4 sm:w-1/2 sm:h-1/2" />
      </button>
    </header>
  );
};

const CircularStatCard = ({ label, value, percentage, color = '#f59e0b' }) => (
  <div className="flex flex-col items-center p-3 rounded-lg transition-colors">
    <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3">
      <CircularProgressbar
        value={percentage}
        text={value}
        styles={buildStyles({
          textSize: '22px',
          pathColor: color,
          textColor: '#111827',
          trailColor: '#e5e7eb',
          strokeLinecap: 'butt',
          fontWeight: 'bold',
        })}
      />
    </div>
    <span className="text-xs sm:text-sm font-bold text-gray-800 text-center">{label}</span>
  </div>
);

const QuestionPalette = ({ responses }) => (
  <div className="w-full p-3 sm:p-4">
    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Question Palette</h3>
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
      {responses.map((res, index) => (
        <a
          key={index}
          href={`#q-${index + 1}`}
          className={`flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded font-semibold text-white transition-colors ${
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
      className="p-4 sm:p-6 border-b-8 border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4 flex-wrap">
        <p className="text-base sm:text-lg font-medium text-gray-800 pr-2 sm:pr-4">
          <span className="text-red-600 font-bold">Q{index + 1}.</span> {questionText}
        </p>
        {isCorrect ? (
          <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
        )}
      </div>
      <div className="space-y-2 sm:space-y-3">
        {options.map((option, optIndex) => {
          const isSelectedAnswer = option === studentAnswer;
          const isCorrectAnswer = option === correctAnswer;
          let stateClass = 'border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700';
          if (isCorrectAnswer) {
            stateClass = 'border-green-500 bg-green-50 text-green-700 font-semibold';
          } else if (isSelectedAnswer && !isCorrectAnswer) {
            stateClass = 'border-red-500 bg-red-50 text-red-600 font-semibold';
          }
          return (
            <div
              key={optIndex}
              className={`p-3 sm:p-4 border-2 rounded-lg flex items-center justify-between transition-all duration-300 ${stateClass}`}
            >
              <span className="text-sm sm:text-base">{option}</span>
              {isSelectedAnswer && (
                <span className="text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full bg-gray-200 text-gray-700">
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

const motivationalQuotes = [
  'Failure is not the opposite of success; it is part of success.',
  "It's not whether you get knocked down, it's whether you get up.",
  'Success is not final, failure is not fatal: It is the courage to continue that counts.',
  'Every setback is a setup for a comeback.',
  "Don't watch the clock; do what it does. Keep going.",
];

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
          setError('Authentication error. Please log in again.');
          setLoading(false);
          return;
        }
        const response = await API.get(`/api/results/${resultId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResult(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch quiz results.');
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
    hour12: true,
  });

  const scorePercentage = (result.score / result.totalQuestions) * 100;
  const incorrectValue = result.totalQuestions - result.score;
  const incorrectPercentage = (incorrectValue / result.totalQuestions) * 100;
  const attemptedCount = result.responses?.filter((r) => r.studentAnswer).length || 0;
  const attemptedPercentage = (attemptedCount / result.totalQuestions) * 100;

  let resultMessageConfig;
  if (scorePercentage >= 50) {
    resultMessageConfig = {
      icon: <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />,
      message: 'Well done! You did well on this assessment.',
      quote: null,
    };
  } else if (scorePercentage >= 40) {
    resultMessageConfig = {
      icon: <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />,
      message: "Good effort, but there's room for improvement.",
      quote: null,
    };
  } else {
    const randomQuote =
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    resultMessageConfig = {
      icon: <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />,
      message: 'You did not pass this assessment. Please review carefully.',
      quote: randomQuote,
    };
  }

  return (
    <div className="bg-[#F4F4F0] min-h-screen text-gray-900 font-sans flex flex-col">
      <Header title={result.quiz?.title || 'Assessment Results'} />
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden">
        <aside className="w-full md:w-1/4 lg:w-1/5 bg-yellow-50 border-r-2 border-gray-500 flex flex-col p-4 sm:p-6 md:overflow-y-auto md:max-h-[calc(100vh-4rem)]">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Performance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-1 gap-3">
              <CircularStatCard label="Score" value={`${result.score}/${result.totalQuestions}`} percentage={scorePercentage} />
              <CircularStatCard label="Accuracy" value={`${Math.round(result.accuracy)}%`} percentage={result.accuracy} />
              <CircularStatCard label="Attempted" value={`${attemptedCount}/${result.totalQuestions}`} percentage={attemptedPercentage} />
              <CircularStatCard label="Incorrect" value={incorrectValue} percentage={incorrectPercentage} color="#ef4444" />
            </div>
          </motion.div>
        </aside>
        <main className="w-full md:w-3/4 lg:w-4/4 flex flex-col gap-6 sm:gap-8 p-3 sm:p-8 md:overflow-y-auto bg-white md:max-h-[calc(100vh-4rem)]">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                {resultMessageConfig.icon}
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{resultMessageConfig.message}</h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 ml-8 sm:ml-11">Submitted on {submittedAt}</p>
              {resultMessageConfig.quote && (
                <p className="text-xs sm:text-sm text-gray-700 font-medium italic mt-2 ml-8 sm:ml-11 max-w-lg">
                  "{resultMessageConfig.quote}"
                </p>
              )}
            </div>
            <button className="text-xs sm:text-sm font-semibold text-red-600 hover:underline flex-shrink-0 text-left md:text-right">
              Request Re-evaluation
            </button>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 border-b-2 sm:border-b-3 border-gray-300 pb-2 sm:pb-4">
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