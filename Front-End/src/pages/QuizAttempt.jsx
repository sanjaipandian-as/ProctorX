import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

import {
  CheckCircle2,
  Camera,
  ScreenShare,
  Mic,
  User,
  Hourglass,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Expand,
  AlertCircle,
  Loader2,
  Bookmark,
  Clock,
  Play,
  Zap,
  XCircle,
  Volume2,
  RotateCcw
} from "lucide-react";

const ProctoringFeed = ({ stream, type, simulatedGazeDeflected, simulatedMultipleFaces }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const isCamera = type === "camera";
  const isViolating = simulatedGazeDeflected || simulatedMultipleFaces;

  return (
    <div className="bg-black rounded-lg aspect-video w-full flex items-center justify-center text-gray-400 relative overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover rounded-lg ${!stream && "hidden"
          }`}
      />
      {isCamera && stream && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`w-1/2 h-1/2 border border-dashed rounded-lg transition-all duration-300 relative ${isViolating ? 'border-black ring-black bg-red-500/5 animate-pulse' : 'border-emerald-500/70 bg-emerald-500/5'
            }`}>
            <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 ${isViolating ? 'border-black ring-black' : 'border-emerald-400'}`}></div>
            <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 ${isViolating ? 'border-black ring-black' : 'border-emerald-400'}`}></div>
            <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 ${isViolating ? 'border-black ring-black' : 'border-emerald-400'}`}></div>
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 ${isViolating ? 'border-black ring-black' : 'border-emerald-400'}`}></div>
            <div className={`absolute left-0 right-0 h-[1.5px] opacity-40 shadow-sm top-0 animate-[laser_2s_infinite_ease-in-out] ${isViolating ? 'bg-red-500 shadow-red-500' : 'bg-emerald-400 shadow-emerald-400'
              }`}></div>
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center pointer-events-none">
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${simulatedMultipleFaces
              ? 'bg-red-500/20 text-red-400 border border-black ring-black/30 animate-pulse'
              : simulatedGazeDeflected
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
              {simulatedMultipleFaces
                ? '👥 Multi Face'
                : simulatedGazeDeflected
                  ? '👀 Gaze Deflected'
                  : '👤 Gaze: Focused'}
            </span>
          </div>
        </div>
      )}
      {!stream && (
        <div className="flex flex-col items-center">
          {type === "camera" ? (
            <Camera className="h-6 w-6 mb-1" />
          ) : (
            <ScreenShare className="h-6 w-6 mb-1" />
          )}
          <span className="text-xs font-semibold">
            {type === "camera" ? "Camera Off" : "Screen Off"}
          </span>
        </div>
      )}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-gray-900 text-xs font-bold flex items-center">
        {type === "camera" ? (
          <Camera className="h-3 w-3 mr-1.5" />
        ) : (
          <ScreenShare className="h-3 w-3 mr-1.5" />
        )}
        {type === "camera" ? "Your Camera" : "Your Screen"}
      </div>
    </div>
  );
};

const SetupCheckItem = ({ title, status, children, check }) => {
  const statusIcons = {
    checked: <CheckCircle2 className="text-gray-900 h-5 w-5" />,
    unchecked: <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>,
  };
  return (
    <div className="flex items-start space-x-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm transition-all">
      <div className="mt-0.5">{statusIcons[status]}</div>
      <div className="flex-1">
        <h3 className={`font-semibold ${status === "checked" ? "text-gray-900" : "text-gray-500"}`}>
          {title}
        </h3>
        {check && <p className="text-sm text-gray-500 mt-1">{check}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
};

const SidebarChecklistItem = ({ label, isChecked }) => (
  <div className="flex items-center space-x-3">
    {isChecked ? (
      <CheckCircle2 className="h-5 w-5 text-gray-900 flex-shrink-0" />
    ) : (
      <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
    )}
    <span
      className={`text-sm tracking-wide transition-colors duration-200 ${isChecked ? "text-gray-900 font-semibold" : "text-gray-500 font-medium"
        }`}
    >
      {label}
    </span>
  </div>
);

const COMPILER_URL = import.meta.env.VITE_COMPILER_URL || "http://localhost:4000";

const CodingQuestion = ({ question, answer, onChange }) => {
  const [activeTab, setActiveTab] = useState('runTests');
  const [selectedTest, setSelectedTest] = useState(0);
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem(`qz_${question.id}_lang`);
    return savedLang || "cpp";
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [showResultsBanner, setShowResultsBanner] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  let parsedStarterCode = question.starterCode || {};
  if (typeof parsedStarterCode === 'string') {
    try { parsedStarterCode = JSON.parse(parsedStarterCode); } catch (e) { parsedStarterCode = {}; }
  }

  // Load language-specific code from localStorage or fallback to starter template
  const getLanguageCode = useCallback((lang) => {
    const saved = localStorage.getItem(`qz_${question.id}_code_${lang}`);
    if (saved !== null) return saved;
    return parsedStarterCode?.[lang] || parsedStarterCode?.cpp || '';
  }, [question.id, parsedStarterCode]);

  const [codeText, setCodeText] = useState(() => getLanguageCode(language));

  // Only restore code from storage when question or language changes — do NOT call onChange here
  // (calling onChange here causes "setState during render" because CodingQuestion is mid-render)
  useEffect(() => {
    const currentCode = getLanguageCode(language);
    setCodeText(currentCode);
    // Intentionally NOT calling onChange here.
    // The parent's answer state is updated only via explicit user edits (handleCodeChange).
  }, [question.id, language, getLanguageCode]);

  const handleCodeChange = (newCode) => {
    setCodeText(newCode);
    localStorage.setItem(`qz_${question.id}_code_${language}`, newCode);
    onChange(newCode);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem(`qz_${question.id}_lang`, newLang);
    const codeForNewLang = getLanguageCode(newLang);
    setCodeText(codeForNewLang);
    onChange(codeForNewLang);
  };

  const lineCount = (codeText || '').split('\n').length;

  // Code suggestions helper based on language syntax
  const getCodeSuggestions = () => {
    const suggestions = {
      cpp: [
        { snippet: "#include <iostream>\nusing namespace std;", desc: "Basic header import and namespace" },
        { snippet: "int main() {\n    return 0;\n}", desc: "Main entry point structure" },
        { snippet: "for (int i = 0; i < length; i++) {\n    \n}", desc: "Basic counter-based for loop" },
        { snippet: "string s;\ncin >> s;", desc: "Read word string from stdin input" },
      ],
      c: [
        { snippet: "#include <stdio.h>\n#include <string.h>", desc: "Standard headers for Input/Output & Strings" },
        { snippet: "printf(\"output\\n\");", desc: "Print standard text output to console" },
        { snippet: "int len = strlen(str);", desc: "Get string length function" },
        { snippet: "for (int i = 0; i < len; i++) {\n    \n}", desc: "Basic loop syntax" },
      ],
      python: [
        { snippet: "print(\"output\")", desc: "Standard print function" },
        { snippet: "for i in range(len(arr)):", desc: "Basic sequence loop structure" },
        { snippet: "import sys\nfor line in sys.stdin:\n    word = line.strip()", desc: "Read word lines from stdin redirected input" },
        { snippet: "s = s[::-1]", desc: "Basic string reversal slice syntax" },
      ],
      java: [
        { snippet: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}", desc: "Main class template & scanner import" },
        { snippet: "System.out.println(\"output\");", desc: "System console print function" },
        { snippet: "for (int i = 0; i < str.length(); i++) {\n    char c = str.charAt(i);\n}", desc: "Iterate through string characters" },
      ],
      javascript: [
        { snippet: "console.log(\"output\");", desc: "Console print statement" },
        { snippet: "const len = str.length;\nfor (let i = 0; i < len; i++) {\n    \n}", desc: "Basic let-based loop iterator" },
        { snippet: "const reversed = str.split(\"\").reverse().join(\"\");", desc: "String reverse helper reference" },
      ]
    };
    return suggestions[language] || [];
  };

  let tests = [];
  try {
    tests = Array.isArray(question.testcases)
      ? question.testcases
      : (typeof question.testcases === 'string' ? JSON.parse(question.testcases || '[]') : []);
  } catch (e) {
    tests = [];
  }

  const runCode = async () => {
    if (!codeText || codeText.trim() === '') {
      setConsoleOutput("❌ Error:\n\nCode cannot be empty.");
      return;
    }
    setIsRunning(true);
    setConsoleOutput("⏳ Running your code...");
    try {
      const res = await axios.post(`${COMPILER_URL}/run`, {
        language,
        code: codeText,
        tests: [{ input: customInput || "" }]
      });

      if (res.data.compile && res.data.compile.code !== 0) {
        setConsoleOutput(`❌ Compilation Error:\n\n${res.data.compile.stderr || res.data.compile.stdout}`);
        return;
      }

      if (res.data.tests && res.data.tests.length > 0) {
        const testResult = res.data.tests[0];
        if (testResult.killed) {
          setConsoleOutput("⏱️ Time Limit Exceeded\n\nYour code took too long to execute.");
        } else if (testResult.code !== 0) {
          setConsoleOutput(`❌ Runtime Error:\n\n${testResult.stderr || testResult.stdout || "Unknown error"}`);
        } else {
          setConsoleOutput(testResult.stdout || "(empty output)");
        }
      }
    } catch (err) {
      const details = err.response?.data?.details?.map(d => `${d.field}: ${d.message}`).join("\n");
      const errorMessage = details ? `${err.response.data.error}\n${details}` : err.response?.data?.error || err.message;
      setConsoleOutput(`❌ Error:\n\n${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    if (!codeText || codeText.trim() === '') {
      toast.error("Code cannot be empty.");
      return;
    }
    if (tests.length === 0) {
      toast.error("No test cases available.");
      return;
    }
    setIsRunningTests(true);
    setTestResults([]);
    setShowResultsBanner(false);
    try {
      const res = await axios.post(`${COMPILER_URL}/run`, {
        language,
        code: codeText,
        tests: tests.map(t => ({ input: t.input || "" }))
      });

      if (res.data.compile && res.data.compile.code !== 0) {
        toast.error("Compilation Error");
        const compError = res.data.compile.stderr || res.data.compile.stdout;
        setConsoleOutput(`❌ Compilation Error:\n\n${compError}`);

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
      toast.error(`Error: ${errorMsg}`);
      if (details) {
        setConsoleOutput(`❌ Validation Error:\n\n${details}`);
      }
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
  };

  const passedTestsCount = testResults.filter(r => r.passed).length;
  const totalTestsCount = tests.length || 0;

  return (
    <div className="flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm mt-2 flex-1 min-h-[650px] max-h-[850px]">
      {/* Top bar: language dropdown + fullscreen icon */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-gray-200 flex-shrink-0">
        <select
          className="bg-white text-gray-500 text-sm font-bold px-4 py-2 border-2 border-gray-400 outline-none cursor-pointer uppercase rounded-none transition-all"
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          <option value="c">C</option>
          <option value="cpp">CPP</option>
          <option value="python">PYTHON</option>
          <option value="java">JAVA</option>
          <option value="javascript">NODEJS</option>
        </select>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to reset the code for this language? Your progress will be lost.")) {
              const defaultTemplates = {
                cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    return 0;\n}",
                c: "#include <stdio.h>\n\nint main() {\n    // Write your C code here\n    return 0;\n}",
                python: "# Write your Python code here",
                java: "public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n    }\n}",
                javascript: "// Write your Node.js JavaScript code here"
              };
              handleCodeChange(defaultTemplates[language] || "");
            }
          }}
          className="text-gray-500 hover:text-black p-1.5 hover:bg-slate-200 transition-colors"
          title="Reset Code Template"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Code editor area */}
      <div className="flex flex-[3] overflow-hidden bg-white min-h-0 relative">
        <div className="w-12 bg-slate-50 border-r border-gray-200 text-gray-400 text-right pr-3 pt-3 select-none font-mono text-[12px] leading-[1.7] overflow-y-auto custom-scrollbar">
          {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          className="flex-1 bg-white text-slate-800 p-4 resize-none outline-none font-mono text-[13px] leading-[1.7] overflow-y-auto custom-scrollbar"
          placeholder="Write your code here..."
          spellCheck="false"
          value={codeText}
          onChange={(e) => handleCodeChange(e.target.value)}
        />
      </div>

      {/* Bottom bar: Run / Run Tests / Suggestions tabs */}
      <div className="border-t border-gray-300 bg-white flex flex-col flex-[2] min-h-0 flex-shrink-0">
        <div className="flex border-b border-gray-300 bg-slate-50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('run')}
            disabled={isRunning || isRunningTests}
            className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-r border-gray-200 flex items-center gap-2 ${isRunning || isRunningTests ? 'text-gray-400 cursor-not-allowed' : activeTab === 'run' ? 'text-black bg-white border-b-2 border-b-black' : 'text-slate-600 hover:bg-slate-100'}`}>
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run
          </button>
          <button
            onClick={() => setActiveTab('runTests')}
            disabled={isRunning || isRunningTests}
            className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-r border-gray-200 flex items-center gap-2 ${isRunning || isRunningTests ? 'text-gray-400 cursor-not-allowed' : activeTab === 'runTests' ? 'text-black bg-white border-b-2 border-b-black' : 'text-slate-600 hover:bg-slate-100'}`}>
            {isRunningTests ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Run Tests
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            disabled={isRunning || isRunningTests}
            className={`px-6 py-3 text-xs font-extrabold uppercase tracking-wider transition-all border-r border-gray-200 flex items-center gap-2 ${isRunning || isRunningTests ? 'text-gray-400 cursor-not-allowed' : activeTab === 'suggestions' ? 'text-black bg-white border-b-2 border-b-black' : 'text-slate-600 hover:bg-slate-100'}`}>
            Syntax Reference
          </button>
        </div>

        {activeTab === 'suggestions' && (
          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-gray-50 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Syntax Reference & Snippets ({language.toUpperCase()})</span>
              <span className="text-[10px] text-rose-600 font-bold tracking-wider uppercase bg-rose-50 px-2.5 py-1 rounded border border-rose-200">Manual Typing Required</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getCodeSuggestions().map((s, idx) => (
                <div key={idx} className="p-4 bg-white rounded-xl border border-gray-200 flex flex-col justify-between hover:border-gray-300 transition-colors shadow-sm">
                  <span className="text-xs font-semibold text-gray-700 block mb-2">{s.desc}</span>
                  <pre
                    className="p-3 bg-gray-50 text-gray-900 rounded-lg font-mono text-xs select-none pointer-events-none overflow-x-auto border border-gray-200"
                  >
                    {s.snippet}
                  </pre>
                </div>
              ))}
              {getCodeSuggestions().length === 0 && (
                <div className="col-span-2 text-center text-xs text-gray-400 py-10">No snippets loaded for {language}</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'runTests' && (
          <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
            {showResultsBanner && (
              <div className={`border-b border-gray-400 px-5 py-1.5 flex items-center justify-center relative flex-shrink-0 ${passedTestsCount === totalTestsCount ? 'bg-[#d4edda]' : 'bg-[#fce4ec]'}`}>
                <span className="text-[13px] font-bold text-gray-900">
                  You have passed {passedTestsCount}/{totalTestsCount} tests
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
                    onClick={runAllTests}
                    disabled={isRunningTests}
                    className="w-auto mx-auto flex items-center space-x-2 px-4 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-800 hover:bg-gray-50 transition shadow-sm disabled:opacity-50 justify-center">
                    {isRunningTests ? <Loader2 size={14} className="animate-spin text-black" /> : <Play size={14} className="text-black" />}
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                    <span className="text-sm font-medium">This is a hidden test case</span>
                  </div>
                ) : (
                  <div className="p-5 space-y-5">
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-800 mb-2 tracking-tight">Input</h4>
                      <div className="w-full p-3 bg-white border border-gray-300 rounded text-[13px] font-mono text-gray-800 whitespace-pre-wrap">
                        {tests[selectedTest]?.input || 'none'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-800 mb-2 tracking-tight">Expected Output</h4>
                      <div className="w-full p-3 bg-white border border-gray-300 rounded text-[13px] font-mono text-gray-800 whitespace-pre-wrap">
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
                          return <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded text-[13px] font-mono text-gray-500 whitespace-pre-wrap italic">Click 'Run Tests' to see output</div>;
                        }

                        return (
                          <div className={`w-full p-3 bg-white border rounded text-[13px] font-mono whitespace-pre-wrap ${hasOutput && isMatched ? "border-green-400 bg-green-50 text-green-900" : "border-red-400 bg-red-50 text-red-900"}`}>
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

        {activeTab === 'run' && (
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-gray-50 flex flex-col min-h-0">
            <div>
              <button
                onClick={runCode}
                disabled={isRunning}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm mb-4 disabled:opacity-50">
                {isRunning ? <Loader2 size={14} className="animate-spin text-black" /> : <Play size={14} className="text-black" />}
                <span>Run Code</span>
              </button>
              <label className="text-[13px] font-bold text-gray-800 block mb-2 tracking-tight">Custom Input</label>
              <textarea
                className="w-full h-24 p-3 bg-white border border-gray-300 rounded text-[13px] font-mono text-gray-800 resize-none outline-none focus:border-black"
                placeholder="Enter your input here..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
              ></textarea>
            </div>
            <div className="mt-5 flex-1 min-h-[100px] flex flex-col">
              <label className="text-[13px] font-bold text-gray-800 block mb-2 tracking-tight">Console Output</label>
              <div className="w-full flex-1 p-3 bg-gray-900 border border-gray-900 rounded text-[13px] font-mono text-green-400 whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                {consoleOutput || "Output will appear here..."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const QuizFlow = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket(quizId);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);

  const autoSubmitSavedAnswers = useCallback(async (quizData, savedAnswersRaw, savedWarningsRaw) => {
    try {
      const savedAnswers = JSON.parse(savedAnswersRaw);
      const savedWarnings = savedWarningsRaw !== null ? parseInt(savedWarningsRaw, 10) : 5;

      const formattedAnswers = quizData.questions.map((q, idx) => {
        const answerValue = savedAnswers[idx]?.answer;
        let studentAnswer = '';

        const qType = (q.questionType || '').toLowerCase();
        if (qType === 'mcq') {
          studentAnswer = answerValue !== null && answerValue !== undefined ? (q.options[answerValue] || '') : '';
        } else if (qType === 'descriptive' || qType === 'coding') {
          studentAnswer = typeof answerValue === 'string' ? answerValue : '';
        }

        return {
          questionText: q.questionText,
          studentAnswer
        };
      });

      const submissionData = {
        quizId: quizData.id,
        timeTaken: quizData.durationInMinutes * 60,
        warnings: 5 - savedWarnings,
        penalties: 0,
        answers: formattedAnswers,
      };

      const response = await api.post("/api/results/submit", submissionData);
      const newResultId = response.data.id;

      if (user) {
        localStorage.removeItem(`isOtpVerified_${quizId}_${user.id}`);
        localStorage.removeItem(`warnings_${quizId}_${user.id}`);
        localStorage.removeItem(`answers_${quizId}_${user.id}`);
        localStorage.removeItem(`honourCodeAgreed_${quizId}_${user.id}`);
      }

      toast.success("Time has expired! Your saved answers have been automatically submitted.", { duration: 6000 });
      navigate(`/results/${newResultId}`, { replace: true });
    } catch (err) {
      console.error("Failed to auto-submit offline answers:", err);
      if (err.response?.status === 400 || err.response?.data?.message?.includes("already attempted")) {
        if (user) {
          localStorage.removeItem(`isOtpVerified_${quizId}_${user.id}`);
          localStorage.removeItem(`warnings_${quizId}_${user.id}`);
          localStorage.removeItem(`answers_${quizId}_${user.id}`);
          localStorage.removeItem(`honourCodeAgreed_${quizId}_${user.id}`);
        }
        navigate(`/staff-dashboard`, { replace: true });
      }
    }
  }, [quizId, navigate, user]);

  const [honourCodeAgreed, setHonourCodeAgreed] = useState(false);
  const [securityCode, setSecurityCode] = useState(Array(6).fill(""));
  const [securityCodeError, setSecurityCodeError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [simulatedGazeDeflected, setSimulatedGazeDeflected] = useState(false);
  const [simulatedMultipleFaces, setSimulatedMultipleFaces] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);
  const [warnings, setWarnings] = useState(5);
  const [devToolsDetected, setDevToolsDetected] = useState(false);

  const cameraFeedRef = useRef(null);
  const screenFeedRef = useRef(null);
  const inputRefs = useRef([]);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const submittedRef = useRef(false);
  const lastDeflectionTimeRef = useRef(0);
  const warningInFlightRef = useRef(false); // prevents concurrent double-deductions
  const step4EntryTimeRef = useRef(0);
  const deflectionToastRef = useRef(null);
  const deflectionPenalizedRef = useRef(false);
  const multipleFacesToastRef = useRef(null);
  const multipleFacesPenalizedRef = useRef(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600);

  // Restore state once user and quizId are loaded
  useEffect(() => {
    if (user && quizId) {
      const savedOtp = localStorage.getItem(`isOtpVerified_${quizId}_${user.id}`);
      if (savedOtp === "true") setIsOtpVerified(true);

      const savedWarnings = localStorage.getItem(`warnings_${quizId}_${user.id}`);
      if (savedWarnings !== null) setWarnings(parseInt(savedWarnings, 10));

      const savedHonour = localStorage.getItem(`honourCodeAgreed_${quizId}_${user.id}`);
      if (savedHonour === "true") setHonourCodeAgreed(true);
    }
  }, [user, quizId]);

  // Persist answers
  useEffect(() => {
    if (user && quizId && answers && answers.length > 0) {
      localStorage.setItem(`answers_${quizId}_${user.id}`, JSON.stringify(answers));
    }
  }, [answers, quizId, user]);

  // Persist warnings
  useEffect(() => {
    if (user && quizId) {
      localStorage.setItem(`warnings_${quizId}_${user.id}`, warnings.toString());
    }
  }, [warnings, quizId, user]);

  // Persist honourCodeAgreed
  useEffect(() => {
    if (user && quizId) {
      localStorage.setItem(`honourCodeAgreed_${quizId}_${user.id}`, honourCodeAgreed ? "true" : "false");
    }
  }, [honourCodeAgreed, quizId, user]);

  // Persist isOtpVerified
  useEffect(() => {
    if (user && quizId) {
      localStorage.setItem(`isOtpVerified_${quizId}_${user.id}`, isOtpVerified ? "true" : "false");
    }
  }, [isOtpVerified, quizId, user]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    cameraStreamRef.current = null;
    setCameraStream(null);
    setCameraEnabled(false);
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    screenStreamRef.current = null;
    setScreenStream(null);
    setScreenEnabled(false);
  }, []);

  const formatTime = useCallback((seconds) => {
    if (!quiz) return '00:00';
    if (seconds < 0) seconds = 0;

    if (quiz.durationInMinutes >= 60) {
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    } else {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }
  }, [quiz]);

  useEffect(() => {
    const fetchAndAuthorizeQuiz = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const existingResultRes = await api.get(`/api/results/check/${quizId}`);
        if (existingResultRes.data.attempted) {
          toast.error("You have already attempted this quiz.");
          navigate(`/staff-dashboard`, { replace: true });
          return;
        }

        // Initialize warnings from DB warning count (authoritative to prevent reload resets)
        const dbWarningsCount = existingResultRes.data.warningCount || 0;
        const initialWarnings = Math.max(5 - dbWarningsCount, 0);
        setWarnings(initialWarnings);
        localStorage.setItem(`warnings_${quizId}_${user.id}`, initialWarnings.toString());

        const quizRes = await api.get(`/api/quizzes/${quizId}`);
        const quizData = quizRes.data;

        // Compute server-authoritative remaining time so late joiners see correct countdown
        let computedTimeLeft = (quizData.durationInMinutes || 60) * 60;
        if (quizData.status === 'ACTIVE' && quizData.startedAt) {
          const elapsedSeconds = Math.floor((Date.now() - new Date(quizData.startedAt).getTime()) / 1000);
          computedTimeLeft = Math.max((quizData.durationInMinutes * 60) - elapsedSeconds, 0);
        }
        // Respect the hard wall-clock endsAt deadline — late joiners get less time
        if (quizData.endsAt) {
          const secondsUntilEnd = Math.floor((new Date(quizData.endsAt).getTime() - Date.now()) / 1000);
          computedTimeLeft = Math.min(computedTimeLeft, Math.max(secondsUntilEnd, 0));
        }

        // If the exam is closed or the time limit is up
        const isTimeExpired = (quizData.endsAt && new Date() > new Date(quizData.endsAt)) || computedTimeLeft <= 0 || quizData.status === 'COMPLETED';

        if (isTimeExpired) {
          const savedAnswersRaw = localStorage.getItem(`answers_${quizId}_${user.id}`);
          const savedWarningsRaw = localStorage.getItem(`warnings_${quizId}_${user.id}`);

          if (savedAnswersRaw) {
            // Auto-submit saved work!
            await autoSubmitSavedAnswers(quizData, savedAnswersRaw, savedWarningsRaw);
            return;
          } else {
            // No saved work to submit, show standard ended screen
            setError('exam_ended');
            setLoading(false);
            return;
          }
        }

        setQuiz({
          id: quizData.id,
          platformName: "ProctorX",
          title: quizData.title,
          status: quizData.status,
          startedAt: quizData.startedAt,
          endsAt: quizData.endsAt || null,
          proctoringProvider: "Remote",
          duration: quizData.durationInMinutes >= 60 ? `${quizData.durationInMinutes / 60}h` : `${quizData.durationInMinutes}m`,
          durationInMinutes: quizData.durationInMinutes,
          questions: quizData.questions || [],
          studentName: user.name,
          studentEmail: user.email,
        });
        const savedAnswers = localStorage.getItem(`answers_${quizId}_${user.id}`);
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        } else {
          setAnswers(
            Array.from({ length: quizData.questions.length }, () => ({
              answer: null,
              status: "unanswered",
            }))
          );
        }
        setTimeLeft(computedTimeLeft);
      } catch (err) {
        console.error("Authorization failed or error fetching data:", err);
        setError(
          err.response?.data?.message || "An error occurred while loading the quiz."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAndAuthorizeQuiz();

    const handleFullScreenChange = () =>
      setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      stopCamera();
      stopScreenShare();
    };
  }, [quizId, navigate, user, stopCamera, stopScreenShare]);

  // Track step 4 entry time to prevent immediate fullscreen warning deflection on load
  useEffect(() => {
    if (step === 4) {
      step4EntryTimeRef.current = Date.now();
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    // Construct answers array matching backend submit schema
    const formattedAnswers = quiz.questions.map((q, idx) => {
      const answerValue = answers[idx]?.answer;
      let studentAnswer = '';

      const qType = (q.questionType || '').toLowerCase();
      if (qType === 'mcq') {
        // MCQ: answerValue is the option index
        studentAnswer = answerValue !== null && answerValue !== undefined ? (q.options[answerValue] || '') : '';
      } else if (qType === 'descriptive' || qType === 'coding') {
        // Descriptive/Coding: answerValue is the raw text string
        studentAnswer = typeof answerValue === 'string' ? answerValue : '';
      }

      return {
        questionText: q.questionText,
        studentAnswer
      };
    });

    const submissionData = {
      quizId: quizId,
      timeTaken: quiz.durationInMinutes * 60 - timeLeft,
      warnings: 5 - warnings,
      penalties: 0,
      answers: formattedAnswers,
    };

    try {
      const response = await api.post("/api/results/submit", submissionData);
      const newResultId = response.data.id;

      if (socket) {
        socket.emit('student:submitted', { quizId, studentId: user.id });
      }

      stopCamera();
      stopScreenShare();

      // Clear localStorage on successful submit
      if (user) {
        localStorage.removeItem(`isOtpVerified_${quizId}_${user.id}`);
        localStorage.removeItem(`warnings_${quizId}_${user.id}`);
        localStorage.removeItem(`answers_${quizId}_${user.id}`);
        localStorage.removeItem(`honourCodeAgreed_${quizId}_${user.id}`);
      }

      // Exit fullscreen before redirecting
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }

      navigate(`/results/${newResultId}`, { replace: true });
    } catch (error) {
      submittedRef.current = false;
      console.error("Failed to submit quiz results:", error);
      toast.error(error.response?.data?.message || "Error submitting answers.");
    }
  }, [quiz, answers, timeLeft, warnings, quizId, navigate, stopCamera, stopScreenShare, socket, user]);

  // Handle active socket proctoring monitoring
  useEffect(() => {
    if (step === 4 && socket && user) {
      // 1. Join room
      socket.emit('student:join', {
        quizId,
        studentId: user.id,
        name: user.name
      });

      // 2. Setup heartbeats
      const heartbeatTimer = setInterval(() => {
        socket.emit('student:heartbeat', { quizId, studentId: user.id });
      }, 25000);

      // 3. Listen for force-submit command
      socket.on('student:force-submit', ({ reason }) => {
        toast.error(`Forced Submission: ${reason}`, { duration: 6000 });
        handleSubmit();
      });

      return () => {
        clearInterval(heartbeatTimer);
        socket.off('student:force-submit');
      };
    }
  }, [step, socket, user, quizId, handleSubmit]);

  // Heartbeat & Timer countdown
  useEffect(() => {
    if (step === 4) {
      if (timeLeft <= 0) {
        toast.error("Time is up! Submitting your quiz now.");
        handleSubmit();
        return;
      }
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft, handleSubmit]);

  // Fullscreen warning — event-driven so it can't double-fire with tab-switch
  useEffect(() => {
    if (step !== 4) return;

    const handleFullscreenChange = () => {
      const nowFullscreen = !!document.fullscreenElement;
      if (nowFullscreen) return; // re-entered fullscreen — no penalty

      const now = Date.now();
      if (now - step4EntryTimeRef.current < 2000) return;
      if (warningInFlightRef.current) return;
      if (now - lastDeflectionTimeRef.current < 5000) return;

      warningInFlightRef.current = true;
      lastDeflectionTimeRef.current = now;

      setWarnings((prevWarnings) => {
        const newWarnings = prevWarnings - 1;

        if (socket && user) {
          socket.emit('student:warning', { quizId, studentId: user.id, type: 'FULLSCREEN' });
        }

        if (newWarnings <= 0) {
          toast.error("You have exceeded the maximum number of warnings. Your quiz will be submitted automatically.", { duration: 4000 });
          setTimeout(() => { handleSubmit(); warningInFlightRef.current = false; }, 0);
        } else {
          toast.error(`You have exited full-screen. You have ${newWarnings} warning lives left.`, { icon: "⚠️", duration: 4050 });
          setTimeout(() => {
            setStep(3);
            setSecurityCode(Array(6).fill(""));
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.log(err));
            }
          }, 100);
          setTimeout(() => { warningInFlightRef.current = false; }, 5000); // 5s lock to settle screen transitions
        }

        return newWarnings;
      });
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [step, handleSubmit, socket, user, quizId]);

  // Tab, Window, and Trackpad deflection warning monitoring (Alt+Tab, swipe, devtools, other windows)
  useEffect(() => {
    if (step !== 4) return;

    const handleWindowDeflection = () => {
      const now = Date.now();
      // Cooldown of 2 seconds after entering step 4 to allow browser focus to settle
      if (now - step4EntryTimeRef.current < 2000) return;
      // Global lock: prevent any concurrent deduction (fullscreen + blur + visibility all at once)
      if (warningInFlightRef.current) return;
      // Throttle to once every 5 seconds to prevent double triggers
      if (now - lastDeflectionTimeRef.current < 5000) return;

      warningInFlightRef.current = true;
      lastDeflectionTimeRef.current = now;

      setWarnings((prevWarnings) => {
        const newWarnings = prevWarnings - 1;

        if (socket && user) {
          socket.emit('student:warning', { quizId, studentId: user.id, type: 'TAB_SWITCH' });
        }

        if (newWarnings <= 0) {
          toast.error("You have switched tabs, windows, or apps. Maximum warnings exceeded. Submitting quiz now.", { duration: 4000 });
          setTimeout(() => { handleSubmit(); warningInFlightRef.current = false; }, 0);
        } else {
          toast.error(`Warning: Switching apps, windows, or desktops is prohibited. You have ${newWarnings} lives left.`, { icon: "⚠️", duration: 4500 });
          setTimeout(() => {
            setStep(3);
            setSecurityCode(Array(6).fill(""));
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.log(err));
            }
          }, 100);
          setTimeout(() => { warningInFlightRef.current = false; }, 5000);
        }

        return newWarnings;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleWindowDeflection();
      }
    };

    window.addEventListener("blur", handleWindowDeflection);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleWindowDeflection);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [step, socket, user, quizId, handleSubmit]);

  // Block Copy, Cut, Paste, and Context Menu actions completely during exam setup and attempt
  useEffect(() => {
    const handleCopyCutPaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toast.error("Copying, cutting, and pasting is strictly prohibited!", {
        id: "clipboard-toast",
        icon: "🚫",
        duration: 3000
      });
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.error("Right-click context menu is disabled during the assessment.", {
        id: "context-menu-toast",
        duration: 3000
      });
    };

    document.addEventListener("copy", handleCopyCutPaste, true);
    document.addEventListener("cut", handleCopyCutPaste, true);
    document.addEventListener("paste", handleCopyCutPaste, true);
    document.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.removeEventListener("copy", handleCopyCutPaste, true);
      document.removeEventListener("cut", handleCopyCutPaste, true);
      document.removeEventListener("paste", handleCopyCutPaste, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, []);

  // Block Keyboard Navigation & Inspect Shortcuts (Alt+Left/Right/Home, Backspace, F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isAltLeft = e.altKey && (e.key === "ArrowLeft" || e.keyCode === 37);
      const isAltRight = e.altKey && (e.key === "ArrowRight" || e.keyCode === 39);
      const isAltHome = e.altKey && (e.key === "Home" || e.keyCode === 36);
      const isBackspaceBack = e.key === "Backspace" &&
        e.target.tagName !== "INPUT" &&
        e.target.tagName !== "TEXTAREA" &&
        !e.target.isContentEditable;

      const isInspectKey = e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) ||
        (e.ctrlKey && ["U", "u", "S", "s"].includes(e.key)) ||
        (e.metaKey && e.altKey && ["I", "i", "J", "j", "C", "c"].includes(e.key));

      if (isAltLeft || isAltRight || isAltHome || isBackspaceBack || isInspectKey) {
        e.preventDefault();
        e.stopPropagation();

        const warningMsg = isInspectKey
          ? "DevTools / Inspect shortcuts are strictly prohibited."
          : "Browser navigation shortcuts are prohibited.";

        if (step === 4) {
          const now = Date.now();
          if (now - step4EntryTimeRef.current < 2000) return;
          if (warningInFlightRef.current) return;
          if (now - lastDeflectionTimeRef.current < 5000) return;

          warningInFlightRef.current = true;
          lastDeflectionTimeRef.current = now;

          setWarnings((prevWarnings) => {
            const newWarnings = prevWarnings - 1;

            if (socket && user) {
              socket.emit('student:warning', { quizId, studentId: user.id, type: 'TAB_SWITCH' });
            }

            if (newWarnings <= 0) {
              toast.error(`${warningMsg} Maximum warnings exceeded. Submitting quiz now.`, { duration: 4000 });
              setTimeout(() => { handleSubmit(); warningInFlightRef.current = false; }, 0);
            } else {
              toast.error(`Warning: ${warningMsg} You have ${newWarnings} lives left.`, { icon: "⚠️", duration: 4500 });
              setTimeout(() => {
                setStep(3);
                setSecurityCode(Array(6).fill(""));
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(err => console.log(err));
                }
              }, 100);
              setTimeout(() => { warningInFlightRef.current = false; }, 5000);
            }

            return newWarnings;
          });
        } else {
          toast.error(`${warningMsg} Action blocked.`, { id: "step-block-toast", duration: 3000 });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [step, socket, user, quizId, handleSubmit]);

  // Block Browser History Navigation (PopState / Back Button)
  useEffect(() => {
    if (step !== 4) return;

    // Push state immediately to create a history entry we can capture
    window.history.pushState(null, null, window.location.href);

    const handlePopState = (e) => {
      // Re-push state to lock the user on the quiz page
      window.history.pushState(null, null, window.location.href);

      const now = Date.now();
      if (now - step4EntryTimeRef.current < 2000) return;
      if (warningInFlightRef.current) return;
      if (now - lastDeflectionTimeRef.current < 5000) return;

      warningInFlightRef.current = true;
      lastDeflectionTimeRef.current = now;

      setWarnings((prevWarnings) => {
        const newWarnings = prevWarnings - 1;

        if (socket && user) {
          socket.emit('student:warning', { quizId, studentId: user.id, type: 'TAB_SWITCH' });
        }

        if (newWarnings <= 0) {
          toast.error("Navigation attempt detected. Maximum warnings exceeded. Submitting quiz now.", { duration: 4000 });
          setTimeout(() => { handleSubmit(); warningInFlightRef.current = false; }, 0);
        } else {
          toast.error(`Warning: Navigating away is prohibited. You have ${newWarnings} lives left.`, { icon: "⚠️", duration: 4500 });
          setTimeout(() => {
            setStep(3);
            setSecurityCode(Array(6).fill(""));
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.log(err));
            }
          }, 100);
          setTimeout(() => { warningInFlightRef.current = false; }, 5000);
        }

        return newWarnings;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [step, socket, user, quizId, handleSubmit]);

  // Warn on reload/close tab (BeforeUnload)
  useEffect(() => {
    if (step !== 4) return;

    const handleBeforeUnload = (e) => {
      if (submittedRef.current) return;
      const message = "Are you sure you want to leave? Your exam progress will be lost and may be submitted automatically.";
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [step]);

  // Viewport size, debugger timing, and console evaluation monitor to detect DevTools and Side Panels across all steps
  useEffect(() => {
    // Console property evaluation trick
    const devtoolsState = { isOpen: false };
    const element = new Image();
    Object.defineProperty(devtoolsState, 'isOpen', {
      get: () => {
        devtoolsState.isOpen = true;
        handleDevToolsViolation();
        return true;
      }
    });

    const handleDevToolsViolation = () => {
      setDevToolsDetected(true);

      if (step === 4) {
        const now = Date.now();
        // Cooldown of 3 seconds after entering step 4 to allow resize/transitions to settle
        if (now - step4EntryTimeRef.current < 3000) return;
        if (warningInFlightRef.current) return;
        if (now - lastDeflectionTimeRef.current < 5000) return;

        warningInFlightRef.current = true;
        lastDeflectionTimeRef.current = now;

        setWarnings((prevWarnings) => {
          const newWarnings = prevWarnings - 1;

          if (socket && user) {
            socket.emit('student:warning', { quizId, studentId: user.id, type: 'OTHER' });
          }

          if (newWarnings <= 0) {
            toast.error("DevTools / Side Panel detected. Maximum warnings exceeded. Submitting quiz now.", { duration: 4000 });
            setTimeout(() => { handleSubmit(); warningInFlightRef.current = false; }, 0);
          } else {
            toast.error(`Warning: Opening DevTools or browser Side Panels (e.g. Gemini) is strictly prohibited. You have ${newWarnings} lives left.`, { icon: "⚠️", duration: 4500 });
            setTimeout(() => {
              setStep(3);
              setSecurityCode(Array(6).fill(""));
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
              }
            }, 100);
            setTimeout(() => { warningInFlightRef.current = false; }, 5000);
          }

          return newWarnings;
        });
      }
    };

    const checkDevTools = () => {
      // 1. Viewport size delta check (for docked DevTools and Side Panels like Gemini)
      const threshold = 160;
      const widthDev = window.outerWidth - window.innerWidth > threshold;
      const heightDev = window.outerHeight - window.innerHeight > threshold;

      if (widthDev || heightDev) {
        handleDevToolsViolation();
        return;
      }

      // 2. Debugger timing latency check (compiled dynamically inside a VM to hide QuizAttempt.jsx code context)
      const startTime = performance.now();
      try {
        Function("debugger")();
      } catch (e) { }
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        handleDevToolsViolation();
        return;
      }

      // 3. Evaluate console getter
      console.log(devtoolsState);

      // If no checks failed, reset detection
      setDevToolsDetected(false);
    };

    // Run check periodically and on window events
    const intervalId = setInterval(checkDevTools, 1000);
    window.addEventListener("resize", checkDevTools);
    window.addEventListener("focus", checkDevTools);
    document.addEventListener("visibilitychange", checkDevTools);

    // Initial check
    checkDevTools();

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("resize", checkDevTools);
      window.removeEventListener("focus", checkDevTools);
      document.removeEventListener("visibilitychange", checkDevTools);
    };
  }, [step, socket, user, quizId, handleSubmit]);

  // Touch gestures blocker & meta viewport modifier (blocks double-touch zoom & inspect zoom)
  useEffect(() => {
    // 1. Inject meta viewport settings to disable touch zooming
    let metaTag = document.querySelector('meta[name="viewport"]');
    const originalViewportContent = metaTag ? metaTag.getAttribute("content") : "width=device-width, initial-scale=1.0";

    if (metaTag) {
      metaTag.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
    } else {
      metaTag = document.createElement("meta");
      metaTag.name = "viewport";
      metaTag.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
      document.getElementsByTagName("head")[0].appendChild(metaTag);
    }

    // 2. Block double touch (double tap) gesture
    let lastTouchTime = 0;
    const handleTouchStart = (e) => {
      const now = Date.now();
      if (now - lastTouchTime < 300) {
        // Prevent zoom or double-tap context actions
        e.preventDefault();
        toast.error("Double-touch actions are prohibited during the assessment.", {
          id: "touch-toast",
          duration: 2000
        });
      }
      lastTouchTime = now;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: false });

    return () => {
      // Restore original viewport content
      if (metaTag) {
        metaTag.setAttribute("content", originalViewportContent);
      }
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  // AI Simulation warning trigger checks
  useEffect(() => {
    if (step !== 4) return;
    let timer = null;

    if (simulatedGazeDeflected) {
      deflectionPenalizedRef.current = false;
      const toastId = toast("AI: Gaze deflection simulated. Move gaze back within 4s to prevent penalty.", { icon: "👀", duration: 4000 });
      deflectionToastRef.current = toastId;

      timer = setTimeout(() => {
        setWarnings((prevWarnings) => {
          const newWarnings = prevWarnings - 1;

          if (socket && user) {
            socket.emit('student:warning', {
              quizId,
              studentId: user.id,
              type: 'FACE_MISSING'
            });
          }

          if (newWarnings <= 0) {
            toast.error("AI proctoring forced submission: Candidates looked away too long.", { duration: 4000 });
            setTimeout(() => {
              handleSubmit();
            }, 0);
          } else {
            toast.error(`Warning: Gaze deflection/look-away detected! You have ${newWarnings} lives left.`, { icon: "⚠️", duration: 4000 });
            setTimeout(() => {
              setStep(3);
              setSecurityCode(Array(6).fill(""));
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
              }
            }, 100);
          }

          return newWarnings;
        });
        deflectionPenalizedRef.current = true;
        setSimulatedGazeDeflected(false);
      }, 4000);
    } else {
      if (deflectionToastRef.current) {
        toast.dismiss(deflectionToastRef.current);
        deflectionToastRef.current = null;
        if (!deflectionPenalizedRef.current) {
          toast.success("AI: Gaze restored. Penalty averted.", { icon: "✅", duration: 2500 });
        }
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [simulatedGazeDeflected, step, socket, user, quizId, handleSubmit]);

  useEffect(() => {
    if (step !== 4) return;
    let timer = null;

    if (simulatedMultipleFaces) {
      multipleFacesPenalizedRef.current = false;
      const toastId = toast("AI: Multiple faces simulated. Clear background within 4s to prevent penalty.", { icon: "👥", duration: 4000 });
      multipleFacesToastRef.current = toastId;

      timer = setTimeout(() => {
        setWarnings((prevWarnings) => {
          const newWarnings = prevWarnings - 1;

          if (socket && user) {
            socket.emit('student:warning', {
              quizId,
              studentId: user.id,
              type: 'OTHER'
            });
          }

          if (newWarnings <= 0) {
            toast.error("AI proctoring forced submission: Multiple persons detected.", { duration: 4000 });
            setTimeout(() => {
              handleSubmit();
            }, 0);
          } else {
            toast.error(`Warning: Multiple persons detected in camera view! You have ${newWarnings} lives left.`, { icon: "⚠️", duration: 4000 });
            setTimeout(() => {
              setStep(3);
              setSecurityCode(Array(6).fill(""));
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log(err));
              }
            }, 100);
          }

          return newWarnings;
        });
        multipleFacesPenalizedRef.current = true;
        setSimulatedMultipleFaces(false);
      }, 4000);
    } else {
      if (multipleFacesToastRef.current) {
        toast.dismiss(multipleFacesToastRef.current);
        multipleFacesToastRef.current = null;
        if (!multipleFacesPenalizedRef.current) {
          toast.success("AI: Environment restored. Penalty averted.", { icon: "✅", duration: 2500 });
        }
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [simulatedMultipleFaces, step, socket, user, quizId, handleSubmit]);

  useEffect(() => {
    if (step === 3) {
      if (cameraStream && cameraFeedRef.current) {
        cameraFeedRef.current.srcObject = cameraStream;
      }
      if (screenStream && screenFeedRef.current) {
        screenFeedRef.current.srcObject = screenStream;
      }
    }
  }, [cameraStream, screenStream, step]);

  // Removed stream-stopping on previous steps so permissions persist

  const handleEnableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setCameraEnabled(true);
    } catch (err) {
      toast.error("Camera access was denied. Please allow access in your browser settings.");
    }
  };

  const handleEnableScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      if (stream.getVideoTracks()[0].getSettings().displaySurface === "monitor") {
        screenStreamRef.current = stream;
        setScreenStream(stream);
        setScreenEnabled(true);
      } else {
        stream.getTracks().forEach((track) => track.stop());
        toast.error("You must share your entire screen. Please select the 'Entire Screen' option.");
        setScreenEnabled(false);
      }
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        toast.error("Screen share access was denied. Please select a screen to share.");
      }
    }
  };

  const handleNextStep = () => {
    if (step === 2 && !honourCodeAgreed) {
      toast.error("You must agree to the Honour Code to proceed.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSecurityCodeChange = (e, index) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === "") {
      const newCode = [...securityCode];
      newCode[index] = value;
      setSecurityCode(newCode);
      setSecurityCodeError(null);
      if (value !== "" && index < 5) inputRefs.current[index + 1].focus();
    }
  };

  const handleSecurityCodeKeyDown = (e, index) => {
    if (e.key === "Backspace" && !securityCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch((err) => toast.error(`Error enabling full-screen: ${err.message}`));
    } else {
      document.exitFullscreen();
    }
  };

  const handleBeginAssessment = async () => {
    if (isOtpVerified) {
      if (isFullScreen) {
        setStep(4);
      } else {
        toast.error("Please re-enter full-screen mode to continue.");
      }
      return;
    }

    setIsVerifying(true);
    setSecurityCodeError(null);
    try {
      const code = securityCode.join("");
      const res = await api.post(`/api/quizzes/${quizId}/verify-otp`, { otp: code });
      setIsOtpVerified(true);
      setStep(4);
    } catch (err) {
      if (err.response?.data?.message) {
        setSecurityCodeError(err.response.data.message);
      } else {
        setSecurityCodeError("Invalid OTP. Please check with your teacher.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAnswerChange = useCallback((valueOrIndex) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = {
        ...newAnswers[currentQuestionIndex],
        answer: valueOrIndex,
        status: "answered",
      };
      return newAnswers;
    });
  }, [currentQuestionIndex]);

  const handleQuestionNavigation = (index) => {
    if (index >= 0 && index < quiz.questions.length)
      setCurrentQuestionIndex(index);
  };

  const handleMarkForReview = () => {
    const newAnswers = [...answers];
    const currentStatus = newAnswers[currentQuestionIndex].status;
    newAnswers[currentQuestionIndex].status =
      currentStatus === "review" || currentStatus === "answered-review"
        ? newAnswers[currentQuestionIndex].answer !== null
          ? "answered"
          : "unanswered"
        : newAnswers[currentQuestionIndex].answer !== null
          ? "answered-review"
          : "review";
    setAnswers(newAnswers);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Hourglass className="h-12 w-12 text-black animate-spin" />
      </div>
    );
  if (error === 'exam_ended')
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center max-w-md px-8 py-12 bg-white rounded-2xl border border-red-100 shadow-lg space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Test Time Has Ended</h1>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              The allocated time for this exam has passed. You can no longer access or submit answers for this test.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700 font-medium">
            Please contact your faculty if you believe this is an error.
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 px-6 py-2.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center p-8 bg-[#111827] rounded-xl border border-slate-800">
          <AlertCircle className="h-12 w-12 text-black mx-auto" />
          <p className="mt-4 text-gray-900">{error}</p>
        </div>
      </div>
    );
  if (!quiz) return null;

  // Status gate: quiz not yet activated by teacher
  if (quiz.status === 'PENDING') {
    return (
      <div className="flex items-center justify-center h-screen bg-amber-50">
        <div className="text-center max-w-md px-8 py-12 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <Hourglass className="h-7 w-7 text-gray-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              This exam hasn't started yet. Your faculty will activate it at the scheduled time.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800 font-medium">
            Please stay on standby and refresh when your faculty announces the exam has begun.
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-700 transition underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Status gate: quiz has ended (COMPLETED status)
  if (quiz.status === 'COMPLETED') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center max-w-md px-8 py-12 bg-white rounded-2xl border border-red-100 shadow-lg space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">Test Time Has Ended</h1>
            <p className="mt-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">{quiz.title}</p>
            <p className="mt-3 text-gray-500 text-sm leading-relaxed">
              The allocated time for this exam has passed. No new attempts can be made.
            </p>
            {quiz.endsAt && (
              <p className="mt-2 text-xs text-red-400 font-medium">
                Exam closed at: {new Date(quiz.endsAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700 font-medium">
            Please contact your faculty for any re-attempt or further guidance.
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 px-6 py-2.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (step < 4) {
      const steps = [{ id: 1 }, { id: 2 }, { id: 3 }];
      return (
        <div className="flex h-screen bg-amber-50 text-gray-900 relative">
          <div className="w-[350px] flex-shrink-0 bg-amber-50 border-r border-amber-200 flex flex-col justify-between p-8 shadow-sm z-10">
            <div>
              <div className="flex items-center space-x-3 mb-10">
                <ShieldCheck className="h-8 w-8 text-gray-900" />
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Proctor-X</h1>
              </div>
              <div className="p-6 bg-white border border-gray-200 rounded-2xl space-y-5 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 leading-snug">{quiz.title}</h2>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex items-center font-medium">
                    <Mic className="w-4 h-4 mr-2 text-gray-400" /> Proctoring
                  </span>
                  <span className="font-semibold bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1 rounded-lg">
                    {quiz.proctoringProvider}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex items-center font-medium">
                    <Hourglass className="w-4 h-4 mr-2 text-gray-400" /> Duration
                  </span>
                  <span className="font-semibold text-gray-900">{quiz.duration}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span className="flex items-center font-medium">
                    <HelpCircle className="w-4 h-4 mr-2 text-gray-400" /> Questions
                  </span>
                  <span className="font-semibold text-gray-900">
                    {quiz.questions?.length || 0}
                  </span>
                </div>
              </div>
              <div className="my-10">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
                  Setup Progress
                </h3>
                <div className="space-y-4">
                  <SidebarChecklistItem
                    label="Honour Code Agreed"
                    isChecked={honourCodeAgreed}
                  />
                  <SidebarChecklistItem
                    label="Permissions Enabled"
                    isChecked={cameraEnabled && screenEnabled}
                  />
                  <SidebarChecklistItem
                    label="Full Screen Active"
                    isChecked={isFullScreen}
                  />
                  <SidebarChecklistItem
                    label="Security Code Entered"
                    isChecked={securityCode.join("").length === 6 || isOtpVerified}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="mb-8 w-24 h-24 text-amber-200/60" />
              <div className="w-full bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-4">
                  <User className="w-10 h-10 p-2 bg-gray-50 text-gray-600 rounded-full border border-gray-200" />
                  <div className="text-left flex-1 overflow-hidden">
                    <p className="font-bold text-gray-900 text-sm truncate">{quiz.studentName}</p>
                    <p className="text-xs text-gray-500 truncate">{quiz.studentEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-[350px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
            {steps.map((s, index) => (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${s.id < step
                    ? "bg-gray-900 text-white shadow-md"
                    : step === s.id
                      ? "bg-gray-900 text-white scale-110 shadow-lg ring-4 ring-gray-100"
                      : "bg-white border-2 border-gray-200 text-gray-400"
                    }`}
                >
                  {s.id < step ? <CheckCircle2 size={20} className="text-white" /> : s.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-12 my-2 transition-all duration-300 ${s.id < step ? "bg-gray-900" : "bg-gray-200"}`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col px-10 lg:px-16 py-10 lg:py-14 overflow-y-auto bg-white">
            <div className="w-full flex-1">
              {step === 1 && (
                <div className="space-y-10 text-gray-600">
                  <h2 className="text-3xl font-bold text-gray-900">Instructions</h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>This assessment can be attempted only ONCE.</li>
                    <li>Ensure you are connected to a strong network.</li>
                    <li>
                      Your timer will not stop for internet discrepancies.
                    </li>
                    <li>
                      The security code will be provided by the invigilator.
                    </li>
                    <li>
                      Reach out to the invigilator for technical issues.
                    </li>
                    <li>Good luck!</li>
                  </ul>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-6 flex justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-3">
                        Proctoring Guidelines
                      </h3>
                      <ul className="list-disc list-inside text-sm space-y-2 text-red-700">
                        <li>
                          This assessment requires Camera, Mic, and entire screen
                          sharing.
                        </li>
                        <li>
                          Ensure all feeds are visible in the top-left corner
                          during the test.
                        </li>
                      </ul>
                    </div>
                    <div className="w-48 h-32 hidden sm:flex items-center justify-center opacity-50">
                      <ShieldCheck className="w-20 h-20 text-black" />
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-8 text-gray-600">
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Honour Code & Academic Integrity</h2>
                  <div className="text-gray-600 space-y-8">
                    <p className="text-base leading-relaxed text-gray-700">
                      By proceeding with this assessment, you are bound by our strict academic integrity and proctoring policies. Please read carefully before agreeing.
                    </p>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-5 text-lg">I solemnly affirm and understand that:</h3>
                      <ul className="space-y-6">
                        <li className="flex items-start">
                          <span className="h-2 w-2 mt-2 mr-4 bg-blue-500 rounded-full flex-shrink-0"></span>
                          <span className="text-base leading-relaxed"><strong className="text-gray-900 font-semibold">Original Work:</strong> I will be truthful and rely exclusively on my own knowledge and skills to complete this assessment.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="h-2 w-2 mt-2 mr-4 bg-blue-500 rounded-full flex-shrink-0"></span>
                          <span className="text-base leading-relaxed"><strong className="text-gray-900 font-semibold">No Malpractice:</strong> I will not engage in any form of malpractice, including but not limited to copying, collaborating, using unauthorized materials, or accessing external websites.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="h-2 w-2 mt-2 mr-4 bg-blue-500 rounded-full flex-shrink-0"></span>
                          <span className="text-base leading-relaxed"><strong className="text-gray-900 font-semibold">Environment Integrity:</strong> I am testing in a private, well-lit environment and no other individuals will be present in the room for the duration of the exam.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="h-2 w-2 mt-2 mr-4 bg-blue-500 rounded-full flex-shrink-0"></span>
                          <span className="text-base leading-relaxed"><strong className="text-gray-900 font-semibold">Continuous Monitoring:</strong> I consent to continuous audio, video, and screen-sharing monitoring via AI and live proctors. I understand that my gaze and background will be actively tracked.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="h-2 w-2 mt-2 mr-4 bg-blue-500 rounded-full flex-shrink-0"></span>
                          <span className="text-base leading-relaxed"><strong className="text-gray-900 font-semibold">System Usage:</strong> I will remain in full-screen mode at all times. Switching tabs, opening secondary apps, or using multiple monitors is strictly prohibited and will trigger automatic warnings.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="h-2 w-2 mt-2 mr-4 bg-blue-500 rounded-full flex-shrink-0"></span>
                          <span className="text-base leading-relaxed"><strong className="text-gray-900 font-semibold">Zero Tolerance:</strong> I acknowledge that any violation of these rules, automated or manual, will result in immediate disqualification, cancellation of my score, and potential disciplinary action.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <label className="flex items-start space-x-3 cursor-pointer bg-white border border-gray-200 p-4 rounded-xl hover:bg-gray-50 transition">
                    <input
                      type="checkbox"
                      checked={honourCodeAgreed}
                      onChange={(e) => setHonourCodeAgreed(e.target.checked)}
                      className="mt-1 h-5 w-5 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-gray-900 font-medium leading-tight">
                      I solemnly swear to abide by the Proctor-X Honour Code and accept all proctoring guidelines mentioned above.
                    </span>
                  </label>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-10">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Setup Your Test Environment
                  </h2>
                  <div className="space-y-8">
                    <SetupCheckItem
                      title="Browser Compatibility"
                      status="checked"
                      check="Your browser is compatible."
                    />
                    <SetupCheckItem
                      title="Permissions"
                      status={
                        cameraEnabled && screenEnabled ? "checked" : "unchecked"
                      }
                    >
                      <div className="flex space-x-4">
                        <div className="w-48 h-32 bg-black rounded-lg flex items-center justify-center">
                          {cameraEnabled ? (
                            <video
                              ref={cameraFeedRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Camera className="text-gray-500" />
                          )}
                        </div>
                        <div className="w-48 h-32 bg-black rounded-lg flex items-center justify-center">
                          {screenEnabled ? (
                            <video
                              ref={screenFeedRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <ScreenShare className="text-gray-500" />
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-4">
                        {!cameraEnabled ? (
                          <button
                            onClick={handleEnableCamera}
                            className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition"
                          >
                            Enable Camera
                          </button>
                        ) : (
                          <button
                            onClick={stopCamera}
                            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                          >
                            Stop Camera
                          </button>
                        )}
                        {!screenEnabled ? (
                          <button
                            onClick={handleEnableScreenShare}
                            className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition"
                          >
                            Enable Screen Share
                          </button>
                        ) : (
                          <button
                            onClick={stopScreenShare}
                            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                          >
                            Stop Screen Share
                          </button>
                        )}
                      </div>
                    </SetupCheckItem>
                    <SetupCheckItem
                      title="Full Screen Mode"
                      status={isFullScreen ? "checked" : "unchecked"}
                    >
                      <button
                        onClick={handleFullScreen}
                        className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-lg flex items-center space-x-2 hover:bg-black transition"
                      >
                        <Expand size={18} />
                        <span>
                          {isFullScreen ? "Exit Full Screen" : "Go Full Screen"}
                        </span>
                      </button>
                    </SetupCheckItem>
                    <SetupCheckItem
                      title="Security Code"
                      status={
                        securityCode.join("").length === 6 || isOtpVerified
                          ? "checked"
                          : "unchecked"
                      }
                      check="Enter the 6-digit code from your invigilator."
                    >
                      <div className="flex space-x-3">
                        {securityCode.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => (inputRefs.current[i] = el)}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleSecurityCodeChange(e, i)}
                            onKeyDown={(e) => handleSecurityCodeKeyDown(e, i)}
                            disabled={
                              !cameraEnabled || !screenEnabled || !isFullScreen || isOtpVerified
                            }
                            className="w-12 h-14 border border-gray-300 bg-white rounded-lg text-center text-2xl font-semibold text-gray-900 disabled:bg-gray-100 disabled:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition"
                          />
                        ))}
                      </div>
                      {securityCodeError && (
                        <p className="text-sm text-red-600 mt-2 font-medium">
                          {securityCodeError}
                        </p>
                      )}
                    </SetupCheckItem>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevStep}
                disabled={step === 1}
                className="px-6 py-2.5 flex items-center space-x-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 transition"
              >
                <ArrowLeft size={18} />
                <span>Previous</span>
              </button>
              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  disabled={step === 2 && !honourCodeAgreed}
                  className="px-8 py-2.5 flex items-center space-x-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 transition"
                >
                  <span>Next</span>
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleBeginAssessment}
                  disabled={
                    isVerifying ||
                    !honourCodeAgreed ||
                    !cameraEnabled ||
                    !screenEnabled ||
                    !isFullScreen ||
                    (securityCode.join("").length !== 6 && !isOtpVerified)
                  }
                  className="px-8 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 flex items-center space-x-2 transition"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    "Begin Assessment"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      const currentQuestion = quiz.questions[currentQuestionIndex];
      const getStatusColor = (status) => {
        switch (status) {
          case "answered":
            return "bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600";
          case "unanswered":
            return "bg-slate-200 text-slate-700 hover:bg-slate-300";
          case "review":
            return "bg-amber-500 text-white border border-amber-600 hover:bg-amber-600";
          case "answered-review":
            return "bg-emerald-500 text-white border-2 border-amber-400 hover:bg-emerald-600";
          default:
            return "bg-slate-200 text-slate-700";
        }
      };
      return (
        <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

          {/* Global Top Bar matching reference design */}
          <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between pl-6 z-20 flex-shrink-0">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-red-600 flex items-center justify-center font-bold text-white text-xl rounded">
                K
              </div>
              <span className="font-extrabold text-sm text-black tracking-wide">ProctorX Assessment Room</span>
              <span className="text-gray-300 text-sm">|</span>
              <span className="text-gray-600 font-semibold text-xs">{quiz.title}</span>
            </div>

            <div className="flex items-center h-full">
              <button className="text-gray-500 hover:text-black p-2 rounded transition-colors mr-3">
                <Volume2 size={18} />
              </button>
              <div className="text-gray-300 mr-4">|</div>
              <div className="flex items-center space-x-2 text-black font-extrabold text-sm mr-6">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              <button
                onClick={handleSubmit}
                className="h-full px-8 bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition-colors uppercase tracking-wider flex items-center justify-center border-l border-neutral-800"
              >
                Exit Workout
              </button>
            </div>
          </header>

          <div className="flex flex-1 min-h-0">
            <aside className="w-[320px] bg-slate-50 border-r border-gray-200 flex flex-col p-4 space-y-4 shadow-sm z-10 flex-shrink-0 sticky top-14 h-[calc(100vh-56px)]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

              <div className="flex space-x-2">
                <ProctoringFeed
                  stream={cameraStream}
                  type="camera"
                  simulatedGazeDeflected={simulatedGazeDeflected}
                  simulatedMultipleFaces={simulatedMultipleFaces}
                />
                <ProctoringFeed stream={screenStream} type="screen" />
              </div>

              {/* AI Violation Simulator Panel */}
              <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-500" /> AI Proctoring Simulator
                </h3>
                <p className="text-[9px] text-gray-500 leading-relaxed">
                  Test proctoring response loops by triggering simulated candidate violations:
                </p>

                <div className="flex flex-col gap-1.5 pt-1">
                  <button
                    onClick={() => setSimulatedGazeDeflected(!simulatedGazeDeflected)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition flex items-center justify-between border ${simulatedGazeDeflected
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-slate-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    <span>Simulate Gaze Deflection</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${simulatedGazeDeflected ? 'bg-amber-500 animate-ping' : 'bg-gray-300'}`}></span>
                  </button>

                  <button
                    onClick={() => setSimulatedMultipleFaces(!simulatedMultipleFaces)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition flex items-center justify-between border ${simulatedMultipleFaces
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-slate-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                  >
                    <span>Simulate Multi-Face</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${simulatedMultipleFaces ? 'bg-red-500 animate-ping' : 'bg-gray-300'}`}></span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto border-t border-gray-200 pt-4 custom-scrollbar">
                <h2 className="font-semibold mb-3 text-gray-900">Question Palette</h2>
                <div className="grid grid-cols-5 gap-2">
                  {quiz.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionNavigation(index)}
                      className={`h-10 w-10 rounded-md font-bold flex items-center justify-center transition-all ${getStatusColor(
                        answers[index]?.status
                      )} ${currentQuestionIndex === index ? "border-2 border-red-500" : ""
                        }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
            <main className="flex-1 flex flex-col p-6 bg-white min-w-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <header className="flex justify-between items-center pb-2 mb-4 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Proctoring Active
                  </span>
                </div>
                {/* Warning lives counter — always visible so student knows their status */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${warnings >= 4 ? 'bg-green-50 border-green-200 text-green-700' :
                    warnings >= 2 ? 'bg-amber-50 border-amber-300 text-amber-700' :
                      'bg-red-50 border-red-300 text-red-700 animate-pulse'
                  }`}>
                  <span>{Array.from({ length: Math.max(warnings, 0) }, () => '❤️').join('')}{Array.from({ length: Math.max(5 - warnings, 0) }, () => '🖤').join('')}</span>
                  <span>{warnings} / 5 lives left</span>
                </div>
              </header>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-600">
                    Question {currentQuestionIndex + 1} of{" "}
                    {quiz.questions.length}
                  </h3>
                  <span className="text-sm font-bold bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-lg">
                    {currentQuestion.marks || 1} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>
                <p className="text-lg mb-4 text-gray-900 font-medium">{currentQuestion.questionText}</p>
                <div className="space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden">
                  {(() => {
                    const qType = (currentQuestion.questionType || "").toLowerCase();
                    if (qType === "mcq") {
                      return (
                        <div className="overflow-y-auto space-y-3 pb-2 custom-scrollbar pr-2">
                          {currentQuestion.options.map((option, index) => (
                            <label
                              key={index}
                              className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${answers[currentQuestionIndex]?.answer === index
                                  ? "bg-emerald-50/40 border-emerald-500"
                                  : "bg-white border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                              <input
                                type="radio"
                                name={`q-${currentQuestionIndex}`}
                                checked={answers[currentQuestionIndex]?.answer === index}
                                onChange={() => handleAnswerChange(index)}
                                className="h-5 w-5 mr-4 accent-emerald-600"
                              />
                              <span className="text-gray-800 font-medium">{option}</span>
                            </label>
                          ))}
                        </div>
                      );
                    }
                    if (qType === "descriptive") {
                      return (
                        <div className="mt-4 flex-1">
                          <textarea
                            className="w-full h-64 p-5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed"
                            placeholder="Type your detailed answer here..."
                            value={answers[currentQuestionIndex]?.answer || ""}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                          ></textarea>
                        </div>
                      );
                    }
                    if (qType === "coding") {
                      return (
                        <div className="flex-1 min-h-0 overflow-hidden">
                          <CodingQuestion
                            key={currentQuestion.id}
                            question={currentQuestion}
                            answer={answers[currentQuestionIndex]?.answer}
                            onChange={handleAnswerChange}
                          />
                        </div>
                      );
                    }
                    console.log("QuizAttempt - Unrecognized or unrendered question type:", currentQuestion.questionType, currentQuestion);
                    return (
                      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs space-y-1">
                        <p className="font-bold">Debug Information (Question Type Mismatch):</p>
                        <p>Type in DB: <code className="bg-red-100 px-1 py-0.5 rounded font-mono font-bold">"{currentQuestion.questionType}"</code></p>
                        <pre className="bg-white p-2.5 rounded border border-red-150 font-mono text-[10px] text-gray-800 overflow-x-auto">
                          {JSON.stringify(currentQuestion, null, 2)}
                        </pre>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <footer className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex space-x-3">
                  <button
                    onClick={handleMarkForReview}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Bookmark size={16} />
                    <span>Mark for Review</span>
                  </button>
                  <button
                    onClick={() => {
                      const newAnswers = [...answers];
                      newAnswers[currentQuestionIndex] = {
                        answer: null,
                        status: "unanswered",
                      };
                      setAnswers(newAnswers);
                    }}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50/50 transition-colors shadow-sm"
                  >
                    <span>Clear Selection</span>
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() =>
                      handleQuestionNavigation(currentQuestionIndex - 1)
                    }
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2.5 flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                  >
                    <ArrowLeft size={16} />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() =>
                      handleQuestionNavigation(currentQuestionIndex + 1)
                    }
                    disabled={
                      currentQuestionIndex === quiz.questions.length - 1
                    }
                    className="px-8 py-2.5 flex items-center space-x-2 bg-black text-white font-bold rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </footer>
            </main>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {devToolsDetected && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center text-gray-900 z-[9999] p-8 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-6 animate-pulse">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold mb-4">Developer Tools or Side Panel Detected</h1>
          <p className="text-gray-500 text-sm max-w-md mb-6 leading-relaxed">
            Opening developer inspection tools, consoles, or browser side panels (such as Gemini or search feeds) is prohibited.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-xs text-red-700 font-medium max-w-md animate-bounce">
            Please close DevTools (press F12) or close the Chrome Side Panel (Gemini) to continue with the assessment.
          </div>
        </div>
      )}
      {renderContent()}
    </>
  );
};

export default QuizFlow;