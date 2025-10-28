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
} from "lucide-react";
import { GrStatusInfo } from "react-icons/gr";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../Api";
import LOGO from "../assets/LOGO.png";
import Proctor from "../assets/PROCTOR.png";
import ProctoredX from "../assets/PrctoredX.png";

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
        className={`w-full h-full object-cover rounded-lg ${
          !stream && "hidden"
        }`}
      />
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

const InstructionsModal = ({ isOpen, onClose }) => (
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
          className="relative bg-white shadow-xl w-[40%] h-full  flex flex-col overflow-y-auto"
        >
          <div className="p-6 space-y-12 text-gray-700">
            <div className="relative border-b pb-4 text-center">
              <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
              <div className="grid grid-cols-3 divide-x divide-gray-300">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total questions
                  </p>
                  <p className="text-lg font-semibold text-gray-800">25</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Max. Duration
                  </p>
                  <p className="text-lg font-semibold text-gray-800">30m</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Proctoring
                  </p>
                  <p className="text-lg font-semibold text-gray-800">Remote</p>
                </div>
              </div>
            </div>
            <section>
              <h3 className="text-3xl font-bold mb-4 text-gray-900">
                Instructions
              </h3>
              <p className="text-lg mb-4 text-gray-600">
                Please keep a note of the below instructions.
              </p>
              <ul className="list-disc list-inside space-y-2 text-md">
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
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                Marking Scheme
              </h3>
              <p className="text-md mb-3 text-gray-600">
                Refer to the top right of each question for the marks awarded for
                a correct answer or deducted for an incorrect answer as shown
                below.
              </p>
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-700 text-md font-semibold px-2 py-0.5 rounded-md mr-2">
                    +X
                  </span>
                  <span className="text-md italic text-gray-800">Correct</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-red-100 text-red-700 text-md font-semibold px-2 py-0.5 rounded-md mr-2">
                    -Y
                  </span>
                  <span className="text-md italic text-gray-800">
                    Incorrect
                  </span>
                </div>
              </div>
            </section>
            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                Question Palette
              </h3>
              <p className="text-md mb-3 text-gray-600">
                The question palette displayed on the left side of the assessment
                screen will show the following statuses depicted by distinct
                symbols.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-blue-600 text-white rounded-md">
                    1
                  </span>
                  <span className="text-md">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-gray-200 text-gray-700 border border-gray-400 rounded-md">
                    2
                  </span>
                  <span className="text-md">Unanswered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-yellow-500 text-white rounded-md">
                    5
                  </span>
                  <span className="text-md">Marked for review but answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-yellow-500 text-white rounded-md">
                    13
                  </span>
                  <span className="text-md">
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
    checked: <CheckCircle2 className="text-red-600" />,
    unchecked: (
      <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>
    ),
  };
  return (
    <div className="flex items-start space-x-4">
      <div>{statusIcons[status]}</div>
      <div className="flex-1">
        <h3
          className={`font-semibold text-lg ${
            status === "checked" ? "text-gray-900" : "text-gray-700"
          }`}
        >
          {title}
        </h3>
        {check && <p className="px-1 text-sm text-gray-500 mt-1">{check}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};

const SidebarChecklistItem = ({ label, isChecked }) => (
  <div className="flex items-center space-x-2">
    {isChecked ? (
      <CheckCircle2 className="h-4 w-4 text-red-600 flex-shrink-0" />
    ) : (
      <div className="w-4 h-4 border-2 border-gray-400 rounded-full flex-shrink-0"></div>
    )}
    <span
      className={`text-sm ${
        isChecked ? "text-gray-900" : "text-gray-600"
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

  const cameraFeedRef = useRef(null);
  const screenFeedRef = useRef(null);
  const inputRefs = useRef([]);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600);
  const toastIdRef = useRef(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const fullScreenSize = useRef(null);

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

  const formatTime = useCallback(
    (seconds) => {
      if (!quiz) return "00:00";
      if (seconds < 0) seconds = 0;

      if (quiz.durationInMinutes >= 60) {
        const h = Math.floor(seconds / 3600)
          .toString()
          .padStart(2, "0");
        const m = Math.floor((seconds % 3600) / 60)
          .toString()
          .padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${h}:${m}:${s}`;
      } else {
        const m = Math.floor(seconds / 60)
          .toString()
          .padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
      }
    },
    [quiz]
  );

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
        setQuiz({
          platformName: "ProctorX",
          title: quizData.title,
          proctoringProvider: "Remote",
          duration:
            quizData.durationInMinutes >= 60
              ? `${quizData.durationInMinutes / 60}h`
              : `${quizData.durationInMinutes}m`,
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
        setTimeLeft(quizData.durationInMinutes * 60 || 3600);
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
    const submissionData = {
      quizId: quizId,
      timeTaken: quiz.durationInMinutes * 60 - timeLeft,
      warnings: 5 - warningsRef.current,
      penalties: 0,
      answers: answers.map((a) => a?.answer ?? null),
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

  useEffect(() => {
    if (step === 4 && !isFullScreen && !isAwaitingPermission) {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      setWarnings((prevWarnings) => {
        const newWarnings = prevWarnings - 1;

        if (newWarnings <= 0) {
          toast.error(
            "You have exceeded the maximum number of warnings. Your quiz will be submitted automatically.",
            { duration: 4000 }
          );
          warningsRef.current = 0;
          handleSubmit();
        } else {
          toastIdRef.current = toast.error(
            `You have left the test environment. You have ${newWarnings} lives left.`,
            { icon: "⚠️", duration: 4000 }
          );
          setStep(3);
        }

        return newWarnings;
      });
    }
  }, [isFullScreen, step, handleSubmit, isAwaitingPermission]);

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
        const isResized =
          window.innerWidth !== fullScreenSize.current.w ||
          window.innerHeight !== fullScreenSize.current.h;

        if (isResized) {
          document.exitFullscreen();
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
  }, [cameraStream, screenStream]);

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
    const token = localStorage.getItem("token");
    try {
      const code = securityCode.join("");
      await API.post(
        `/api/quizzes/${quizId}/verify-student-otp`,
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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg border border-gray-200 shadow-md">
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
        <div className="flex h-screen bg-white text-gray-900 font-sans relative">
          <Toaster position="top-center" reverseOrder={false} />
          <div className="w-full max-w-lg bg-yellow-50 border-r font-bold border-gray-200 flex flex-col justify-between p-8">
            <div>
              <div className="flex items-center space-x-1 mb-8">
                <img
                  src={LOGO}
                  alt=""
                  className="h-20 w-20 mt-0.5  text-blue-600"
                />
                <h1 className="text-3xl font-bold text-gray-900">
                  Take An Assessment
                </h1>
              </div>
              <div className="p-7 border-2 border-gray-500 rounded-xl bg-white">
                <h2 className="font-bold text-gray-900">{quiz.title}</h2>
                <div className="border-t-2 border-dashed border-gray-500 my-7"></div>
                <div className="grid grid-cols-2  gap-y-6 gap-x-6">
                  <div className="flex items-start space-x-2">
                    <Mic className="w-6 h-6 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-gray-600">Proctoring</span>
                      <span className="block font-semibold text-gray-900">
                        {quiz.proctoringProvider}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Hourglass className="w-6 h-6 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-gray-600">
                        Max. Duration
                      </span>
                      <span className="block font-semibold text-gray-900">
                        1h
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <HelpCircle className="w-6 h-6 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-gray-600">
                        Total Questions
                      </span>
                      <span className="block font-semibold text-gray-900">
                        {quiz.questions?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <img
                src={Proctor}
                alt="illustration"
                className="mb-6 w-100 h-50"
              />
              <div className="text-center w-full">
                <div className="flex items-center justify-center space-x-3">
                  <User className="w-8 h-8 p-1.5 bg-gray-200 text-gray-700 rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-900">
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
          <div className="absolute top-1/2 left-128 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            {steps.map((s, index) => (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={`w-9 h-9  flex items-center justify-center font-bold transition-all ${
                    s.id < step
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
          <div className="flex-1 flex flex-col p-12 overflow-y-auto bg-white">
            <div className="flex-1">
              {step === 1 && (
                <div className="space-y-10 text-gray-700">
                  <div>
                    <h2 className="text-3xl font-bold text-black-900">
                      Instructions
                    </h2>
                    <p className="mt-4 text-base text-black ">
                      Please read the below instructions carefully and begin the
                      assessment.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-base font-semibold mt-4">
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

                  <div className="bg-amber-50 border border-dashed border-amber-400 rounded-lg p-6 flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 mb-3">
                        Proctoring Guidelines
                      </h3>
                      <ul className="list-disc list-inside text-base space-y-2 text-black-800">
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
                      className="w-56 object-contain mt-4 sm:mt-0 sm:ml-6 flex-shrink-0"
                    />
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Marking Scheme
                    </h2>
                    <p className="mt-4 text-base">
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
                    <h2 className="text-3xl font-bold text-gray-900">
                      Question Palette
                    </h2>
                    <p className="mt-4 text-base">
                      The question palette displayed on the left side of the
                      assessment screen will show the following statuses depicted
                      by distinct symbols.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-6 text-base">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-600  flex items-center justify-center text-white font-bold flex-shrink-0">
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
                <div className="mt-18 space-y-12  text-black-800">
                  <h2 className="text-4xl font-bold text-gray-900">
                    Proctor-X Honour Code
                  </h2>
                  <p className="text-base">
                    Before you start this challenge, we want you to take a take
                    pledge - that you will abide by Proctor-X Honour Code. Here's
                    what you are promising us.
                  </p>

                  <div className="space-y-8 mt-8">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-base">
                        I solemnly swear that I am up to no dishonesty! I promise
                        to be truthful, and honourable and use only my powers of
                        knowledge to complete this challenge.
                      </span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-base">
                        I solemnly swear that I will not engage in malpractice
                        such as (but not limited to) copying from my peers, using
                        unauthorized resources (we're looking at you,
                        ChatGPT!), or collaborating with others.
                      </span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-base">
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
                    <span className="text-gray-900 font-medium">
                      I solemnly swear to abide by the Proctor-X Honour Code.
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
                        <div className="w-48 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
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
                        <div className="w-48 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
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
                            className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
                          >
                            Enable Camera
                          </button>
                        ) : (
                          <button
                            onClick={stopCamera}
                            className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700"
                          >
                            Stop Camera
                          </button>
                        )}
                        {!screenEnabled ? (
                          <button
                            onClick={handleEnableScreenShare}
                            className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
                          >
                            Enable Screen Share
                          </button>
                        ) : (
                          <button
                            onClick={stopScreenShare}
                            className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700"
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
                        className={`px-4 py-2 text-white rounded flex items-center space-x-2 font-medium ${
                          isFullScreen
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
                              !cameraEnabled ||
                              !screenEnabled ||
                              !isFullScreen ||
                              isOtpVerified
                            }
                            className="w-12 h-14 border-2 border-gray-300 bg-white rounded text-center text-2xl text-gray-900 disabled:bg-gray-100 focus:border-red-600 focus:ring-0"
                          />
                        ))}
                      </div>
                      {securityCodeError && (
                        <p className="text-sm text-red-600 mt-2">
                          {securityCodeError}
                        </p>
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
                className="px-5 py-2 flex items-center space-x-2 bg-red-500 text-white border border-gray-300 rounded font-medium hover:bg-red-700 disabled:opacity-50"
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  disabled={step === 2 && !honourCodeAgreed}
                  className="px-8 py-2 flex items-center space-x-2 bg-green-800 text-white rounded font-medium hover:bg-green-900 disabled:bg-gray-300"
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
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
                  className="px-8 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 flex items-center space-x-2"
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
        <div className="flex flex-col h-screen bg-white text-gray-900 font-sans">
          <Toaster position="top-center" reverseOrder={false} />
          <InstructionsModal
            isOpen={isInstructionsOpen}
            onClose={() => setIsInstructionsOpen(false)}
          />

          <header className="flex items-stretch justify-between flex-shrink-0 px-0 bg-white">
            <div className="flex items-center py-3">
              <GraduationCap className="h-8 pl-5 w-12 text-red-900" />
              <h1 className="text-lg font-bold pl-2 text-gray-800">
                {quiz.title}
              </h1>
            </div>

            <div className="flex items-stretch pb-0 space-x-6">
              <div className="flex items-center font-medium text-black-600">
                <Clock className="mr-1 mt-0.3" size={18} />
                <span>{formatTime(timeLeft)} left</span>
              </div>

              <button
                onClick={handleSubmit}
                className="px-12 text-md font-medium text-white bg-gray-900 hover:bg-black-700 focus:outline-none focus:ring-2 focus:ring-black-500 focus:ring-opacity-50"
              >
                Finish Assessment
              </button>
            </div>
          </header>
          <hr className="border-1" />

          <div className="flex flex-1 overflow-hidden">
            <aside className="w-1/6 bg-stone-100 border-black-800 border-r-2 flex flex-col">
              <div className="bg-yellow-50 p-2 pt-2">
                <div className="flex items-center text-sm space-x-2 text-black-800">
                  <span className="text-red-700">
                    <ScanEye size={30} />
                  </span>
                  <span>
                    Your camera feed, audio and screen are being proctored.
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2 w-full">
                  <ProctoringFeed stream={cameraStream} type="camera" />
                  <ProctoringFeed stream={screenStream} type="screen" />
                </div>
              </div>

              <hr className="border-t-1 border-red-400" />

              <div className="flex-1 overflow-y-auto mt-4">
                <h2
                  onClick={() => setIsInstructionsOpen(true)}
                  className="font-semibold mb-3 text-center cursor-pointer text-gray-900 flex items-center justify-center gap-1"
                >
                  <GrStatusInfo size={22} className="text-black font-bold" />
                  Instructions
                </h2>
                <hr className="w-3/4 mx-auto border-t-2 border-gray-300 my-4" />

                <div className="grid grid-cols-3 gap-3 pl-5">
                  {quiz.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionNavigation(index)}
                      className={`h-14 w-14 rounded-md font-bold flex items-center justify-center ${getStatusColor(
                        answers[index]?.status
                      )} ${
                        currentQuestionIndex === index
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
              <main className="flex-1 flex flex-col pl-34 pt-16 overflow-y-auto">
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleMarkForReview}
                    className="flex items-center space-x-2 py-5 cursor-pointer text-gray-800 rounded font-medium"
                  >
                    <Bookmark size={16} />
                    <span>Mark for Review</span>
                  </button>
                  <div className="flex items-center mr-40 space-x-0">
                    <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-0.5">
                      +1
                    </span>
                    <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-0.5">
                      0
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4 mt-5 text-gray-500">
                    Question {currentQuestionIndex + 1} of{" "}
                    {quiz.questions.length}
                  </h3>
                  <p className="text-2xl font-bold mb-6 text-gray-900">
                    {currentQuestion.questionText}
                  </p>
                  <hr className="w-6/7" />

                  <div className="space-y-6 pt-5">
                    {currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border-3 cursor-pointer transition-colors w-full max-w-md h-14 ${
                          answers[currentQuestionIndex]?.answer === index
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
                        <span className="text-black-500">{option}</span>
                      </label>
                    ))}

                    <button
                      onClick={() => handleAnswerChange(null)}
                      className="flex items-center px-4 py-2 text-red-700 rounded font-medium space-x-2 w-max mt-2"
                    >
                      <Eraser size={18} />
                      <span>Clear Response</span>
                    </button>
                  </div>
                </div>
              </main>

              <footer className="flex-shrink-0 flex justify-between items-center mt-2 pt-2 border-t bg-gray-200 px-8">
                <button
                  onClick={() =>
                    handleQuestionNavigation(currentQuestionIndex - 1)
                  }
                  disabled={currentQuestionIndex === 0}
                  className="px-5 py-2 flex items-center space-x-2 cursor-pointer rounded font-medium disabled:opacity-50"
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
                  className="px-8 py-2 flex items-center cursor-pointer space-x-2 text-black rounded font-medium"
                >
                  <span>Next</span>
                  <ArrowRight size={18} />
                </button>
              </footer>
            </div>
          </div>
        </div>
      );
    }
  };

  return renderContent();
};

export default QuizFlow;