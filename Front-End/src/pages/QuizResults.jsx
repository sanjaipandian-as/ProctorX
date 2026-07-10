import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AlertCircle, CheckCircle2, XCircle, Clock, Percent, User, Award, ChevronDown, ChevronUp, ShieldAlert, ArrowLeft } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';

const LoaderFull = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 text-black font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading results...</p>
    </div>
  </div>
);

const ErrorFull = ({ error }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 text-center font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
    <div className="max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-lg font-extrabold text-black">Assessment Result Error</h2>
      <p className="mt-2 text-gray-500 text-xs font-medium">{error}</p>
    </div>
  </div>
);

const StatCard = ({ Icon, label, value, textColor, bgColor, borderColor }) => (
  <motion.div 
    className="bg-white rounded-xl p-4 md:p-5 flex items-center space-x-4 border border-gray-200 shadow-sm"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 350 }}
  >
    <div className={`p-3 rounded-xl border ${bgColor} ${borderColor}`}>
      <Icon className={`h-5 w-5 ${textColor}`}/>
    </div>
    <div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</div>
      <div className="text-xl font-extrabold text-black mt-0.5">{value}</div>
    </div>
  </motion.div>
);

const QuestionAccordion = ({ response, index, quizQuestions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { questionText, studentAnswer, correctAnswer, isCorrect } = response;

  // Find original options from the quiz questions list
  const originalQuestion = quizQuestions?.find(q => q.questionText === questionText);
  const options = originalQuestion?.options || [studentAnswer, correctAnswer].filter(Boolean);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 md:p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="font-extrabold text-black bg-gray-100 px-2 py-0.5 rounded text-sm border border-gray-200">Q{index + 1}.</span>
          <p className="font-bold text-gray-900 text-sm">{questionText}</p>
        </div>
        <div className="flex items-center gap-4 pl-4 shrink-0">
          {isCorrect ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 md:p-6 bg-gray-50 border-t border-gray-100 space-y-3 animate-fadeIn">
          {options.map((option, optIdx) => {
            const isSelected = option === studentAnswer;
            const isCorrectOption = option === correctAnswer;

            let borderClass = "border-gray-200 bg-white text-gray-600";
            if (isCorrectOption) {
              borderClass = "border-green-300 bg-green-50 text-green-800 font-bold shadow-sm";
            } else if (isSelected && !isCorrectOption) {
              borderClass = "border-red-300 bg-red-50 text-red-800 font-bold shadow-sm";
            }

            return (
              <div key={optIdx} className={`p-4 border rounded-xl flex items-center justify-between text-xs md:text-sm transition-all ${borderClass}`}>
                <span>{option}</span>
                {isSelected && <span className="text-[10px] font-extrabold px-2 py-1 rounded bg-black text-white uppercase tracking-wider ml-4">Your Selection</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const QuizResultsPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const PASS_THRESHOLD = 70;

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await api.get(`/api/results/${resultId}`);
        setResult(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load quiz attempt results.");
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId]);

  if (loading) return <LoaderFull />;
  if (error) return <ErrorFull error={error} />;
  if (!result) return null;

  const scorePercentage = result.accuracy;
  const hasPassed = scorePercentage >= PASS_THRESHOLD;
  const timeFormatted = result.timeTaken ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : 'N/A';

  return (
    <div 
      className="bg-gray-50 min-h-screen text-black p-6 md:p-10 font-sans pb-20"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation back */}
        <button 
          onClick={() => navigate('/student-profile')}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Student Portal
        </button>

        {/* Top Summary Card */}
        <div className="bg-white border border-gray-200 p-8 md:p-10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-center md:text-left space-y-5">
            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
              hasPassed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              <Award className="w-4 h-4" />
              <span>{hasPassed ? "Assessment Passed" : "Needs Review"}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">{result.quiz?.title}</h1>
            
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-extrabold text-white border border-gray-200 uppercase shadow-sm">
                {result.student?.name?.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Examinee</p>
                <p className="font-extrabold text-black text-sm">{result.student?.name}</p>
              </div>
            </div>
          </div>

          <div className="w-32 h-32 flex-shrink-0">
            <CircularProgressbar
              value={scorePercentage}
              text={`${Math.round(scorePercentage)}%`}
              styles={buildStyles({
                textSize: '24px',
                pathColor: hasPassed ? '#15803d' : '#dc2626',
                textColor: '#000000',
                trailColor: '#f3f4f6',
              })}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-black uppercase tracking-wide border-b border-gray-200 pb-3">Performance Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard Icon={CheckCircle2} label="Correct" value={`${result.score} / ${result.totalQuestions}`} textColor="text-green-700" bgColor="bg-green-50" borderColor="border-green-100" />
            <StatCard Icon={XCircle} label="Incorrect" value={result.totalQuestions - result.score} textColor="text-red-600" bgColor="bg-red-50" borderColor="border-red-100" />
            <StatCard Icon={ShieldAlert} label="Warnings Logged" value={`${result.warnings} violations`} textColor="text-amber-600" bgColor="bg-amber-50" borderColor="border-amber-100" />
            <StatCard Icon={Clock} label="Time taken" value={timeFormatted} textColor="text-black" bgColor="bg-gray-100" borderColor="border-gray-200" />
          </div>
        </div>

        {/* Proctoring Warnings Report Card */}
        {result.warningsList && result.warningsList.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-black flex items-center gap-2 uppercase tracking-wide border-b border-gray-200 pb-3">
              <ShieldAlert className="w-4 h-4 text-black" /> Proctoring Integrity Report
            </h2>
            <div className="bg-white border border-red-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
              <p className="text-xs text-gray-600 font-medium">
                The following integrity deflections were logged by the automated proctoring agent during your session:
              </p>
              <div className="relative border-l-2 border-red-200 ml-4 pl-6 space-y-6">
                {result.warningsList.map((warn) => (
                  <div key={warn.id} className="relative">
                    <div className="absolute -left-[33px] mt-0.5 w-4 h-4 rounded-full bg-white border-2 border-red-400 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-700 px-2 py-0.5 rounded bg-red-50 border border-red-100">
                          {warn.type.replace('_', ' ')}
                        </span>
                        <p className="text-sm font-bold text-gray-800 mt-2 leading-relaxed">
                          {warn.type === 'TAB_SWITCH' 
                            ? 'Switched tabs or unfocused the browser window' 
                            : warn.type === 'FULLSCREEN' 
                            ? 'Exited secure full-screen testing mode' 
                            : warn.type === 'FACE_MISSING' 
                            ? 'Candidate face deflection detected (camera view blocked)' 
                            : 'Deflection detected'}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono font-bold tracking-widest uppercase bg-gray-50 px-2.5 py-1 rounded border border-gray-200">
                        {new Date(warn.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Question Review Accordions */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-extrabold text-black uppercase tracking-wide border-b border-gray-200 pb-3">Question Review</h2>
          <div className="space-y-4">
            {result.responses?.map((res, index) => (
              <QuestionAccordion 
                key={res.id} 
                response={res} 
                index={index} 
                quizQuestions={result.quiz?.questions} 
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuizResultsPage;
export { QuizResultsPage };