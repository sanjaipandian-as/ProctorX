import { useState, useEffect, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import {
  ChevronDown,
  ChevronUp,
  XCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import API from "../../Api";
export default function CompilerPage() {
  const [language, setLanguage] = useState("python");
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [warnings, setWarnings] = useState(5);
  const warningsRef = useRef(warnings);
  const toastIdRef = useRef(null);

  const reduceLife = useCallback((message) => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    setWarnings((prevWarnings) => {
      const newWarnings = prevWarnings - 1;

      if (newWarnings <= 0) {
        toast.error(
          "You have exceeded the maximum number of warnings. Access revoked.",
          { duration: 4000 }
        );
        warningsRef.current = 0;
        // In a real scenario, we might redirect or block the UI here
      } else {
        toastIdRef.current = toast.error(
          `${message} You have ${newWarnings} lives left.`,
          { icon: "⚠️", duration: 4000 }
        );
      }

      return newWarnings;
    });
  }, []);

  useEffect(() => {
    const handlePaste = (e) => {
      e.preventDefault();
      reduceLife("Pasting is not allowed.");
    };

    const handleCopy = (e) => {
      e.preventDefault();
      toast.error("Copying is not allowed during the assessment.");
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("copy", handleCopy);

    return () => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("copy", handleCopy);
    };
  }, [reduceLife]);

  // Problem data from backend
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const languageMap = {
    python: "python",
    cpp: "cpp",
    java: "java",
    javascript: "javascript"
  };

  const [code, setCode] = useState(`def count_subarrays(nums, left, right):
    count = 0
    n = len(nums)
    
    # Check all possible subarrays
    for i in range(n):
        max_val = nums[i]
        for j in range(i, n):
            max_val = max(max_val, nums[j])
            
            # If max is in range [left, right], count this subarray
            if left <= max_val <= right:
                count += 1
    
    return count

n = int(input())
left, right = map(int, input().split())
nums = list(map(int, input().split()))
print(count_subarrays(nums, left, right))`);

  const [selectedTest, setSelectedTest] = useState(1);
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showResultsBanner, setShowResultsBanner] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("runTests"); // "run", "runTests", "hints"

  const tests = [
    { id: 1, input: "4\n2 3\n2 1 4 3", expected: "3" },
    { id: 2, input: "5\n1 2\n1 2 3 4 5", expected: "3" },
    { id: 3, input: "3\n2 4\n2 5 3", expected: "2" },
    { id: 4, input: "4\n3 6\n3 6 1 2", expected: "7" },
    { id: 5, input: "5\n2 5\n1 2 5 3 4", expected: "14" },
    { id: 6, input: "6\n1 3\n1 3 2 3 1 2", expected: "21" },
    { id: 7, input: "7\n2 4\n2 4 3 2 4 3 2", expected: "28" },
    { id: 8, input: "8\n1 5\n1 2 3 4 5 4 3 2", expected: "36" }
  ];

  // Calculate passed tests count
  const passedTestsCount = testResults.filter(r => r.passed).length;
  const totalTestsCount = tests.length;

  // Fetch problem from backend
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        // Fetch all public quizzes
        const response = await API.get('/api/quizzes/public');

        // Find first quiz with coding questions
        const quizWithCoding = response.data.find(quiz =>
          quiz.questions && quiz.questions.some(q => q.questionType === 'coding')
        );

        if (quizWithCoding) {
          // Get the first coding question
          const codingQuestion = quizWithCoding.questions.find(q => q.questionType === 'coding');
          setProblem(codingQuestion);


          if (codingQuestion.starterCode && codingQuestion.starterCode[language]) {
            setCode(codingQuestion.starterCode[language]);
          }
        } else {
          setError('No coding problems found in the backend');
        }
      } catch (err) {
        console.error('Error fetching problem:', err);
        setError('Failed to load problem from backend');
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, []);

  // Update code when language changes
  useEffect(() => {
    if (problem && problem.starterCode && problem.starterCode[language]) {
      setCode(problem.starterCode[language]);
    }
  }, [language, problem]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput("⏳ Running your code...");

    try {
      const selectedTestData = tests[selectedTest - 1];

      const res = await axios.post("https://proctorx-1-9qkn.onrender.com/run", {
        language,
        code,
        tests: [{ input: selectedTestData.input }]
      }, {
        timeout: 15000
      });

      console.log("Compiler response:", res.data);

      // Check for compilation errors
      if (res.data.compile && res.data.compile.code !== 0) {
        setOutput(`❌ Compilation Error:\n\n${res.data.compile.stderr || res.data.compile.stdout}`);
        setIsRunning(false);
        return;
      }

      // Get the output from the first test
      if (res.data.tests && res.data.tests.length > 0) {
        const testResult = res.data.tests[0];

        if (testResult.killed) {
          setOutput("⏱️ Time Limit Exceeded\n\nYour code took too long to execute (>5 seconds).");
        } else if (testResult.code !== 0) {
          setOutput(`❌ Runtime Error:\n\n${testResult.stderr || testResult.stdout || "Unknown error occurred"}`);
        } else {
          const outputText = testResult.stdout.trim();
          setOutput(outputText || "(empty output)");
        }
      } else {
        setOutput("⚠️ No output received from the server.\n\nPlease check if the compiler service is running.");
      }
    } catch (err) {
      console.error("Error running code:", err);

      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setOutput("⏱️ Request Timeout\n\nThe server took too long to respond. Please try again.");
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setOutput("🔌 Network Error\n\nCannot connect to the compiler service.\n\nPlease ensure:\n1. Compiler-End server is running on port 4000\n2. Run: cd c:\\ProctorX\\Compilor-End && npm start");
      } else if (err.response) {
        const errorMsg = err.response.data?.error || err.response.statusText || "Unknown server error";
        setOutput(`❌ Server Error (${err.response.status}):\n\n${errorMsg}`);
      } else {
        setOutput(`❌ Error:\n\n${err.message || "Failed to run code. Please try again."}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    setShowResultsBanner(false);
    setOutput("⏳ Running all tests...");

    try {
      // Prepare all tests for the backend
      const testsPayload = tests.map(t => ({ input: t.input }));

      const res = await axios.post("https://proctorx-1-9qkn.onrender.com/run", {
        language,
        code,
        tests: testsPayload
      }, {
        timeout: 30000 // 30 second timeout for all tests
      });

      console.log("All tests response:", res.data);

      // Check for compilation errors
      if (res.data.compile && res.data.compile.code !== 0) {
        setOutput(`❌ Compilation Error:\n\n${res.data.compile.stderr || res.data.compile.stdout}`);
        setIsRunningTests(false);
        return;
      }

      // Process results
      const results = [];
      if (res.data.tests && res.data.tests.length > 0) {
        console.log("Processing test results:", res.data.tests);
        res.data.tests.forEach((testResult, index) => {
          const expectedOutput = tests[index].expected.trim();
          const actualOutput = testResult.stdout.trim();

          console.log(`Test ${index + 1}:`, {
            input: tests[index].input,
            expected: expectedOutput,
            actual: actualOutput,
            rawStdout: testResult.stdout
          });

          const passed = !testResult.killed &&
            testResult.code === 0 &&
            actualOutput === expectedOutput;

          results.push({
            id: tests[index].id,
            passed,
            output: actualOutput,
            error: testResult.stderr,
            killed: testResult.killed
          });
        });
      }

      setTestResults(results);
      setShowResultsBanner(true);

      // Update output for the selected test
      if (results[selectedTest - 1]) {
        const result = results[selectedTest - 1];
        if (result.killed) {
          setOutput("⏱️ Time Limit Exceeded\n\nYour code took too long to execute (>5 seconds).");
        } else if (result.error) {
          setOutput(`❌ Runtime Error:\n\n${result.error}`);
        } else {
          setOutput(result.output || "(empty output)");
        }
      }
    } catch (err) {
      console.error("Error running tests:", err);

      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setOutput("⏱️ Request Timeout\n\nThe server took too long to respond. Please try again.");
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setOutput("🔌 Network Error\n\nCannot connect to the compiler service.\n\nPlease ensure:\n1. Compiler-End server is running on port 4000\n2. Run: cd c:\\ProctorX\\Compilor-End && npm start");
      } else if (err.response) {
        const errorMsg = err.response.data?.error || err.response.statusText || "Unknown server error";
        setOutput(`❌ Server Error (${err.response.status}):\n\n${errorMsg}`);
      } else {
        setOutput(`❌ Error:\n\n${err.message || "Failed to run tests. Please try again."}`);
      }
    } finally {
      setIsRunningTests(false);
    }
  };

  const VariableBox = ({ children }) => (
    <span className="border border-gray-300 px-2 py-0.5 mx-1 text-sm font-mono text-gray-800 bg-gray-50 inline-block rounded">
      {children}
    </span>
  );

  return (
    <div className="h-screen w-full flex flex-col font-sans text-gray-800 overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Floating Lives Indicator */}
      <div className="fixed top-4 right-4 z-[9999] bg-white border-2 border-red-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg animate-bounce hover:animate-none group cursor-help">
        <span className="text-red-600 font-bold text-lg">❤️</span>
        <span className="font-black text-gray-900">{warnings} LIVES</span>
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Anti-Cheat Active: Pasting or leaving the screen will reduce your lives.
        </div>
      </div>

      {/* Header */}


      {/* Main Content */}
      <div className="flex-1 grid grid-cols-[35%_65%] overflow-hidden">

        {/* Left Panel - Challenge Description */}
        <div className="flex flex-col h-full border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-8 space-y-6">

            {/* Challenge Title */}
            <div className="pb-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-500 mb-2">
                {loading ? 'Loading...' : error ? 'Error' : 'Coding Challenge'}
              </h2>
            </div>

            {/* Problem Statement */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading problem...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
                <p className="text-sm text-red-600 mt-2">Using fallback problem data.</p>
              </div>
            ) : problem ? (
              <div className="space-y-4 text-[15px] leading-relaxed text-gray-700">
                <div dangerouslySetInnerHTML={{ __html: problem.questionText }} />
                <p className="text-sm text-gray-600">
                  Marks: <span className="font-semibold">{problem.marks}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-[15px] leading-relaxed text-gray-700">
                <p>
                  You are given an integer array <VariableBox>nums</VariableBox> and two integers <VariableBox>left</VariableBox> and{" "}
                  <VariableBox>right</VariableBox>. Your task is to return the number of contiguous non-empty subarrays such that the value of the maximum array element in that subarray is in the range{" "}
                  <VariableBox>[left, right]</VariableBox>.
                </p>
                <p className="text-sm text-gray-600">
                  The test cases are generated so that the answer will fit in a <span className="font-semibold">32-bit</span> integer.
                </p>
              </div>
            )}

            {/* Input Format */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base text-gray-800">Input Format:</h3>
              <ol className="list-decimal ml-6 space-y-2 text-[15px] text-gray-700">
                <li>
                  The first line contains an integer <VariableBox>n</VariableBox>, the size of the array <VariableBox>nums</VariableBox>.
                </li>
                <li>
                  The second line contains two integers <VariableBox>left</VariableBox> and <VariableBox>right</VariableBox>, representing the range for the maximum element.
                </li>
                <li>
                  The third line contains <VariableBox>n</VariableBox> integers, which are the elements of the array <VariableBox>nums</VariableBox>.
                </li>
              </ol>
            </div>

            {/* Output Format */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base text-gray-800">Output Format:</h3>
              <p className="text-[15px] text-gray-700">
                Return the number of contiguous subarrays where the maximum element lies between{" "}
                <VariableBox>left</VariableBox> and <VariableBox>right</VariableBox>.
              </p>
            </div>

            {/* Example */}
            <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-base text-gray-800">Example 1</h3>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Input:</p>
                <pre className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm text-gray-800">
                  4
                  2 3
                  2 1 4 3
                </pre>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Output:</p>
                <pre className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm text-gray-800">3</pre>
              </div>
            </div>

          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className={`grid h-full bg-white overflow-hidden transition-all duration-300 ${isExpanded ? "grid-rows-[48px_1fr_40%]" : "grid-rows-[48px_1fr_40px]"}`}>

          {/* Editor Toolbar */}
          <div className="h-12 flex items-center justify-between border-b border-gray-200 bg-white px-0">
            <div className="flex h-full items-center">
              {/* Run Button */}
              {/* <button
                onClick={runCode}
                disabled={isRunning || isRunningTests}
                className={`px-8 h-full text-[13px] font-bold transition-all flex items-center gap-2 border-r border-gray-300 ${isRunning || isRunningTests
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#7d7d7d] text-white hover:bg-[#6d6d6d]"
                  }`}
              >
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Running...
                  </span>
                ) : "Run"}
              </button> */}

              {/* <div className="h-full px-4 flex items-center border-r border-gray-300 hover:bg-gray-100 cursor-pointer">
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div> */}

              {/* Language Selector */}
              <div className="px-4">
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="appearance-none bg-transparent border-none px-2 py-1.5 pr-6 rounded text-sm font-bold text-gray-700 hover:text-black cursor-pointer focus:outline-none"
                  >
                    <option value="python">PYTHON</option>
                    <option value="cpp">C++</option>
                    <option value="java">JAVA</option>
                    <option value="javascript">JAVASCRIPT</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-4">
              <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="h-full relative overflow-hidden">
            <Editor
              height="100%"
              language={languageMap[language]}
              value={code}
              onChange={(value) => setCode(value)}
              theme="light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
              }}
              onMount={(editor, monaco) => {
                editor.onKeyDown((e) => {
                  if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV) {
                    e.preventDefault();
                    e.stopPropagation();
                    reduceLife("Pasting is not allowed in the editor.");
                  }
                });

                // Block the paste action specifically for context menu or other triggers
                const clipboard = editor.getContribution('editor.contrib.clipboard');
                if (clipboard) {
                  const originalPaste = clipboard._onPaste;
                  clipboard._onPaste = function (e) {
                    reduceLife("Pasting is not allowed in the editor.");
                    return; // Block
                  };
                }
              }}
            />
          </div>

          {/* Bottom Panel - Test Results */}
          <div className="h-full flex flex-col border-t border-gray-400 bg-[#eeeeee] overflow-hidden">

            {/* Tabbed Toolbar */}
            <div className="h-10 bg-[#f0f0f0] border-b border-gray-400 flex items-center px-0 flex-shrink-0">
              <button
                onClick={() => {
                  setActiveTab("run");
                  runAllTests();
                }}
                className={`px-8 h-full text-[14px] font-bold transition-all border-r border-gray-300 ${activeTab === "run" ? "bg-white text-black" : "text-gray-900 hover:bg-gray-200"
                  }`}
              >
                Run
              </button>
              <button
                onClick={() => {
                  setActiveTab("runTests");
                  runAllTests();
                }}
                className={`px-8 h-full text-[14px] font-bold transition-all border-r border-gray-300 ${activeTab === "runTests" ? "bg-[#e2e2ec] text-black" : "text-gray-900 hover:bg-gray-200"
                  }`}
              >
                Run Tests
              </button>


              <div
                className="ml-auto px-4 h-full flex items-center cursor-pointer hover:bg-gray-200"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-800" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-800" />
                )}
              </div>
            </div>

            {/* Test Results Area - Only visible when expanded */}
            <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${!isExpanded ? "hidden" : ""}`}>

              {/* Test Results Summary Banner */}
              {showResultsBanner && testResults.length > 0 && (
                <div className={`border-b border-gray-400 px-5 py-2 flex items-center justify-center relative flex-shrink-0 ${passedTestsCount === totalTestsCount
                  ? 'bg-[#d4edda]' // Green background when all tests pass
                  : 'bg-[#fce4ec]' // Pink background when some tests fail
                  }`}>
                  <span className="text-[14px] font-bold text-gray-900">
                    You have passed {passedTestsCount}/{totalTestsCount} tests
                  </span>
                  <button
                    onClick={() => setShowResultsBanner(false)}
                    className="absolute right-5 text-[12px] text-gray-600 hover:text-black italic font-bold underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Test List Sidebar */}
                <div className="w-52 border-r border-gray-300 bg-[#f5f5f5] flex flex-col flex-shrink-0">
                  {/* Test Cases List - Scrollable */}
                  <div className="flex-1 overflow-y-auto px-0 pb-4 custom-scrollbar">
                    {tests.map((t) => {
                      const result = testResults.find(r => r.id === t.id);

                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTest(t.id)}
                          className={`w-full flex items-center justify-between px-4 py-8 text-left transition-all border-b border-gray-200 ${selectedTest === t.id
                            ? "bg-white text-gray-950 font-bold border-l-4 border-l-[#7158a1] shadow-sm"
                            : "text-gray-700 hover:bg-[#e9e9e9] font-medium"
                            }`}
                        >
                          <span className="text-[15px]">Test Case {t.id}</span>

                          {result && (
                            result.passed ? (
                              <div className="bg-green-600 rounded-full p-0.5">
                                <CheckCircle className="w-4 h-4 text-white fill-green-600" />
                              </div>
                            ) : (
                              <div className="bg-[#cc4444] rounded-full p-0.5">
                                <XCircle className="w-4 h-4 text-white fill-[#cc4444]" />
                              </div>
                            )
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Test Details */}
                <div className="flex-1 p-6 overflow-y-auto bg-gray-50 custom-scrollbar">
                  <div className="max-w-5xl space-y-6 pb-8">
                    {/* Input Section */}
                    <div>
                      <h3 className="font-bold text-[17px] text-gray-900 mb-2 uppercase tracking-tight">Input</h3>
                      <div className="border-2 border-[#666666] rounded-none bg-white p-4 shadow-sm max-h-40 overflow-y-auto">
                        <pre className="text-sm font-mono text-gray-900 whitespace-pre-wrap">
                          {tests[selectedTest - 1].input}
                        </pre>
                      </div>
                    </div>

                    {/* Expected Output Section */}
                    <div>
                      <h3 className="font-bold text-[17px] text-gray-900 mb-2 uppercase tracking-tight">Expected Output</h3>
                      <div className="border-2 border-[#666666] rounded-none bg-white p-4 shadow-sm max-h-40 overflow-y-auto">
                        <pre className="text-sm font-mono text-gray-900">
                          {tests[selectedTest - 1].expected}
                        </pre>
                      </div>
                    </div>

                    {/* Output Section */}
                    <div>
                      <h3 className="font-bold text-[17px] text-gray-900 mb-2 uppercase tracking-tight">Actual Output</h3>
                      {(() => {
                        // Get the result for the currently selected test
                        const currentResult = testResults.find(r => r.id === selectedTest);
                        const actualOutput = currentResult?.output || output;
                        const expectedOutput = tests[selectedTest - 1].expected.trim();
                        const isMatched = actualOutput === expectedOutput;
                        const hasOutput = actualOutput && actualOutput.length > 0;

                        return (
                          <div className={`border-2 p-5 min-h-[120px] shadow-md transition-colors ${hasOutput && isMatched
                            ? "border-green-600 bg-green-50"
                            : hasOutput
                              ? "border-[#cc4444] bg-[#fff8f8]"
                              : "border-[#666666] bg-white"
                            }`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-[11px] font-bold uppercase ${hasOutput ? "text-gray-500" : "text-gray-400"}`}>
                                Console Output
                              </span>
                              {hasOutput && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isMatched ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                  }`}>
                                  {isMatched ? "MATCHED" : "MISMATCHED"}
                                </span>
                              )}
                            </div>
                            <pre className={`text-sm font-mono whitespace-pre-wrap leading-relaxed ${hasOutput && isMatched
                              ? "text-green-800 font-bold"
                              : hasOutput
                                ? "text-red-800 font-bold"
                                : "text-gray-500"
                              }`}>
                              {actualOutput || "No output yet. Click 'Run' or 'Run Tests' to see results."}
                            </pre>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 7px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
      `}</style>
    </div>
  );
}
