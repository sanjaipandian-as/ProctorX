import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

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
  Play
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

const QuizFlow = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket(quizId);

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
  const [simulatedGazeDeflected, setSimulatedGazeDeflected] = useState(false);
  const [simulatedMultipleFaces, setSimulatedMultipleFaces] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);
  const [warnings, setWarnings] = useState(5);

  const cameraFeedRef = useRef(null);
  const screenFeedRef = useRef(null);
  const inputRefs = useRef([]);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const submittedRef = useRef(false);
  const lastDeflectionTimeRef = useRef(0);
  const step4EntryTimeRef = useRef(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600);

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

        const quizRes = await api.get(`/api/quizzes/${quizId}`);
        const quizData = quizRes.data;

        // Compute server-authoritative remaining time so late joiners see correct countdown
        let computedTimeLeft = (quizData.durationInMinutes || 60) * 60;
        if (quizData.status === 'ACTIVE' && quizData.startedAt) {
          const elapsedSeconds = Math.floor((Date.now() - new Date(quizData.startedAt).getTime()) / 1000);
          computedTimeLeft = Math.max((quizData.durationInMinutes * 60) - elapsedSeconds, 0);
        }

        setQuiz({
          id: quizData.id,
          platformName: "ProctorX",
          title: quizData.title,
          status: quizData.status,
          startedAt: quizData.startedAt,
          proctoringProvider: "Remote",
          duration: quizData.durationInMinutes >= 60 ? `${quizData.durationInMinutes / 60}h` : `${quizData.durationInMinutes}m`,
          durationInMinutes: quizData.durationInMinutes,
          questions: quizData.questions || [],
          studentName: user.name,
          studentEmail: user.email,
        });
        setAnswers(
          Array.from({ length: quizData.questions.length }, () => ({
            answer: null,
            status: "unanswered",
          }))
        );
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

      if (q.questionType === 'mcq') {
        // MCQ: answerValue is the option index
        studentAnswer = answerValue !== null && answerValue !== undefined ? (q.options[answerValue] || '') : '';
      } else if (q.questionType === 'descriptive' || q.questionType === 'coding') {
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

  // Full screen warning monitoring
  useEffect(() => {
    if (step === 4 && !isFullScreen) {
      // Cooldown of 2 seconds after entering step 4 to allow browser fullscreen API to resolve
      if (Date.now() - step4EntryTimeRef.current < 2000) return;
      // Share the same throttle ref as tab-switch handler to prevent double-deduction
      const now = Date.now();
      if (now - lastDeflectionTimeRef.current < 3000) return;
      lastDeflectionTimeRef.current = now;

      setWarnings((prevWarnings) => {
        const newWarnings = prevWarnings - 1;

        // Send websocket warning log
        if (socket && user) {
          socket.emit('student:warning', {
            quizId,
            studentId: user.id,
            type: 'FULLSCREEN'
          });
        }

        if (newWarnings <= 0) {
          toast.error(
            "You have exceeded the maximum number of warnings. Your quiz will be submitted automatically.",
            { duration: 4000 }
          );
          setTimeout(() => {
            handleSubmit();
          }, 0);
        } else {
          toast.error(
            `You have exited full-screen. You have ${newWarnings} warning lives left.`,
            { icon: "⚠️", duration: 4050 }
          );
          setTimeout(() => {
            setStep(3); // Navigate back to setup/lock page so student must go full screen again
          }, 0);
        }

        return newWarnings;
      });
    }
  }, [isFullScreen, step, handleSubmit, socket, user, quizId]);

  // Tab, Window, and Trackpad deflection warning monitoring (Alt+Tab, swipe, devtools, other windows)
  useEffect(() => {
    if (step !== 4) return;

    const handleWindowDeflection = () => {
      const now = Date.now();
      // Cooldown of 2 seconds after entering step 4 to allow browser focus to settle
      if (now - step4EntryTimeRef.current < 2000) return;
      // Throttle deflection triggers to once every 3 seconds to prevent double triggers on fast switches
      if (now - lastDeflectionTimeRef.current < 3000) return;
      lastDeflectionTimeRef.current = now;

      setWarnings((prevWarnings) => {
        const newWarnings = prevWarnings - 1;

        if (socket && user) {
          socket.emit('student:warning', {
            quizId,
            studentId: user.id,
            type: 'TAB_SWITCH'
          });
        }

        if (newWarnings <= 0) {
          toast.error(
            "You have switched tabs, windows, or apps. Maximum warnings exceeded. Submitting quiz now.",
            { duration: 4000 }
          );
          setTimeout(() => {
            handleSubmit();
          }, 0);
        } else {
          toast.error(
            `Warning: Switching apps, windows, or desktops is prohibited. You have ${newWarnings} lives left.`,
            { icon: "⚠️", duration: 4500 }
          );
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

  // AI Simulation warning trigger checks
  useEffect(() => {
    if (step !== 4) return;
    let timer = null;

    if (simulatedGazeDeflected) {
      toast("AI: Gaze deflection simulated. Move gaze back within 4s to prevent penalty.", { icon: "👀", duration: 3000 });
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
          }

          return newWarnings;
        });
        setSimulatedGazeDeflected(false);
      }, 4000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [simulatedGazeDeflected, step, socket, user, quizId, handleSubmit]);

  useEffect(() => {
    if (step !== 4) return;
    let timer = null;

    if (simulatedMultipleFaces) {
      toast("AI: Multiple faces simulated. Clear background within 4s to prevent penalty.", { icon: "👥", duration: 3000 });
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
          }

          return newWarnings;
        });
        setSimulatedMultipleFaces(false);
      }, 4000);
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

  const handleAnswerChange = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      ...newAnswers[currentQuestionIndex],
      answer: optionIndex,
      status: "answered",
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
      <div className="flex items-center justify-center h-screen bg-black">
        <Hourglass className="h-12 w-12 text-black animate-spin" />
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

  // Status gate: quiz has ended
  if (quiz.status === 'COMPLETED') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md px-8 py-12 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-gray-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="mt-2 text-gray-500 text-sm leading-relaxed">
              The exam window for this assessment has closed.
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 font-medium">
            Please contact your faculty for a re-attempt or further guidance.
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

  const renderContent = () => {
    if (step < 4) {
      const steps = [{ id: 1 }, { id: 2 }, { id: 3 }];
      return (
        <div className="flex h-screen bg-amber-50 text-gray-900 relative">
          <Toaster position="top-center" reverseOrder={false} />
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
            return "bg-white text-black";
          case "unanswered":
            return "bg-gray-200 text-gray-800";
          case "review":
            return "bg-red-600 text-gray-900";
          case "answered-review":
            return "bg-white text-black border-2 border-black ring-black";
          default:
            return "bg-gray-700";
        }
      };
      return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
          <Toaster position="top-center" reverseOrder={false} />
          <aside className="w-1/4 bg-gray-950 border-r border-gray-800 flex flex-col p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-8 w-8 text-black" />
              <h1 className="text-xl font-bold">ProctorX</h1>
            </div>

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
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-3.5 space-y-2.5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> AI Proctoring Simulator
              </h3>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                Test proctoring response loops by triggering simulated canditate violations:
              </p>

              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  onClick={() => setSimulatedGazeDeflected(!simulatedGazeDeflected)}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition flex items-center justify-between border ${simulatedGazeDeflected
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                >
                  <span>Simulate Gaze Deflection</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${simulatedGazeDeflected ? 'bg-amber-400 animate-ping' : 'bg-slate-700'}`}></span>
                </button>

                <button
                  onClick={() => setSimulatedMultipleFaces(!simulatedMultipleFaces)}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition flex items-center justify-between border ${simulatedMultipleFaces
                    ? 'bg-red-500/20 text-red-400 border-black ring-black/40'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                >
                  <span>Simulate Multi-Face</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${simulatedMultipleFaces ? 'bg-red-400 animate-ping' : 'bg-slate-700'}`}></span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border-t border-gray-800 pt-4">
              <h2 className="font-semibold mb-3 text-gray-900">Question Palette</h2>
              <div className="grid grid-cols-5 gap-2">
                {quiz.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`h-10 w-10 rounded-md font-bold flex items-center justify-center ${getStatusColor(
                      answers[index]?.status
                    )} ${currentQuestionIndex === index ? "ring-2 ring-red-500" : ""
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <main className="flex-1 flex flex-col p-8">
            <header className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-800 font-semibold bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                  <Clock className="h-5 w-5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors shadow-sm"
                >
                  Submit Assignment
                </button>
              </div>
            </header>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-600">
                  Question {currentQuestionIndex + 1} of{" "}
                  {quiz.questions.length}
                </h3>
                <span className="text-sm font-bold bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-lg">
                  {currentQuestion.marks || 1} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                </span>
              </div>
              <p className="text-xl mb-6 text-gray-900">{currentQuestion.questionText}</p>
              <div className="space-y-3">
                {currentQuestion.questionType === "mcq" && currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${answers[currentQuestionIndex]?.answer === index
                      ? "bg-gray-100 border-black ring-1 ring-black"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestionIndex}`}
                      checked={answers[currentQuestionIndex]?.answer === index}
                      onChange={() => handleAnswerChange(index)}
                      className="h-5 w-5 mr-4 accent-black"
                    />
                    <span className="text-gray-800 font-medium">{option}</span>
                  </label>
                ))}

                {currentQuestion.questionType === "descriptive" && (
                  <div className="mt-4">
                    <textarea
                      className="w-full h-64 p-5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none leading-relaxed"
                      placeholder="Type your detailed answer here..."
                      value={answers[currentQuestionIndex]?.answer || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                    ></textarea>
                  </div>
                )}

                {currentQuestion.questionType === "coding" && (() => {
                  const codeVal = answers[currentQuestionIndex]?.answer;
                  const codeText = typeof codeVal === 'string' ? codeVal : (currentQuestion.starterCode?.cpp || currentQuestion.starterCode?.python || currentQuestion.starterCode?.javascript || '');
                  const lineCount = (codeText || '').split('\n').length;
                  return (
                    <div className="flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm mt-2" style={{minHeight: '520px'}}>
                      {/* Top bar: language dropdown + fullscreen icon */}
                      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-300">
                        <select
                          className="bg-white text-gray-900 text-sm font-bold px-3 py-1.5 border border-gray-300 outline-none focus:border-black cursor-pointer uppercase"
                          defaultValue="cpp"
                          onChange={(e) => {
                            const newLang = e.target.value;
                            if (currentQuestion.starterCode && currentQuestion.starterCode[newLang] && (!answers[currentQuestionIndex]?.answer || answers[currentQuestionIndex]?.answer === '')) {
                              handleAnswerChange(currentQuestion.starterCode[newLang]);
                            }
                          }}
                        >
                          <option value="c">C</option>
                          <option value="cpp">CPP</option>
                          <option value="python">PYTHON</option>
                          <option value="java">JAVA</option>
                          <option value="javascript">NODEJS</option>
                        </select>
                        <button className="text-gray-500 hover:text-black p-1">
                          <Expand size={18} />
                        </button>
                      </div>

                      {/* Code editor area */}
                      <div className="flex flex-1 overflow-hidden bg-[#f5f5f5]" style={{minHeight: '300px'}}>
                        {/* Line numbers */}
                        <div className="w-10 bg-[#f0f0f0] border-r border-gray-300 text-gray-400 text-right pr-2 pt-3 select-none font-mono text-[13px] leading-[1.65] overflow-hidden">
                          {Array.from({length: Math.max(lineCount, 20)}, (_, i) => (
                            <div key={i}>{i + 1}</div>
                          ))}
                        </div>
                        {/* Textarea */}
                        <textarea
                          className="flex-1 bg-[#f5f5f5] text-gray-900 p-3 resize-none outline-none font-mono text-[13px] leading-[1.65]"
                          placeholder="Write your code here..."
                          spellCheck="false"
                          value={codeText}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                        />
                      </div>

                      {/* Bottom bar: Run / Run Tests tabs */}
                      <div className="border-t border-gray-300 bg-white">
                        <div className="flex border-b border-gray-200">
                          <button className="px-5 py-2 text-sm font-bold text-gray-800 border-b-2 border-black">Run</button>
                          <button className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition">Run Tests</button>
                          <div className="flex-1"></div>
                          <button className="px-3 py-2 text-gray-400 hover:text-black">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                          </button>
                        </div>

                        {/* Run panel content */}
                        <div className="p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <button className="flex items-center space-x-1.5 px-4 py-1.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">
                              <Play size={14} className="text-black" />
                              <span>Run Code</span>
                            </button>
                          </div>
                          <div>
                            <label className="text-sm font-bold text-gray-800 block mb-1.5">Input</label>
                            <textarea
                              className="w-full h-20 p-3 bg-white border border-gray-300 rounded text-sm font-mono text-gray-800 resize-none outline-none focus:border-black"
                              placeholder="Enter your input here..."
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <footer className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleMarkForReview}
                className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Bookmark size={16} />
                <span>Mark for Review</span>
              </button>
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
      );
    }
  };

  return renderContent();
};

export default QuizFlow;