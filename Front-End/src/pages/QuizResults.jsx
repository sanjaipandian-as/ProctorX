import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AlertCircle, CheckCircle2, XCircle, Clock, Percent, User, Award, ChevronDown, ChevronUp, ShieldAlert, ArrowLeft, ShieldCheck, HelpCircle, Play, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const COMPILER_URL = import.meta.env.VITE_COMPILER_URL || "http://localhost:4000";

const LoaderFull = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 text-black font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading results...</p>
    </div>
  </div>
);

const ErrorFull = ({ error }) => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 text-center font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
    <div className="max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-sm">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-lg font-extrabold text-black">Assessment Result Error</h2>
      <p className="mt-2 text-gray-500 text-xs font-medium">{error}</p>
    </div>
  </div>
);

const StatCard = ({ Icon, label, value, subtext, textColor, bgColor, borderColor }) => (
  <motion.div 
    className="bg-white rounded-2xl p-5 flex flex-col justify-between border border-gray-150 shadow-sm transition-all hover:border-gray-300"
    whileHover={{ y: -3 }}
    transition={{ duration: 0.2 }}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className={`p-2 rounded-lg border ${bgColor} ${borderColor}`}>
        <Icon className={`h-4.5 w-4.5 ${textColor}`}/>
      </div>
    </div>
    <div>
      <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</div>
      <div className="text-[9px] text-gray-400 mt-1 font-medium">{subtext}</div>
    </div>
  </motion.div>
);

const detectLanguage = (codeText) => {
  if (!codeText) return 'cpp';
  if (codeText.includes('#include') || codeText.includes('using namespace') || codeText.includes('std::')) return 'cpp';
  if (codeText.includes('public class') || codeText.includes('System.out') || codeText.includes('import java.')) return 'java';
  if (codeText.includes('def ') || codeText.includes('import sys') || codeText.includes('import os') || codeText.includes('print(')) return 'python';
  if (codeText.includes('const ') || codeText.includes('let ') || codeText.includes('require(') || codeText.includes('console.log')) return 'javascript';
  return 'cpp';
};

