import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import Firewall from "../assets/Firewall.svg";
import Protected from "../assets/Protected.svg";
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
  GraduationCap,
  ScanEye,
  Eraser,
  X,
  Omega,
  LogIn,
  ChevronDown,
  ChevronUp,
  XCircle,
  CheckCircle,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { GrStatusInfo } from "react-icons/gr";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../Api";
import LOGO from "../assets/LOGO.png";
import Proctor from "../assets/PROCTOR.png";
import ProctoredX from "../assets/PrctoredX.png";
import DescriptiveEditor from "../components/DescriptiveEditor";

// Compiler Service Configuration
const COMPILER_URL = "https://proctorx-1-9qkn.onrender.com";


const ProctoringFeed = ({ stream, type }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <div className="bg-stone-100 rounded-lg aspect-video w-full flex items-center justify-center text-gray-700 relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover rounded-lg ${!stream && "hidden"
          }`}
      />
      {!stream && (
        <div className="flex flex-col items-center">
          {type === "camera" ? (
            <Camera className="h-4 w-4 sm:h-6 sm:w-6 mb-1" />
          ) : (
            <ScreenShare className="h-4 w-4 sm:h-6 sm:w-6 mb-1" />
          )}
          <span className="text-xs font-semibold">
            {type === "camera" ? "Camera Off" : "Screen Off"}
          </span>
        </div>
      )}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-xs font-bold flex items-center">
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

const InstructionsModal = ({ isOpen, onClose, quiz }) => (
  <AnimatePresence>
    {isOpen && (
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-end"
      >
        <motion.div
          className="fixed inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />

        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{
            duration: 0.7,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="relative bg-white shadow-xl w-full sm:w-[70%] md:w-[60%] lg:w-[40%] h-full flex flex-col overflow-y-auto"
        >
          <div className="p-4 sm:p-6 space-y-8 sm:space-y-12 text-gray-700">
            <div className="relative border-b pb-4 text-center">
              <button
                onClick={onClose}
                className="absolute top-0 right-0 sm:top-2 sm:right-2 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
              <div className="grid grid-cols-1 divide-y divide-gray-300 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
                <div className="py-2 sm:py-0">
                  <p className="text-sm font-medium text-gray-500">
                    Total questions
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {quiz.questions?.length || 0}
                  </p>
                </div>
                <div className="py-2 sm:py-0">
                  <p className="text-sm font-medium text-gray-500">
                    Max. Duration
                  </p>
                  <p className="text-lg font-semibold text-gray-800">1h</p>
                </div>
                <div className="pt-2 sm:pt-0">
                  <p className="text-sm font-medium text-gray-500">
                    Proctoring
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {quiz.proctoringProvider}
                  </p>
                </div>
              </div>
            </div>
            <section>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
                Instructions
              </h3>
              <p className="text-base sm:text-lg mb-4 text-gray-600">
                Please keep a note of the below instructions.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-md">
                <li>
                  This assessment can be attempted only ONCE. Hence, please
                  ensure you are seated in a distraction-free environment.
                </li>
                <li>
                  Please ensure you are connected to a strong wifi/ethernet
                  network.
                </li>
                <li>
                  In case of internet discrepancies, your timer will still keep
                  running. However, you can continue attempting the current
                  question.
                </li>
                <li>
                  The security code will be provided by the invigilator at your
                  venue.
                </li>
                <li>
                  In case of any technical difficulties, please reach out to the
                  invigilator.
                </li>
                <li>Give your best. Good luck!</li>
              </ul>
            </section>
            <section>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">
                Marking Scheme
              </h3>
              <p className="text-sm sm:text-md mb-3 text-gray-600">
                Refer to the top right of each question for the marks awarded for
                a correct answer or deducted for an incorrect answer as shown
                below.
              </p>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-6">
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-700 text-sm sm:text-md font-semibold px-2 py-0.5 rounded-md mr-2">
                    +X
                  </span>
                  <span className="text-sm sm:text-md italic text-gray-800">
                    Correct
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="bg-red-100 text-red-700 text-sm sm:text-md font-semibold px-2 py-0.5 rounded-md mr-2">
                    -Y
                  </span>
                  <span className="text-sm sm:text-md italic text-gray-800">
                    Incorrect
                  </span>
                </div>
              </div>
            </section>
            <section>
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">
                Question Palette
              </h3>
              <p className="text-sm sm:text-md mb-3 text-gray-600">
                The question palette displayed on the left side of the assessment
                screen will show the following statuses depicted by distinct
                symbols.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-blue-600 text-white rounded-md flex-shrink-0">
                    1
                  </span>
                  <span className="text-sm sm:text-md">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-gray-200 text-gray-700 border border-gray-400 rounded-md flex-shrink-0">
                    2
                  </span>
                  <span className="text-sm sm:text-md">Unanswered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-yellow-500 text-white rounded-md flex-shrink-0">
                    5
                  </span>
                  <span className="text-sm sm:text-md">
                    Marked for review but answered
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-yellow-500 text-white rounded-md flex-shrink-0">
                    13
                  </span>
                  <span className="text-sm sm:text-md">
                    Marked for review but unanswered
                  </span>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const SetupCheckItem = ({ title, status, children, check }) => {
  const statusIcons = {
    checked: <CheckCircle2 className="text-green-600" />,
    unchecked: (
      <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>
    ),
  };
  return (
    <div className="flex items-start space-x-4">
      <div>{statusIcons[status]}</div>
      <div className="flex-1">
        <h3
          className={`font-semibold text-base sm:text-lg ${status === "checked" ? "text-gray-900" : "text-gray-700"
            }`}
        >
          {title}
        </h3>
        {check && (
          <p className="px-1 text-xs sm:text-sm text-gray-500 mt-1">{check}</p>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};

const SidebarChecklistItem = ({ label, isChecked }) => (
  <div className="flex items-center space-x-2">
    {isChecked ? (
      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
    ) : (
      <div className="w-4 h-4 border-2 border-gray-400 rounded-full flex-shrink-0"></div>
    )}
    <span className={`text-sm ${isChecked ? "text-gray-900" : "text-gray-600"}`}>
      {label}
    </span>
  </div>
);

const QuizFlow = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isMobileDevice, setIsMobileDevice] = useState(() =>
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [honourCodeAgreed, setHonourCodeAgreed] = useState(false);
  const [securityCode, setSecurityCode] = useState(Array(6).fill(""));
  const [securityCodeError, setSecurityCodeError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);
  const [isAwaitingPermission, setIsAwaitingPermission] = useState(false);

  const [warnings, setWarnings] = useState(5);
  const warningsRef = useRef(warnings);
  const [hasAcknowledgedBug, setHasAcknowledgedBug] = useState(false);
  const cameraFeedRef = useRef(null);
  const screenFeedRef = useRef(null);
  const inputRefs = useRef([]);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const toastIdRef = useRef(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const fullScreenSize = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [violationLogs, setViolationLogs] = useState([]);
  const violationLogsRef = useRef([]);
  const handleSubmitRef = useRef(null);
  const syncStateRef = useRef(null);
  const isResumingRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Compiler State ---
  const [codingAnswers, setCodingAnswers] = useState({}); // { [questionIndex]: { [lang]: code } }
  const [selectedLanguages, setSelectedLanguages] = useState({}); // { [questionIndex]: lang }
  const [testResults, setTestResults] = useState({}); // { [questionIndex]: [results] }
  const [compilerOutput, setCompilerOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("runTests"); // "run", "runTests"
  const [selectedTestCase, setSelectedTestCase] = useState(0);

  const getCode = (index, lang) => {
    if (codingAnswers[index] && codingAnswers[index][lang]) {
      return codingAnswers[index][lang];
    }
    const q = quiz.questions[index];
    if (q && q.starterCode && q.starterCode[lang]) {
      return q.starterCode[lang];
    }
    return "";
  };

  const setCode = (index, lang, code) => {
    setCodingAnswers(prev => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        [lang]: code
      }
    }));
  };

  const getLanguage = (index) => {
    return selectedLanguages[index] || "python";
  };

  const handleLanguageChange = (index, lang) => {
    setSelectedLanguages(prev => ({
      ...prev,
      [index]: lang
    }));
  };

  const getTests = (index) => {
    const q = quiz.questions[index];
    if (q && q.testcases) {
      return q.testcases.filter(tc => tc.input || tc.output).map((tc, i) => ({
        id: i + 1,
        input: tc.input,
        expected: tc.output
      }));
    }
    return [];
  };

  const runCode = async (index) => {
    const lang = getLanguage(index);
    const code = getCode(index, lang);
    const tests = getTests(index);

    if (tests.length === 0) {
      toast.error("No test cases found for this question.");
      return;
    }

    setIsRunning(true);
    setCompilerOutput("⏳ Running your code...");

    try {
      const selectedTestData = tests[selectedTestCase] || tests[0];

      const res = await axios.post(`${COMPILER_URL}/run`, {
        language: lang,
        code,
        tests: [{ input: selectedTestData.input }]
      }, {
        timeout: 15000
      });

      if (res.data.compile && res.data.compile.code !== 0) {
        setCompilerOutput(`❌ Compilation Error:\n\n${res.data.compile.stderr || res.data.compile.stdout}`);
        setIsRunning(false);
        return;
      }

      if (res.data.tests && res.data.tests.length > 0) {
        const testResult = res.data.tests[0];
        if (testResult.killed) {
          setCompilerOutput("⏱️ Time Limit Exceeded\n\nYour code took too long to execute (>5 seconds).");
        } else if (testResult.code !== 0) {
          setCompilerOutput(`❌ Runtime Error:\n\n${testResult.stderr || testResult.stdout || "Unknown error occurred"}`);
        } else {
          const outputText = testResult.stdout.trim();
          setCompilerOutput(outputText || "(empty output)");
        }

        // Update answer status to 'answered' if not already 'passed'
        const newAnswers = [...answers];
        if (newAnswers[index]?.status !== 'passed' && newAnswers[index]?.status !== 'answered-review' && newAnswers[index]?.status !== 'review') {
          newAnswers[index] = {
            ...newAnswers[index],
            status: "answered",
            answer: code // Store code as answer
          };
          setAnswers(newAnswers);
        }
      } else {
        setCompilerOutput("⚠️ No output received from the server.");
      }
    } catch (err) {
      setCompilerOutput(`❌ Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async (index) => {
    const lang = getLanguage(index);
    const code = getCode(index, lang);
    const tests = getTests(index);

    if (tests.length === 0) {
      toast.error("No test cases found for this question.");
      return;
    }

    setIsRunning(true);
    setCompilerOutput("⏳ Running all tests...");

    try {
      const testsPayload = tests.map(t => ({ input: t.input }));

      const res = await axios.post(`${COMPILER_URL}/run`, {
        language: lang,
        code,
        tests: testsPayload
      }, {
        timeout: 30000
      });

      if (res.data.compile && res.data.compile.code !== 0) {
        setCompilerOutput(`❌ Compilation Error:\n\n${res.data.compile.stderr || res.data.compile.stdout}`);
        setIsRunning(false);
        return;
      }

      const results = [];
      let allPassed = true;
      if (res.data.tests && res.data.tests.length > 0) {
        res.data.tests.forEach((testResult, i) => {
          const expectedOutput = tests[i].expected?.trim() || "";
          const actualOutput = testResult.stdout?.trim() || "";
          const passed = !testResult.killed && testResult.code === 0 && actualOutput === expectedOutput;

          if (!passed) allPassed = false;

          results.push({
            id: tests[i].id,
            passed,
            output: actualOutput,
            error: testResult.stderr,
            killed: testResult.killed
          });
        });
      } else {
        allPassed = false;
      }

      setTestResults(prev => ({
        ...prev,
        [index]: results
      }));

      // Update answer status
      const newAnswers = [...answers];
      const currentStatus = newAnswers[index]?.status;
      if (currentStatus !== 'answered-review' && currentStatus !== 'review') {
        newAnswers[index] = {
          ...newAnswers[index],
          status: allPassed ? "passed" : "answered",
          answer: code
        };
        setAnswers(newAnswers);
      }

      // Update output for the selected test
      const currentRes = results[selectedTestCase] || results[0];
      if (currentRes) {
        if (currentRes.killed) setCompilerOutput("⏱️ Time Limit Exceeded");
        else if (currentRes.error) setCompilerOutput(`❌ Runtime Error:\n\n${currentRes.error}`);
        else setCompilerOutput(currentRes.output || "(empty output)");
      }
    } catch (err) {
      setCompilerOutput(`❌ Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Update compiler output when selected test case or results change
  useEffect(() => {
    const results = testResults[currentQuestionIndex];
    if (results && results[selectedTestCase]) {
      const currentRes = results[selectedTestCase];
      if (currentRes.killed) setCompilerOutput("⏱️ Time Limit Exceeded");
      else if (currentRes.error) setCompilerOutput(`❌ Runtime Error:\n\n${currentRes.error}`);
      else setCompilerOutput(currentRes.output || "(empty output)");
    }
  }, [selectedTestCase, testResults, currentQuestionIndex]);

  useEffect(() => {
    warningsRef.current = warnings;
  }, [warnings]);

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

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ":" : ""}${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  useEffect(() => {
    const fetchAndAuthorizeQuiz = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication error. Please log in again.");
        setLoading(false);
        setTimeout(() => navigate("/login"), 3000);
        return;
      }
      try {
        setLoading(true);
        const existingResultRes = await API.get(
          `/api/results/check/${quizId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (existingResultRes.data.resultId) {
          navigate(`/results/${existingResultRes.data.resultId}`, {
            replace: true,
          });
          return;
        }

        const quizRes = await API.get(`/api/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const quizData = quizRes.data;
        const duration = quizData.durationInMinutes || 60;
        setQuiz({
          platformName: "ProctorX",
          title: quizData.title,
          proctoringProvider: quizData.proctoringProvider || "ProctorX Safeguard",
          duration:
            duration >= 60
              ? `${duration / 60}h`
              : `${duration}m`,
          durationInMinutes: duration,
          questions: quizData.questions || [],
          studentName: user.name,
          studentEmail: user.email,
        });

        // --- Session Restoration ---
        const attemptRes = await API.get(`/api/results/attempt-status/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (attemptRes.data.status === "completed") {
          navigate(`/results/${attemptRes.data.resultId}`, { replace: true });
          return;
        }

        if (attemptRes.data.status === "in_progress") {
          isResumingRef.current = true;
          const { startedAt, warnings, answers: savedAnswers, violations: savedViolations } = attemptRes.data;

          // Recalculate Time Left
          let startTime = new Date(startedAt).getTime();
          // If startTime is Invalid or 1970 (null), use current time as fallback
          if (isNaN(startTime) || startTime === 0) {
            startTime = Date.now();
          }

          const totalSeconds = duration * 60;
          const now = new Date().getTime();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

          if (isNaN(remainingSeconds) || remainingSeconds <= 0) {
            if (!isNaN(remainingSeconds) && remainingSeconds <= 0) {
              toast.error("Your assessment time has expired.");
            }
            setTimeLeft(0);
          } else {
            setTimeLeft(remainingSeconds);
          }

          setWarnings(warnings);
          warningsRef.current = warnings;

          if (savedAnswers && savedAnswers.length > 0) {
            setAnswers(savedAnswers);
          } else {
            setAnswers(
              Array.from({ length: quizData.questions.length }, () => ({
                answer: null,
                status: "unanswered",
              }))
            );
          }

          if (savedViolations) {
            setViolationLogs(savedViolations);
            violationLogsRef.current = savedViolations;
          }

          // Force Step 3 for re-verification
          setStep(3);
          setIsOtpVerified(true); // OTP already verified for this attempt
          setHonourCodeAgreed(true); // Already agreed in previous session
          toast.success("Resuming your session. Please re-verify proctoring permissions.");
        } else {
          setAnswers(
            Array.from({ length: quizData.questions.length }, () => ({
              answer: null,
              status: "unanswered",
            }))
          );
          setTimeLeft(quizData.durationInMinutes * 60 || 3600);
          setStep(1);
          setIsOtpVerified(false);
          setHonourCodeAgreed(false);
          isResumingRef.current = false;
        }
      } catch (err) {
        console.error("Authorization failed or error fetching data:", err);
        setError(
          err.response?.data?.message ||
          "An error occurred while loading the quiz."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAndAuthorizeQuiz();

    const handleFullScreenChange = () => {
      const isNowFullScreen = !!document.fullscreenElement;
      setIsFullScreen(isNowFullScreen);

      if (isNowFullScreen) {
        fullScreenSize.current = {
          w: window.innerWidth,
          h: window.innerHeight,
        };
      } else {
        fullScreenSize.current = null;
      }
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      stopCamera();
      stopScreenShare();
    };
  }, [quizId, navigate, user, stopCamera, stopScreenShare]);

  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    const submissionData = {
      quizId: quizId,
      timeTaken: quiz.durationInMinutes * 60 - timeLeft,
      warnings: 5 - warningsRef.current,
      penalties: 0,
      answers: quiz.questions.map((q, i) => {
        if (q.questionType?.toLowerCase() === 'coding' || q.testcases?.length > 0) {
          const lang = getLanguage(i);
          const results = testResults[i] || [];
          // Create an outputs map for the backend evaluation logic
          const outputs = {};
          const tests = getTests(i);
          results.forEach((r, idx) => {
            const tc = tests[idx];
            if (tc) {
              outputs[tc.input] = r.output;
            }
          });

          return {
            type: 'coding',
            code: getCode(i, lang),
            language: lang,
            outputs: outputs, // Map by input
            results: results  // Full results array (more reliable)
          };
        }
        return answers[i]?.answer ?? null;
      }),
      violations: violationLogsRef.current
    };

    try {
      const token = localStorage.getItem("token");
      const response = await API.post(
        "/api/results/submit",
        submissionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newResultId = response.data.resultId;
      stopCamera();
      stopScreenShare();
      navigate(`/results/${newResultId}`, { replace: true });
    } catch (error) {
      console.error("Failed to submit quiz results:", error);
      toast.error(
        "There was an error submitting your results. Please try again."
      );
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [
    quiz,
    answers,
    timeLeft,
    quizId,
    navigate,
    stopCamera,
    stopScreenShare,
  ]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const syncState = useCallback(async () => {
    if (step !== 4 || isSyncing) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setIsSyncing(true);
      await API.post(`/api/results/sync-attempt/${quizId}`, {
        warnings: warningsRef.current,
        answers: answers,
        violations: violationLogsRef.current
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [step, answers, quizId, isSyncing]);

  useEffect(() => {
    syncStateRef.current = syncState;
  }, [syncState]);

  useEffect(() => {
    if (step === 4) {
      const interval = setInterval(syncState, 30000); // Sync every 30 seconds
      return () => clearInterval(interval);
    }
  }, [step, syncState]);

  useEffect(() => {
    warningsRef.current = warnings;
  }, [warnings]);

  useEffect(() => {
    if (step === 4) {
      if (timeLeft <= 0) {
        toast.error("Time is up! Submitting your quiz now.");
        if (handleSubmitRef.current) handleSubmitRef.current();
        return;
      }
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const reduceLife = useCallback((message, type = "Proctoring Violation") => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    const newLog = {
      type,
      message: `${message}`,
      timestamp: new Date()
    };

    violationLogsRef.current = [...violationLogsRef.current, newLog];
    setViolationLogs([...violationLogsRef.current]);

    setWarnings((prevWarnings) => {
      const newWarnings = prevWarnings - 1;

      if (newWarnings <= 0) {
        toast.error(
          "Maximum proctoring warnings exceeded. Your assessment is being submitted automatically for review.",
          { duration: 4000 }
        );

        const autoSubmitLog = {
          type: "Auto-Submission",
          message: "Assessment automatically submitted due to repeated proctoring violations.",
          timestamp: new Date()
        };
        violationLogsRef.current = [...violationLogsRef.current, autoSubmitLog];
        setViolationLogs([...violationLogsRef.current]);

        warningsRef.current = 0;
        if (handleSubmitRef.current) handleSubmitRef.current();
      } else {
        toastIdRef.current = toast.error(
          `${message} You have ${newWarnings} ${newWarnings === 1 ? "life" : "lives"} left.`,
          { icon: "⚠️", duration: 4000 }
        );
        // Ensure user is moved out of Step 4 on a critical proctoring violation like fullscreen exit
        if (type === "Fullscreen Violation" || type === "Clipboard Violation" || message.includes("test environment")) {
          setStep(3);
        }
      }

      if (syncStateRef.current) syncStateRef.current();
      return newWarnings;
    });
  }, []); // Now stable!

  useEffect(() => {
    if (step === 4 && !isFullScreen && !isAwaitingPermission) {
      reduceLife("Fullscreen mode was exited (Escape key or window focus lost).", "Fullscreen Violation");
    }
  }, [isFullScreen, step, isAwaitingPermission, reduceLife]);

  useEffect(() => {
    const handlePaste = (e) => {
      if (step === 4) {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        reduceLife("Unauthorized paste attempt detected. Your life was decreased.", "Clipboard Violation");
      }
    };

    const handleCopy = (e) => {
      if (step === 4) {
        e.preventDefault();
        toast.error("Copying is not allowed during the assessment.");
      }
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("copy", handleCopy);

    return () => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("copy", handleCopy);
    };
  }, [step, reduceLife]);

  useEffect(() => {
    const handleBlur = () => {
      if (step === 4 && document.fullscreenElement && !isAwaitingPermission) {
        document.exitFullscreen();
      }
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [step, isAwaitingPermission]);

  useEffect(() => {
    const handleResize = () => {
      if (step === 4 && document.fullscreenElement && fullScreenSize.current) {
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        if (newW < fullScreenSize.current.w || newH < fullScreenSize.current.h) {
          document.exitFullscreen();
        } else if (
          newW > fullScreenSize.current.w ||
          newH > fullScreenSize.current.h
        ) {
          fullScreenSize.current = { w: newW, h: newH };
        }
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [step]);

  useEffect(() => {
    if (cameraStream && cameraFeedRef.current) {
      cameraFeedRef.current.srcObject = cameraStream;
    }
    if (screenStream && screenFeedRef.current) {
      screenFeedRef.current.srcObject = screenStream;
    }
  }, [cameraStream, screenStream, step, isFullScreen, cameraEnabled, screenEnabled]);

  useEffect(() => {
    if (step < 3) {
      stopCamera();
      stopScreenShare();
    }
  }, [step, stopCamera, stopScreenShare]);

  const handleEnableCamera = async () => {
    setIsAwaitingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setCameraEnabled(true);
    } catch (err) {
      toast.error(
        "Camera access was denied. Please allow access in your browser settings."
      );
    } finally {
      setIsAwaitingPermission(false);
    }
  };

  const handleEnableScreenShare = async () => {
    setIsAwaitingPermission(true);
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
        toast.error(
          "You must share your entire screen. Please select the 'Entire Screen' option."
        );
        setScreenEnabled(false);
      }
    } catch (err) {
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
        toast.error(
          "Screen share access was denied. Please select a screen to share."
        );
      }
    } finally {
      setIsAwaitingPermission(false);
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
        .catch((err) =>
          toast.error(`Error enabling full-screen: ${err.message}`)
        );
    } else {
      document.exitFullscreen();
    }
  };

  const handleBeginAssessment = async () => {
    const token = localStorage.getItem("token");

    if (isOtpVerified) {
      if (!isFullScreen) {
        toast.error("Please re-enter full-screen mode to continue.");
        return;
      }

      try {
        setIsVerifying(true);
        // Ensure attempt is started on backend
        await API.post(`/api/results/start-attempt/${quizId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStep(4);
      } catch (err) {
        console.error("Failed to start assessment:", err);
        const errorMessage = err.response?.data?.message || "Failed to start assessment. Please try again.";
        toast.error(errorMessage);
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    setIsVerifying(true);
    setSecurityCodeError(null);
    try {
      const code = securityCode.join("");

      // Start attempt - this now handles OTP verification on the backend atomically
      await API.post(`/api/results/start-attempt/${quizId}`,
        { otp: code },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsOtpVerified(true);
      setStep(4);
    } catch (err) {
      if (err.response?.data?.message) {
        setSecurityCodeError(err.response.data.message);
      } else {
        setSecurityCodeError("Something went wrong. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAnswerChange = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      ...newAnswers[currentQuestionIndex],
      answer: optionIndex,
      status: optionIndex === null ? "unanswered" : "answered",
    };
    setAnswers(newAnswers);
  };

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Hourglass className="h-12 w-12 text-red-600 animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
        <div className="text-center p-6 sm:p-8 bg-white rounded-lg border border-gray-200 shadow-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
          <p className="mt-4 text-gray-800">{error}</p>
        </div>
      </div>
    );
  if (!quiz) return null;

  const renderContent = () => {
    if (step < 4) {
      const steps = [{ id: 1 }, { id: 2 }, { id: 3 }];
      return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-white text-gray-900 font-sans relative">
          <Toaster position="top-center" reverseOrder={false} />
          <div className="w-full lg:w-128 flex-shrink-0 bg-yellow-50 border-r border-gray-200 flex flex-col justify-between p-6 sm:p-8">
            <div>
              <div className="flex items-center space-x-1 mb-6 sm:mb-8">
                <img
                  src={LOGO}
                  alt=""
                  className="h-16 w-16 sm:h-20 sm:w-20 mt-0.5 text-blue-600"
                />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Take An Assessment
                </h1>
              </div>
              <div className="p-4 sm:p-7 border-2 border-gray-500 rounded-xl bg-white">
                <h2 className="font-bold text-base sm:text-lg text-gray-900">
                  {quiz.title}
                </h2>
                <div className="border-t-2 border-dashed border-gray-500 my-4 sm:my-7"></div>
                <div className="grid grid-cols-2 gap-y-4 sm:gap-y-6 gap-x-4 sm:gap-x-6">
                  <div className="flex items-start space-x-2">
                    <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm text-gray-600">
                        Proctoring
                      </span>
                      <span className="block font-semibold text-sm sm:text-base text-gray-900">
                        {quiz.proctoringProvider || "ProctorX Safeguard"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Hourglass className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm text-gray-600">
                        Max. Duration
                      </span>
                      <span className="text-gray-900 font-bold">
                        {quiz.duration || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs sm:text-sm text-gray-600">
                        Total Questions
                      </span>
                      <span className="block font-semibold text-sm sm:text-base text-gray-900">
                        {quiz.questions?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center mt-8 lg:mt-0">
              <img
                src={Proctor}
                alt="illustration"
                className="mb-6 w-64 sm:w-80 lg:w-96 h-auto mx-auto"
              />
              <div className="text-center w-full">
                <div className="flex items-center justify-center space-x-3">
                  <User className="w-8 h-8 p-1.5 bg-gray-200 text-gray-700 rounded-full" />
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-gray-900">
                      {quiz.studentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {quiz.studentEmail}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex absolute top-1/2 left-128 -translate-x-1/2 -translate-y-1/2 flex-col items-center z-10">
            {steps.map((s, index) => (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 flex items-center justify-center font-bold transition-all ${s.id < step
                    ? "bg-green-600 text-white"
                    : step === s.id
                      ? "bg-red-600 text-white scale-110"
                      : "bg-white border-2 border-gray-500 text-black-500"
                    }`}
                >
                  {s.id < step ? <CheckCircle2 size={20} /> : s.id}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-16 bg-gray-300 my-2"></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col p-6 sm:p-8 lg:p-12 bg-white">
            <div className="flex-1">
              {step === 1 && (
                <div className="space-y-8 sm:space-y-10 text-gray-700">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-black-900">
                      Instructions
                    </h2>
                    <p className="mt-2 sm:mt-4 text-sm sm:text-base text-black ">
                      Please read the below instructions carefully and begin the
                      assessment.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm sm:text-base font-semibold mt-4">
                      <li>
                        This assessment can be attempted only ONCE. Hence, please
                        ensure you are seated in a distraction-free environment.
                      </li>
                      <li>
                        Please ensure you are connected to a strong wifi/ethernet
                        network.
                      </li>
                      <li>
                        In case of internet discrepancies, your timer will still
                        keep running. However, you can continue attempting the
                        current question.
                      </li>
                      <li>
                        The security code will be provided by the invigilator at
                        your venue.
                      </li>
                      <li>
                        In case of any technical difficulties, please reach out
                        to the invigilator.
                      </li>
                      <li>Give your best. Good luck!</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-dashed border-amber-400 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                      <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-3">
                        Proctoring Guidelines
                      </h3>
                      <ul className="list-disc list-inside text-sm sm:text-base space-y-2 text-black-800">
                        <li>
                          This assessment requires you to share your Camera and
                          Microphone feed, as well as your entire screen.
                        </li>
                        <li>
                          Once the assessment begins, make sure that your Camera
                          & Microphone feed, along with Screen Sharing, are
                          clearly visible in the top-left corner of the
                          assessment screen. If they appear blank or the feed is
                          incorrect, contact your invigilator right away.
                          Failure to do so will void your chances for any
                          further consideration of retake/reevaluation.
                        </li>
                      </ul>
                    </div>
                    <img
                      src={ProctoredX}
                      alt="proctoring"
                      className="w-40 sm:w-56 object-contain mt-4 sm:mt-0 sm:ml-6 flex-shrink-0"
                    />
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Marking Scheme
                    </h2>
                    <p className="mt-2 sm:mt-4 text-sm sm:text-base">
                      Refer to the top right of each question for the marks
                      awarded for a correct answer or deducted for an incorrect
                      answer as shown below.
                    </p>
                    <div className="flex items-center space-x-6 mt-4">
                      <div className="text-center">
                        <div className="inline-block bg-green-100 text-green-700 font-bold px-3 py-1 rounded border border-green-300">
                          +X
                        </div>
                        <p className="mt-2 text-sm">Correct</p>
                      </div>
                      <div className="text-center">
                        <div className="inline-block bg-red-100 text-red-700 font-bold px-3.5 py-1 rounded border border-red-300">
                          -Y
                        </div>
                        <p className="mt-2 text-sm">Incorrect</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Question Palette
                    </h2>
                    <p className="mt-2 sm:mt-4 text-sm sm:text-base">
                      The question palette displayed on the left side of the
                      assessment screen will show the following statuses depicted
                      by distinct symbols.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-6 text-sm sm:text-base">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          1
                        </div>
                        <span>Answered</span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 border-2 border-gray-700 rounded-md flex items-center justify-center text-gray-700 font-bold flex-shrink-0">
                          2
                        </div>
                        <span>Unanswered</span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          5
                        </div>
                        <span>Marked for review but answered</span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 border-2 border-orange-400 rounded-lg flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                          13
                        </div>
                        <span>Marked for review but unanswered</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="mt-0 sm:mt-18 space-y-8 sm:space-y-12 text-black-800">
                  <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">
                    Proctor-X Honour Code
                  </h2>
                  <p className="text-sm sm:text-base">
                    Before you start this challenge, we want you to take a take
                    pledge - that you will abide by Proctor-X Honour Code. Here's
                    what you are promising us.
                  </p>

                  <div className="space-y-6 sm:space-y-8 mt-8">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">
                        I solemnly swear that I am up to no dishonesty! I promise
                        to be truthful, and honourable and use only my powers of
                        knowledge to complete this challenge.
                      </span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">
                        I solemnly swear that I will not engage in malpractice
                        such as (but not limited to) copying from my peers, using
                        unauthorized resources (we're looking at you,
                        ChatGPT!), or collaborating with others.
                      </span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">
                        I also solemnly swear that failure to follow the
                        aforementioned two points in the honour code will result
                        in a life sentence of guilt, shame, eternal bad luck, and
                        rejection from the Proctor-X program.
                      </span>
                    </div>
                  </div>

                  <label className="flex items-start space-x-3 cursor-pointer pt-6">
                    <input
                      type="checkbox"
                      checked={honourCodeAgreed}
                      onChange={(e) => setHonourCodeAgreed(e.target.checked)}
                      className="mt-0.5 h-5 w-5 accent-red-600 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-gray-900 font-medium text-sm sm:text-base">
                      I solemnly swear to abide by the Proctor-X Honour Code.
                    </span>
                  </label>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-8 sm:space-y-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
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
                        cameraEnabled && (isMobileDevice ? true : screenEnabled)
                          ? "checked"
                          : "unchecked"
                      }
                    >
                      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                        <div className="flex flex-col space-y-4 w-full sm:w-48">
                          <div className="w-full h-auto aspect-video sm:h-32 sm:aspect-auto bg-gray-900 rounded-lg flex items-center justify-center">
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
                          {!cameraEnabled ? (
                            <button
                              onClick={handleEnableCamera}
                              className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 text-sm sm:text-base"
                            >
                              Enable Camera
                            </button>
                          ) : (
                            <button
                              onClick={stopCamera}
                              className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 text-sm sm:text-base"
                            >
                              Stop Camera
                            </button>
                          )}
                        </div>

                        {!isMobileDevice && (
                          <div className="flex flex-col space-y-4 w-full sm:w-48">
                            <div className="w-full h-auto aspect-video sm:h-32 sm:aspect-auto bg-gray-900 rounded-lg flex items-center justify-center">
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
                            {!screenEnabled ? (
                              <button
                                onClick={handleEnableScreenShare}
                                className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 text-sm sm:text-base"
                              >
                                Enable Screen Share
                              </button>
                            ) : (
                              <button
                                onClick={stopScreenShare}
                                className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 text-sm sm:text-base"
                              >
                                Stop Screen Share
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </SetupCheckItem>
                    <SetupCheckItem
                      title="Full Screen Mode"
                      status={isFullScreen ? "checked" : "unchecked"}
                    >
                      <button
                        onClick={handleFullScreen}
                        className={`px-4 py-2 text-white rounded flex items-center space-x-2 font-medium text-sm sm:text-base ${isFullScreen
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                          }`}
                      >
                        <Expand size={16} />
                        <span>
                          {isFullScreen ? "Exit Full Screen" : "Go Full Screen"}
                        </span>
                      </button>
                    </SetupCheckItem>
                    <div className="flex items-start space-x-3 p-4 bg-yellow-100 border border-yellow-300 rounded-lg font-bold text-black">
                      <input
                        type="checkbox"
                        id="bugAcknowledge"
                        checked={hasAcknowledgedBug}
                        onChange={(e) =>
                          setHasAcknowledgedBug(e.target.checked)
                        }
                        className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500 flex-shrink-0"
                      />
                      <label
                        htmlFor="bugAcknowledge"
                        className="text-sm text-black"
                      >
                        <strong>Important Notice:</strong> Hey folks, we are
                        facing a bug. Before you begin, please{" "}
                        <strong>hide the full-screen notification</strong> from
                        your browser, or you might lose a life. Please tick this
                        box to confirm you have done this. We will sort out the
                        bug soon!
                      </label>
                    </div>

                    <SetupCheckItem
                      title="Security Code"
                      status={
                        securityCode.join("").length === 6 || isOtpVerified
                          ? "checked"
                          : "unchecked"
                      }
                      check={isOtpVerified ? "OTP already verified. Please re-enable proctoring features below." : "Enter the 6-digit code from your invigilator."}
                    >
                      {!isOtpVerified ? (
                        <>
                          <div className="flex space-x-2 sm:space-x-3">
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
                                  !cameraEnabled ||
                                  (!isMobileDevice && !screenEnabled) ||
                                  !isFullScreen ||
                                  !hasAcknowledgedBug
                                }
                                className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gray-300 bg-white rounded text-center text-xl sm:text-2xl text-gray-900 disabled:bg-gray-100 focus:border-red-600 focus:ring-0"
                              />
                            ))}
                          </div>
                          {securityCodeError && (
                            <p className="text-sm text-red-600 mt-2">
                              {securityCodeError}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-sm font-medium">Security code verified successfully</span>
                        </div>
                      )}
                    </SetupCheckItem>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t-2 border-black-500">
              <button
                onClick={handlePrevStep}
                disabled={step === 1}
                className="px-3 py-2 sm:px-5 flex items-center space-x-2 bg-red-500 text-white border border-gray-300 rounded font-medium hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  disabled={step === 2 && !honourCodeAgreed}
                  className="px-4 py-2 sm:px-8 flex items-center space-x-2 bg-green-800 text-white rounded font-medium hover:bg-green-900 disabled:bg-gray-300 text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight size={16} />
                  <p></p>
                </button>
              ) : (
                <button
                  onClick={handleBeginAssessment}
                  disabled={
                    isVerifying ||
                    !honourCodeAgreed ||
                    !cameraEnabled ||
                    (!isMobileDevice && !screenEnabled) ||
                    !isFullScreen ||
                    !hasAcknowledgedBug ||
                    (securityCode.join("").length !== 6 && !isOtpVerified)
                  }
                  className="px-4 py-2 sm:px-8 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 flex items-center space-x-2 text-sm sm:text-base"
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
          case "passed":
            return "bg-emerald-500 text-white"; // Bright green for all tests passed
          case "answered":
            return "bg-green-600 text-white";
          case "unanswered":
            return "bg-gray-200 text-gray-700";
          case "review":
            return "bg-red-600 text-white";
          case "answered-review":
            return "bg-yellow-500 text-white border-2 border-red-500";
          default:
            return "bg-gray-200 text-gray-700";
        }
      };

      return (
        <>
          <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
            <Toaster position="top-center" reverseOrder={false} />
            <InstructionsModal
              isOpen={isInstructionsOpen}
              onClose={() => setIsInstructionsOpen(false)}
              quiz={quiz}
            />

            <header className="flex items-stretch justify-between flex-shrink-0 px-2 sm:px-0 bg-white">
              <div className="flex items-center py-3">
                <GraduationCap className="h-6 w-10 sm:h-8 sm:w-12 pl-2 sm:pl-5 text-red-900" />
                <h1 className="text-base sm:text-lg font-bold pl-1 sm:pl-2 text-gray-800">
                  {quiz.title}
                </h1>
              </div>

              <div className="flex items-stretch">
                {timeLeft !== null && (
                  <div className="flex items-center font-medium text-black-600 text-sm sm:text-base px-2 sm:px-6">
                    <Clock className="mr-1 mt-0.3" size={18} />
                    <span>{formatTime(timeLeft)} left</span>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 sm:px-12 text-sm sm:text-md font-medium text-white bg-gray-900 hover:bg-black-700 focus:outline-none focus:ring-2 focus:ring-black-500 focus:ring-opacity-50 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
                  {isSubmitting ? "Submitting..." : "Finish Assessment"}
                </button>
              </div>
            </header>
            <hr className="border-1" />

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              <aside className="w-full lg:w-1/6 bg-stone-100 border-black-800 lg:border-r-2 flex flex-col flex-shrink-0 overflow-y-auto">
                <div className="bg-yellow-50 p-2 pt-2">
                  <div className="flex items-center text-sm space-x-2 text-black-800 max-w-md mx-auto lg:max-w-full">
                    <span className="text-red-700">
                      <ScanEye size={30} />
                    </span>
                    <span>
                      Your camera feed, audio and screen are being proctored.
                    </span>
                  </div>
                  <div
                    className={`flex items-center ${!isMobileDevice && "space-x-2"
                      } mt-2 w-full max-w-md mx-auto lg:max-w-full`}
                  >
                    <ProctoringFeed stream={cameraStream} type="camera" />
                    {!isMobileDevice && (
                      <ProctoringFeed stream={screenStream} type="screen" />
                    )}
                  </div>
                </div>

                <hr className="border-t-1 border-red-400" />

                <div className="flex-1 lg:mt-4 p-4 lg:p-0">
                  <h2
                    onClick={() => setIsInstructionsOpen(true)}
                    className="font-semibold mb-3 text-center cursor-pointer text-gray-900 flex items-center justify-center gap-1"
                  >
                    <GrStatusInfo size={22} className="text-black font-bold" />
                    Instructions
                  </h2>
                  <hr className="w-3/4 mx-auto border-t-2 border-gray-300 my-4" />

                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-3 gap-2 lg:gap-3 lg:pl-5">
                    {quiz.questions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuestionNavigation(index)}
                        className={`h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-md font-bold flex items-center justify-center ${getStatusColor(
                          answers[index]?.status
                        )} ${currentQuestionIndex === index
                          ? "ring-2 ring-red-500"
                          : ""
                          }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
              <div className="flex-1 flex flex-col pt-2 overflow-hidden">
                <main className={`flex-1 flex flex-col overflow-hidden ${(currentQuestion.questionType?.toLowerCase() === "coding" || currentQuestion.testcases?.length > 0) ? "px-0 py-0" : "px-4 py-4 sm:px-8 sm:py-6 lg:pl-32 lg:pt-16 overflow-y-auto"}`}>
                  {(currentQuestion.questionType?.toLowerCase() === "coding" || currentQuestion.testcases?.length > 0) ? (
                    <div className="h-full w-full flex flex-col font-sans text-gray-800 overflow-hidden">
                      <div className="flex-1 grid grid-cols-1 overflow-hidden">
                        <div className={`grid h-full bg-white overflow-hidden transition-all duration-300 ${isExpanded ? "grid-rows-[min-content_48px_1fr_40%]" : "grid-rows-[min-content_48px_1fr_40px]"}`}>

                          {/* Question Text for Coding */}
                          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 overflow-y-auto max-h-[25vh]">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                              Problem Statement
                            </h2>
                            <div
                              className="text-[15px] leading-relaxed text-gray-700 prose prose-slate max-w-none"
                              dangerouslySetInnerHTML={{ __html: currentQuestion.questionText }}
                            />
                            <div className="mt-4 flex items-center gap-4">
                              <span className="text-sm font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                Marks: {currentQuestion.marks}
                              </span>
                            </div>
                          </div>

                          {/* Editor Toolbar */}
                          <div className="h-12 flex items-center justify-between border-b border-gray-200 bg-white px-4 flex-shrink-0">
                            <div className="flex h-full items-center gap-4">
                              <div className="relative">
                                <select
                                  value={getLanguage(currentQuestionIndex)}
                                  onChange={(e) => handleLanguageChange(currentQuestionIndex, e.target.value)}
                                  className="appearance-none bg-gray-100 border border-gray-300 px-3 py-1 pr-8 rounded text-sm font-bold text-gray-700 hover:bg-gray-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="python">PYTHON</option>
                                  <option value="cpp">C++</option>
                                  <option value="java">JAVA</option>
                                  <option value="javascript">JAVASCRIPT</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>

                              <div className="h-6 w-[1px] bg-gray-300" />

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => { setActiveTab("run"); runCode(currentQuestionIndex); }}
                                  disabled={isRunning}
                                  className={`px-4 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-2 ${isRunning
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-800 text-white hover:bg-gray-700"
                                    }`}
                                >
                                  {isRunning && activeTab === "run" ? (
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : null}
                                  Run
                                </button>
                                <button
                                  onClick={() => { setActiveTab("runTests"); runAllTests(currentQuestionIndex); }}
                                  disabled={isRunning}
                                  className={`px-4 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-2 ${isRunning
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                >
                                  {isRunning && activeTab === "runTests" ? (
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : null}
                                  Run All Tests
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Code Editor */}
                          <div className="h-full relative overflow-hidden bg-[#fffffe]">
                            <Editor
                              height="100%"
                              language={getLanguage(currentQuestionIndex) === 'cpp' ? 'cpp' : getLanguage(currentQuestionIndex)}
                              value={getCode(currentQuestionIndex, getLanguage(currentQuestionIndex))}
                              onChange={(value) => setCode(currentQuestionIndex, getLanguage(currentQuestionIndex), value)}
                              theme="light"
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
                                  clipboard._onPaste = function (e) {
                                    reduceLife("Pasting is not allowed in the editor.");
                                    return; // Block
                                  };
                                }
                              }}
                              options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                padding: { top: 16, bottom: 16 },
                                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace"
                              }}
                            />
                          </div>

                          {/* Bottom Panel - Test Results */}
                          <div className="h-full flex flex-col border-t border-gray-300 bg-gray-50 overflow-hidden">
                            <div className="h-10 bg-gray-100 border-b border-gray-300 flex items-center px-4 flex-shrink-0">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Test Results</span>
                              <div className="ml-auto flex items-center gap-4">
                                {testResults[currentQuestionIndex] && (
                                  <span className="text-xs font-bold text-gray-600">
                                    Passed: {testResults[currentQuestionIndex].filter(r => r.passed).length}/{getTests(currentQuestionIndex).length}
                                  </span>
                                )}
                                <button
                                  onClick={() => setIsExpanded(!isExpanded)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>

                            <div className={`flex-1 flex min-h-0 overflow-hidden ${!isExpanded ? "hidden" : ""}`}>
                              {/* Test Cases Sidebar */}
                              <div className="w-48 border-r border-gray-200 bg-gray-50 flex flex-col flex-shrink-0">
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                  {getTests(currentQuestionIndex).map((t, i) => {
                                    const result = testResults[currentQuestionIndex]?.find(r => r.id === t.id);
                                    return (
                                      <button
                                        key={t.id}
                                        onClick={() => setSelectedTestCase(i)}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-gray-200 transition-colors ${selectedTestCase === i
                                          ? "bg-white border-l-4 border-l-blue-600 shadow-sm"
                                          : "hover:bg-gray-100"
                                          }`}
                                      >
                                        <span className={`text-sm font-medium ${selectedTestCase === i ? "text-blue-700" : "text-gray-600"}`}>
                                          Test Case {t.id}
                                        </span>
                                        {result && (
                                          result.passed ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Test Case Details */}
                              <div className="flex-1 p-5 overflow-y-auto bg-white custom-scrollbar">
                                {getTests(currentQuestionIndex).length > 0 ? (
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Input</h4>
                                      <pre className="p-3 bg-gray-50 border border-gray-200 rounded font-mono text-sm overflow-x-auto">
                                        {getTests(currentQuestionIndex)[selectedTestCase]?.input || "(no input)"}
                                      </pre>
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Expected Output</h4>
                                      <pre className="p-3 bg-gray-50 border border-gray-200 rounded font-mono text-sm overflow-x-auto text-gray-700">
                                        {getTests(currentQuestionIndex)[selectedTestCase]?.expected || "(no output)"}
                                      </pre>
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Actual Output</h4>
                                      <div className="relative">
                                        <pre className={`p-3 border rounded font-mono text-sm overflow-x-auto min-h-[60px] ${compilerOutput.includes("❌") || compilerOutput.includes("⏱️")
                                          ? "bg-red-50 border-red-200 text-red-700"
                                          : "bg-gray-50 border-gray-200 text-gray-900"
                                          }`}>
                                          {compilerOutput || "Click 'Run' to see output"}
                                        </pre>
                                        {testResults[currentQuestionIndex] && (
                                          <div className="absolute top-2 right-2">
                                            {testResults[currentQuestionIndex][selectedTestCase]?.passed ? (
                                              <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded uppercase">Matched</span>
                                            ) : testResults[currentQuestionIndex][selectedTestCase] ? (
                                              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded uppercase">Mismatched</span>
                                            ) : null}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                    No test cases configured for this problem.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <button
                          onClick={handleMarkForReview}
                          className="flex items-center space-x-2 py-2 sm:py-5 cursor-pointer text-gray-800 rounded font-medium"
                        >
                          <Bookmark size={16} />
                          <span>Mark for Review</span>
                        </button>
                        <div className="flex items-center mr-0 sm:mr-40 space-x-0 self-end sm:self-center">
                          <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-0.5">
                            +{currentQuestion.marks}
                          </span>
                          <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-0.5">
                            0
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 mt-2 sm:mt-5 text-gray-500">
                          Question {currentQuestionIndex + 1} of{" "}
                          {quiz.questions.length}
                        </h3>
                        <p className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
                          {currentQuestion.questionText}
                        </p>
                        <hr className="w-full lg:w-6/7" />

                        <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-5">
                          {(currentQuestion.questionType?.toLowerCase() === "descriptive" || (!currentQuestion.options || currentQuestion.options.length === 0 || currentQuestion.options.every(opt => !opt))) && (currentQuestion.questionType?.toLowerCase() !== "coding" && (!currentQuestion.testcases || currentQuestion.testcases.length === 0)) ? (
                            <div className="lg:max-w-5xl">
                              <DescriptiveEditor
                                value={answers[currentQuestionIndex]?.answer || ""}
                                onChange={(val) => handleAnswerChange(val)}
                                placeholder={`Write your answer for question ${currentQuestionIndex + 1}...`}
                              />
                            </div>
                          ) : (
                            currentQuestion.options?.map((option, index) => (
                              <label
                                key={index}
                                className={`flex items-center p-3 sm:p-4 border-3 cursor-pointer transition-colors w-full lg:max-w-md min-h-[3.5rem] ${answers[currentQuestionIndex]?.answer === index
                                  ? "bg-blue-50 border-blue-600"
                                  : "bg-gray-100 border-gray-500 hover:bg-gray-200"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name={`q-${currentQuestionIndex}`}
                                  checked={
                                    answers[currentQuestionIndex]?.answer === index
                                  }
                                  onChange={() => handleAnswerChange(index)}
                                  className="h-5 w-5 mr-4 accent-blue-600"
                                />
                                <span className="text-black-500 text-sm sm:text-base">
                                  {option}
                                </span>
                              </label>
                            )) ?? (
                              <div className="text-gray-500 italic">No options available for this question.</div>
                            )
                          )}

                          <button
                            onClick={() => handleAnswerChange(null)}
                            className="flex items-center px-4 py-2 text-red-700 rounded font-medium space-x-2 w-max mt-4 sm:mt-2"
                          >
                            <Eraser size={18} />
                            <span className="text-sm sm:text-base">
                              Clear Response
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </main>

                <footer className="flex-shrink-0 flex justify-between items-center mt-2 pt-2 border-t bg-gray-200 px-4 sm:px-8">
                  <button
                    onClick={() =>
                      handleQuestionNavigation(currentQuestionIndex - 1)
                    }
                    disabled={currentQuestionIndex === 0}
                    className="px-3 py-2 sm:px-5 flex items-center space-x-2 cursor-pointer rounded font-medium disabled:opacity-50 text-sm sm:text-base"
                  >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <button
                    onClick={() =>
                      handleQuestionNavigation(currentQuestionIndex + 1)
                    }
                    disabled={
                      currentQuestionIndex === quiz.questions.length - 1
                    }
                    className="px-3 py-2 sm:px-8 flex items-center cursor-pointer space-x-2 text-black rounded font-medium text-sm sm:text-base"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ArrowRight size={18} />
                  </button>
                </footer>
              </div>
            </div>
          </div>
          <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #bbb;
        }
        .prose pre {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e9ecef;
          font-family: monospace;
          white-space: pre-wrap;
        }
      `}</style>
        </>
      );
    }
  };

  return renderContent();
};

export default QuizFlow;