const CodingQuestionResult = ({ studentAnswer, originalQuestion, marksObtained, questionMarks }) => {
  const [language, setLanguage] = useState(() => detectLanguage(studentAnswer));
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showResultsBanner, setShowResultsBanner] = useState(false);
  const [selectedTest, setSelectedTest] = useState(0);
  const [activeTab, setActiveTab] = useState('runTests');
  const [isExpanded, setIsExpanded] = useState(true);

  const tests = useMemo(() => {
    try {
      return Array.isArray(originalQuestion?.testcases) 
        ? originalQuestion.testcases 
        : (typeof originalQuestion?.testcases === 'string' ? JSON.parse(originalQuestion.testcases || '[]') : []);
    } catch(e) {
      return [];
    }
  }, [originalQuestion?.testcases]);

  const runAllTests = useCallback(async (showToast = true) => {
    if (!studentAnswer || studentAnswer.trim() === '') {
      if (showToast) toast.error("Submitted code is empty.");
      return;
    }
    if (tests.length === 0) {
      if (showToast) toast.error("No test cases available.");
      return;
    }
    setIsExpanded(true);
    setIsRunningTests(true);
    setTestResults([]);
    setShowResultsBanner(false);
    try {
      const res = await axios.post(`${COMPILER_URL}/run`, { 
        language, 
        code: studentAnswer, 
        tests: tests.map(t => ({ input: t.input || "" })) 
      });
      
      if (res.data.compile && res.data.compile.code !== 0) {
        if (showToast) toast.error("Compilation Error");
        const compError = res.data.compile.stderr || res.data.compile.stdout;
        
        const results = tests.map((t, index) => ({
          id: index,
          passed: false,
          output: "",
          error: `Compilation Error:\n${compError}`,
          killed: false,
          durationMs: 0
        }));
        setTestResults(results);
        setShowResultsBanner(true);
        setIsRunningTests(false);
        return;
      }

      const results = [];
      if (res.data.tests && res.data.tests.length > 0) {
        res.data.tests.forEach((testResult, index) => {
          const expectedOutput = tests[index]?.output?.trim() || "";
          const actualOutput = testResult.stdout?.trim() || "";
          const passed = !testResult.killed && testResult.code === 0 && actualOutput === expectedOutput;

          results.push({
            id: index,
            passed,
            output: actualOutput,
            error: testResult.stderr,
            killed: testResult.killed,
            durationMs: testResult.durationMs,
          });
        });
      }
      setTestResults(results);
      setShowResultsBanner(true);
    } catch (err) {
      const details = err.response?.data?.details?.map(d => `${d.field}: ${d.message}`).join("\n");
      const errorMsg = err.response?.data?.error || err.message;
      if (showToast) toast.error(`Error: ${errorMsg}`);
      const results = tests.map((t, index) => ({
        id: index,
        passed: false,
        output: "",
        error: `Execution Error:\n${details || errorMsg}`,
        killed: false,
        durationMs: 0
      }));
      setTestResults(results);
      setShowResultsBanner(true);
    } finally {
      setIsRunningTests(false);
    }
  }, [studentAnswer, language, tests]);

  // Run all tests automatically on page load / language change
  useEffect(() => {
    if (studentAnswer && studentAnswer.trim() !== '' && tests.length > 0) {
      runAllTests(false);
    }
  }, [studentAnswer, language, tests, runAllTests]);

  const passedTestsCount = testResults.filter(r => r.passed).length;
  const totalTestsCount = tests.length || 0;
  const lineCount = (studentAnswer || '').split('\n').length;

  return (
    <div className="flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm mt-2 flex-1 min-h-[500px] max-h-[700px] w-full">
      {/* Top bar: language dropdown */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <select
            className="bg-white text-gray-500 text-xs font-bold px-3 py-1.5 border-2 border-gray-400 outline-none cursor-pointer uppercase rounded transition-all"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="c">C</option>
            <option value="cpp">CPP</option>
            <option value="python">PYTHON</option>
            <option value="java">JAVA</option>
            <option value="javascript">NODEJS</option>
          </select>
          <span className="px-2.5 py-1 bg-violet-100 text-violet-850 rounded text-[11px] font-extrabold uppercase border border-violet-200">
            Marks: {marksObtained || 0} / {questionMarks}
          </span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted Code</span>
      </div>

      {/* Code editor area (Read-only) */}
      <div className={`overflow-hidden bg-white min-h-0 relative ${isExpanded ? 'flex flex-[3]' : 'flex flex-1'}`}>
        <div className="w-12 bg-slate-50 border-r border-gray-200 text-gray-400 text-right pr-3 pt-3 select-none font-mono text-[11px] leading-[1.7] overflow-y-auto custom-scrollbar">
          {Array.from({ length: Math.max(lineCount, 15) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          readOnly
          className="flex-1 bg-white text-slate-800 p-4 resize-none outline-none font-mono text-[12px] leading-[1.7] overflow-y-auto custom-scrollbar"
          value={studentAnswer}
        />
      </div>

      {/* Bottom bar: Run Tests tab */}
      <div className={`border-t border-gray-300 bg-white flex flex-col min-h-0 flex-shrink-0 transition-all ${isExpanded ? 'flex-[2]' : 'flex-none h-[48px] overflow-hidden'}`}>
        <div className="flex border-b border-gray-300 bg-slate-50 flex-shrink-0 items-center justify-between">
          <div className="flex">
            <button 
              onClick={() => { setActiveTab('runTests'); setIsExpanded(true); }}
              disabled={isRunningTests}
              className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-r border-gray-200 flex items-center gap-2 ${isRunningTests ? 'text-gray-400 cursor-not-allowed' : activeTab === 'runTests' ? 'text-black bg-white border-b-2 border-b-black' : 'text-slate-600 hover:bg-slate-100'}`}>
              {isRunningTests ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Run Tests
            </button>
          </div>
          
          <div className="pr-4 flex items-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-slate-200 text-gray-500 hover:text-black rounded transition-colors"
              title={isExpanded ? "Collapse panel" : "Expand panel"}
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        {activeTab === 'runTests' && (
          <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
            {showResultsBanner && (
              <div className={`border-b border-gray-400 px-5 py-1.5 flex items-center justify-center relative flex-shrink-0 ${passedTestsCount === totalTestsCount ? 'bg-[#d4edda]' : 'bg-[#fce4ec]'}`}>
                <span className="text-[13px] font-bold text-gray-900">
                  Passed {passedTestsCount}/{totalTestsCount} test cases | Marks Obtained: {marksObtained || 0}/{questionMarks}
                </span>
                <button 
                  onClick={() => setShowResultsBanner(false)}
                  className="absolute right-5 text-[11px] text-gray-600 hover:text-black italic font-bold underline">
                  Dismiss
                </button>
              </div>
            )}
            
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left sidebar for test cases */}
              <div className="w-56 border-r border-gray-300 bg-[#f5f5f5] flex flex-col flex-shrink-0 min-h-0">
                <div className="p-3 border-b border-gray-200 flex-shrink-0">
                  <button 
                    onClick={() => runAllTests(true)}
                    disabled={isRunningTests}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#673ab7] hover:bg-[#5e35b1] text-white text-xs font-bold rounded border-0 transition shadow disabled:opacity-50">
                    {isRunningTests ? <Loader2 size={12} className="animate-spin text-white" /> : <Play size={12} className="text-white fill-current animate-pulse" />}
                    <span>Run Tests</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                  {tests.map((t, i) => {
                    const result = testResults.find(r => r.id === i);
                    return (
                      <button 
                        key={i} 
                        onClick={() => setSelectedTest(i)}
                        className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-200 text-left transition-colors flex-shrink-0 ${selectedTest === i ? 'bg-white text-gray-900 font-bold shadow-sm' : 'text-gray-600 hover:bg-[#e9e9e9] font-medium'}`}>
                        <span className="text-[13px]">Test Case {i + 1}</span>
                        {result && (
                          result.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-[#4caf50]" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[#d32f2f]" />
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Right content for selected test case */}
              <div className="flex-1 bg-gray-50 overflow-y-auto custom-scrollbar relative min-h-0">
                {tests[selectedTest]?.hidden ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    <span className="text-sm font-medium">This is a hidden test case</span>
                  </div>
                ) : (
                  <div className="p-5 space-y-5">
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-800 mb-2 tracking-tight">Input</h4>
                      <div className="w-full p-3.5 bg-white border border-gray-900 rounded-none text-xs font-mono text-gray-900 whitespace-pre overflow-x-auto min-h-[80px]">
                        {tests[selectedTest]?.input || 'none'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-800 mb-2 tracking-tight">Expected Output</h4>
                      <div className="w-full p-3.5 bg-white border border-gray-900 rounded-none text-xs font-mono text-gray-900 whitespace-pre overflow-x-auto min-h-[50px]">
                        {tests[selectedTest]?.output || 'none'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-800 mb-2 tracking-tight">Output</h4>
                      {(() => {
                        const currentResult = testResults.find(r => r.id === selectedTest);
                        const actualOutput = currentResult?.output || "";
                        const expectedOutput = tests[selectedTest]?.output?.trim() || "";
                        const isMatched = actualOutput === expectedOutput;
                        const hasOutput = actualOutput.length > 0;
                        
                        if (!currentResult) {
                          return <div className="w-full p-3.5 bg-gray-100 border border-gray-900 rounded-none text-xs font-mono text-gray-500 whitespace-pre overflow-x-auto min-h-[50px] italic">Click 'Run Tests' to see output</div>;
                        }
 
                        return (
                          <div className={`w-full p-3.5 bg-white border rounded-none text-xs font-mono whitespace-pre overflow-x-auto min-h-[50px] ${hasOutput && isMatched ? "border-green-400 bg-green-50 text-green-900" : "border-red-400 bg-red-50 text-red-900"}`}>
                            {currentResult.error ? `Error:\n${currentResult.error}` : 
                             currentResult.killed ? "Time Limit Exceeded" : 
                             actualOutput || "(empty output)"}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GradeController = ({ maxMarks, currentMarks, onSave, grading }) => {
  const [marks, setMarks] = useState(currentMarks || 0);

  useEffect(() => {
    setMarks(currentMarks || 0);
  }, [currentMarks]);

  const hasUnsavedChanges = marks !== (currentMarks || 0);
  const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;

  // Determine feedback tier and color
  let tierLabel = "No Marks";
  let tierColor = "bg-red-50 text-red-700 border-red-200";
  let themeColor = "#ef4444"; // red

  if (marks === 0) {
    tierLabel = "No Marks Awarded";
    tierColor = "bg-red-50 text-red-650 border-red-150";
    themeColor = "#ef4444";
  } else if (percentage < 50) {
    tierLabel = "Needs Improvement";
    tierColor = "bg-orange-50 text-orange-650 border-orange-150";
    themeColor = "#f97316";
  } else if (percentage < 80) {
    tierLabel = "Good Attempt";
    tierColor = "bg-amber-50 text-amber-650 border-amber-150";
    themeColor = "#d97706";
  } else if (percentage < 100) {
    tierLabel = "Excellent Answer";
    tierColor = "bg-blue-50 text-blue-650 border-blue-150";
    themeColor = "#2563eb";
  } else {
    tierLabel = "Perfect Score!";
    tierColor = "bg-emerald-50 text-emerald-650 border-emerald-150";
    themeColor = "#059669";
  }

  // Generate quick-grade options
  const quickOptions = useMemo(() => {
    if (maxMarks <= 5) {
      const opts = [];
      for (let i = 0; i <= maxMarks; i++) {
        opts.push({ label: `${i}`, value: i });
      }
      return opts;
    } else {
      // Return 0, 25%, 50%, 75%, 100% rounded to nearest integer
      return [
        { label: '0', value: 0 },
        { label: '25%', value: Math.round(maxMarks * 0.25) },
        { label: '50%', value: Math.round(maxMarks * 0.5) },
        { label: '75%', value: Math.round(maxMarks * 0.75) },
        { label: '100%', value: maxMarks }
      ].filter((v, i, self) => self.findIndex(t => t.value === v.value) === i); // deduplicate
    }
  }, [maxMarks]);

  return (
    <div className="mt-5 p-5 bg-[#faf9fc] border border-gray-200 rounded-2xl space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-gray-500" />
          <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Evaluation Desk</span>
        </div>
        <motion.span 
          key={tierLabel}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${tierColor}`}
        >
          {tierLabel}
        </motion.span>
      </div>

      {/* Marks Display & Slider Row */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <motion.span 
              key={marks}
              initial={{ y: -5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-extrabold text-gray-900 tracking-tight font-mono"
            >
              {marks}
            </motion.span>
            <span className="text-xs font-bold text-gray-400">/ {maxMarks} marks</span>
          </div>
          
          {/* Direct Input fallback */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider px-1.5">Custom</span>
            <input 
              type="number" 
              min="0" 
              max={maxMarks}
              value={marks}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 0 && val <= maxMarks) {
                  setMarks(val);
                } else if (e.target.value === '') {
                  setMarks(0);
                }
              }}
              className="w-12 text-center text-xs font-bold text-gray-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Customized Dynamic Slider */}
        <div className="relative pt-2">
          <input
            type="range"
            min="0"
            max={maxMarks}
            value={marks}
            onChange={(e) => setMarks(parseInt(e.target.value, 10))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none transition-all duration-300"
            style={{
              background: `linear-gradient(to right, ${themeColor} ${percentage}%, #e2e8f0 ${percentage}%)`,
            }}
          />
          {/* Custom style injection for Webkit range slider thumb */}
          <style>{`
            input[type=range]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: ${themeColor};
              border: 3px solid #ffffff;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
              cursor: pointer;
              transition: transform 0.1s, background-color 0.2s;
            }
            input[type=range]::-webkit-slider-thumb:hover {
              transform: scale(1.15);
            }
            input[type=range]::-moz-range-thumb {
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: ${themeColor};
              border: 3px solid #ffffff;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
              cursor: pointer;
              transition: transform 0.1s, background-color 0.2s;
            }
            input[type=range]::-moz-range-thumb:hover {
              transform: scale(1.15);
            }
          `}</style>
        </div>
      </div>

      {/* Quick Select Pills */}
      <div className="space-y-2">
        <span className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Quick Toggles</span>
        <div className="flex flex-wrap gap-1.5">
          {quickOptions.map((opt) => {
            const isSelected = marks === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setMarks(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm transform -translate-y-0.5'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Button Action */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-[10px] text-gray-400 font-semibold italic">
          {hasUnsavedChanges ? "⚡ Click save to publish grade" : "✓ Grade is synchronized"}
        </span>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <button
              onClick={() => setMarks(currentMarks || 0)}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 font-bold border border-gray-200 rounded-lg text-xs transition"
            >
              Reset
            </button>
          )}
          <motion.button
            onClick={() => onSave(marks)}
            disabled={grading || (!hasUnsavedChanges && currentMarks !== undefined)}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-sm flex items-center gap-1 ${
              grading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : hasUnsavedChanges
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-gray-100 text-gray-400 cursor-default'
            }`}
            whileTap={{ scale: hasUnsavedChanges ? 0.95 : 1 }}
          >
            {grading && <Loader2 className="h-3 w-3 animate-spin" />}
            {grading ? "Saving..." : hasUnsavedChanges ? "Save Grade" : "Saved"}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const QuestionAccordion = ({ response, index, quizQuestions, onGradeSaved }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true); // Open by default for clarity
  const { id: responseId, questionText, studentAnswer, correctAnswer, isCorrect, marksObtained } = response;

  const originalQuestion = quizQuestions?.find(q => q.questionText === questionText);
  const options = originalQuestion?.options || [studentAnswer, correctAnswer].filter(Boolean);
  const isCoding = originalQuestion?.questionType === 'coding';
  const isDescriptive = originalQuestion?.questionType === 'descriptive';
  const questionMarks = originalQuestion?.marks || 1;

  const [grading, setGrading] = useState(false);

  const handleSaveGrade = async (marksNum) => {
    setGrading(true);
    try {
      await api.put(`/api/results/responses/${responseId}/grade`, { marksObtained: marksNum });
      toast.success("Grade updated successfully!");
      if (onGradeSaved) onGradeSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save grade");
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 py-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">
          Question {index + 1} of {quizQuestions?.length || 1}
        </span>
        <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase ${
          marksObtained > 0 
            ? 'bg-green-100 text-green-800' 
            : isCoding || isDescriptive
            ? 'bg-amber-100 text-amber-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {marksObtained || 0}/{questionMarks}
        </span>
      </div>

      <div>
        <p className="text-gray-900 text-sm md:text-base font-medium leading-relaxed">{questionText}</p>
        {isCoding && (
          <span className="inline-block mt-2 text-[9px] uppercase tracking-wider font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Coding Question
          </span>
        )}
        {isDescriptive && (
          <span className="inline-block mt-2 text-[9px] uppercase tracking-wider font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Descriptive Essay
          </span>
        )}
      </div>

      <div className="space-y-3 pt-2">
        {isCoding ? (
          <CodingQuestionResult 
            studentAnswer={studentAnswer} 
            originalQuestion={originalQuestion} 
            marksObtained={marksObtained}
            questionMarks={questionMarks}
          />
        ) : isDescriptive ? (
          <div className="space-y-4">
            <div className="border border-gray-900 rounded-xl overflow-hidden shadow-sm">
              {/* Mockup-style header tab bar */}
              <div className="bg-[#dcd6e8] border-b border-gray-900 px-4 py-3 flex items-center justify-between text-xs text-gray-800 font-sans">
                <div className="flex items-center gap-6 font-semibold">
                  <span className="flex items-center gap-1.5 text-gray-900">✍️ Write</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-550 font-bold border-b-2 border-black pb-0.5">👁️ Candidate Answer</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-550">📖 Split Mode</span>
                </div>
                <div className="text-[10px] text-gray-500 font-bold font-mono">
                  {studentAnswer ? studentAnswer.split(/\s+/).filter(Boolean).length : 0}/5000 words
                </div>
              </div>
              <div className="bg-white p-5 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-sans min-h-[140px] max-h-[300px] overflow-y-auto light-scrollbar">
                {studentAnswer || "No answer submitted"}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {options.map((option, optIdx) => {
              const isSelected = option === studentAnswer;
              const isCorrectOption = option === correctAnswer;

              let optionStyle = "border-2 border-[#333333] bg-[#fcfcfc] text-[#333333]";
              let icon = null;

              if (isCorrectOption) {
                // Correct answer in green solid box
                optionStyle = "border-2 border-[#2e7d32] bg-[#2e7d32] text-white font-semibold";
                icon = <CheckCircle2 className="h-4 w-4 text-white shrink-0" />;
              } else if (isSelected && !isCorrectOption) {
                // Student chose wrong answer: red solid box
                optionStyle = "border-2 border-[#c62828] bg-[#c62828] text-white font-semibold";
                icon = <XCircle className="h-4 w-4 text-white shrink-0" />;
              }

              return (
                <div key={optIdx} className={`p-4 rounded-lg flex items-center justify-between text-xs md:text-sm transition-all ${optionStyle}`}>
                  <span>{option}</span>
                  {icon}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {user?.role === 'teacher' && (isDescriptive || isCoding) && (
        <GradeController 
          maxMarks={questionMarks}
          currentMarks={marksObtained}
          onSave={handleSaveGrade}
          grading={grading}
        />
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

  const fetchResult = async () => {
    try {
      const response = await api.get(`/api/results/${resultId}?t=${Date.now()}`);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load quiz attempt results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      className="bg-white min-h-screen text-black font-sans flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Top Banner Bar matching Mockup Image 1 */}
      <div className="h-14 bg-white border-b border-gray-900 flex items-center justify-between px-0 shrink-0 shadow-sm z-50 sticky top-0">
        <div className="flex items-center h-full">
          {/* Logo Box: full-height square with border-r */}
          <div 
            onClick={() => navigate(user?.role === 'teacher' ? '/staff-dashboard' : '/student-dashboard')}
            className="h-full aspect-square border-r border-gray-900 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <img 
              src="https://img.icons8.com/?size=100&id=iN7Kq2N1kEDB&format=png" 
              alt="Exam Results" 
              className="w-8 h-8 object-contain" 
            />
          </div>
          <span className="text-xs md:text-sm font-extrabold text-gray-800 uppercase tracking-wide px-6">
            Assessment: {result.quiz?.title || "Tools and techniques for creative thinking | CA - 5"}
          </span>
        </div>

        {/* Exit Button: full-height black square */}
        <button
          onClick={() => navigate(user?.role === 'teacher' ? '/staff-dashboard' : '/student-dashboard')}
          className="h-full aspect-square bg-black hover:bg-neutral-900 text-white flex items-center justify-center font-bold text-lg border-l border-gray-900 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Main Results Dashboard layout (Split Screen grid) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Summary cards, warnings log (Takes 4 columns, bg slate-50/10) */}
        <div className="lg:col-span-4 bg-slate-50/40 p-6 md:p-10 border-r border-gray-200">
          
          <div className="lg:sticky lg:top-20 space-y-6">
            
            {/* Main user profile block matching Mockup */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-4">
                {result.student?.profilePic ? (
                  <img 
                    src={result.student.profilePic} 
                    alt={result.student.name} 
                    className="w-12 h-12 rounded-full border border-gray-300 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center border border-gray-900 shadow-sm text-white">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-gray-900 tracking-tight leading-tight">{result.student?.name || 'Candidate'}</h3>
                  <p className="text-[10px] text-gray-500 font-bold truncate leading-none pt-0.5">{result.student?.email || 'candidate@gmail.com'}</p>
                  <p className="text-[9px] text-gray-400 font-bold tracking-wide leading-none pt-1">
                    Submitted on {new Date(result.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(result.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Top Summary Status */}
              <div className="bg-[#edf1e4] rounded-2xl p-4 border border-gray-300/60 flex items-start gap-3 shadow-sm">
                <div className="w-5 h-5 bg-[#689f38] border border-gray-900 flex items-center justify-center shadow-sm mt-0.5 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-gray-950 leading-snug">
                    {hasPassed ? "Assessment Passed" : "Assessment Completed"}
                  </h2>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Performance overview</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center bg-slate-50 border border-gray-150 p-4 rounded-2xl shadow-inner">
                  <span className="block text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Score</span>
                  <span className="text-xl font-black text-gray-900 tracking-tight">{result.score}/{result.totalQuestions}</span>
                </div>
                <div className="flex flex-col items-center bg-slate-50 border border-gray-150 p-4 rounded-2xl shadow-inner">
                  <span className="block text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Accuracy</span>
                  <span className="text-xl font-black text-gray-900 tracking-tight">{Math.round(scorePercentage)}%</span>
                </div>
                <div className="flex flex-col items-center bg-slate-50 border border-gray-150 p-4 rounded-2xl shadow-inner col-span-2">
                  <span className="block text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Time Taken</span>
                  <span className="text-sm font-black text-gray-955 tracking-wide">{timeFormatted}</span>
                </div>
                <div className="flex flex-col items-center bg-slate-50 border border-gray-150 p-4 rounded-2xl shadow-inner col-span-2">
                  <span className="block text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Attempted</span>
                  <span className="text-sm font-black text-gray-955 tracking-wide">{result.responses?.length || 0}/{result.quiz?.questions?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Proctor Deflection Report logs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-650 animate-pulse" /> Proctor Deflection Report
                </h2>
                {result.warningsList && result.warningsList.length > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    result.warningsList.length >= 4 
                      ? 'bg-red-650 text-white animate-pulse' 
                      : 'bg-orange-500 text-white'
                  }`} style={result.warningsList.length >= 4 ? { backgroundColor: '#cc1a1a' } : {}}>
                    {result.warningsList.length >= 4 ? 'Critical Threat' : 'Suspicious'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                    Verified Secure
                  </span>
                )}
              </div>

              {result.warningsList && result.warningsList.length > 0 ? (
                <div className="bg-[#faf9fc] border border-gray-200 rounded-3xl p-5 space-y-5 shadow-sm">
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 p-3 rounded-2xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-650 animate-ping shrink-0" style={{ backgroundColor: '#cc1a1a' }}></span>
                    <p className="text-[10px] text-red-800 font-extrabold uppercase tracking-wider">
                      {result.warningsList.length} Deflection Activity Logs Recorded
                    </p>
                  </div>
                  
                  <div className="relative border-l-2 border-red-200 ml-3 pl-5 space-y-5 pt-1 pb-1">
                    {result.warningsList.map((warn, index) => {
                      let typeLabel = warn.type.replace('_', ' ');
                      let typeDesc = 'Deflection activity detected';
                      let typeBg = 'bg-rose-50 text-rose-700 border-rose-150';

                      if (warn.type === 'TAB_SWITCH') {
                        typeDesc = 'Unfocused browser window or changed browser tab';
                        typeBg = 'bg-orange-50 text-orange-700 border-orange-150';
                      } else if (warn.type === 'FULLSCREEN') {
                        typeDesc = 'Exited secure full-screen assessment window';
                        typeBg = 'bg-red-50 text-red-700 border-red-150';
                      } else if (warn.type === 'FACE_MISSING') {
                        typeDesc = 'Gaze deflection or face went missing from camera view';
                        typeBg = 'bg-amber-50 text-amber-700 border-amber-150';
                      }

                      return (
                        <div key={warn.id} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-red-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-650" style={{ backgroundColor: '#cc1a1a' }}></div>
                          </div>
                          
                          <div className="bg-white border border-gray-150 rounded-2xl p-3.5 hover:shadow-md hover:border-gray-300 transition-all duration-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${typeBg}`}>
                                {typeLabel}
                              </span>
                              <span className="text-[9px] text-gray-400 font-bold font-mono">
                                Log #{index + 1}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-gray-800 leading-normal">
                              {typeDesc}
                            </p>
                            <div className="flex items-center justify-between pt-1 text-[8px] text-gray-400 font-mono font-bold">
                              <span>Timestamp</span>
                              <span>{new Date(warn.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shadow-inner">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Integrity Verified</h3>
                    <p className="text-[10px] text-gray-400 font-bold leading-normal max-w-[220px]">
                      No unauthorized activity or tab-switching was logged. Candidate maintained perfect compliance.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Student Responses sheet (Takes 8 columns, bg white) */}
        <div className="lg:col-span-8 bg-white p-6 md:p-10 space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-wider">Your Responses</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {result.responses?.map((res, index) => (
              <QuestionAccordion 
                key={res.id} 
                response={res} 
                index={index} 
                quizQuestions={result.quiz?.questions} 
                onGradeSaved={fetchResult}
              />
            ))}
          </div>
        </div>

      </div>
      {/* Subtle Footer for Icons8 Attribution */}
      <footer className="w-full py-3 border-t border-gray-200 bg-slate-50 text-center text-[10px] text-gray-400 font-sans tracking-wide shrink-0">
        <a target="_blank" rel="noopener noreferrer" href="https://icons8.com/icon/iN7Kq2N1kEDB/exam-results" className="hover:underline">Exam Results</a> icon by <a target="_blank" rel="noopener noreferrer" href="https://icons8.com" className="hover:underline">Icons8</a>
      </footer>
    </div>
  );
};

export default QuizResultsPage;
export { QuizResultsPage };