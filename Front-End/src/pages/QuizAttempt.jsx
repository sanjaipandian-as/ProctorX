import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast"; // Import toast
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
} from "lucide-react";

const ProctoringFeed = ({ stream, type }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <div className="bg-black rounded-lg aspect-video w-full flex items-center justify-center text-gray-400 relative">
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

const SetupCheckItem = ({ title, status, children, check }) => {
  const statusIcons = {
    checked: <CheckCircle2 className="text-white" />,
    unchecked: (
      <div className="w-5 h-5 border-2 border-gray-600 rounded-full"></div>
    ),
  };
  return (
    <div className="flex items-start space-x-4">
      <div>{statusIcons[status]}</div>
      <div className="flex-1">
        <h3
          className={`font-semibold ${
            status === "checked" ? "text-white" : "text-gray-400"
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
      <CheckCircle2 className="h-4 w-4 text-white flex-shrink-0" />
    ) : (
      <div className="w-4 h-4 border-2 border-gray-500 rounded-full flex-shrink-0"></div>
    )}
    <span
      className={`text-sm ${
        isChecked ? "text-white" : "text-gray-400"
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
  const [warnings, setWarnings] = useState(5);
  const cameraFeedRef = useRef(null);
  const screenFeedRef = useRef(null);
  const inputRefs = useRef([]);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
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
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication error. Please log in again.");
        setLoading(false);
        setTimeout(() => navigate("/login"), 3000);
        return;
      }
      try {
        setLoading(true);
        const existingResultRes = await axios.get(
            `http://localhost:8000/api/results/check/${quizId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        if (existingResultRes.data.resultId) {
            navigate(`/results/${existingResultRes.data.resultId}`, { replace: true });
            return;
        }

        const quizRes = await axios.get(
          `http://localhost:8000/api/quizzes/${quizId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const quizData = quizRes.data;
        setQuiz({
          platformName: "ProctorX",
          title: quizData.title,
          proctoringProvider: "Remote",
          duration: quizData.durationInMinutes >= 60 ? `${quizData.durationInMinutes/60}h` : `${quizData.durationInMinutes}m`,
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

  const handleSubmit = useCallback(async () => {
    const submissionData = {
      quizId: quizId,
      timeTaken: quiz.durationInMinutes * 60 - timeLeft,
      warnings: 5 - warnings,
      penalties: 0,
      answers: answers.map(a => a?.answer ?? null),
    };

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8000/api/results/submit",
        submissionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newResultId = response.data.resultId;
      stopCamera();
      stopScreenShare();
      navigate(`/results/${newResultId}`, { replace: true });
    } catch (error) {
      console.error("Failed to submit quiz results:", error);
      toast.error("There was an error submitting your results. Please try again.");
    }
  }, [quiz, answers, timeLeft, warnings, quizId, navigate, stopCamera, stopScreenShare]);

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
    if (step === 4 && !isFullScreen) {
      const newWarnings = warnings - 1;
      setWarnings(newWarnings);

      if (newWarnings <= 0) {
        toast.error(
          "You have exceeded the maximum number of warnings. Your quiz will be submitted automatically.",
          { duration: 4000 }
        );
        handleSubmit();
      } else {
        toast.error(
          `You have exited full-screen. You have ${newWarnings} lives left.`,
          { icon: "⚠️", duration: 4000 }
        );
        setStep(3); // Navigate back to the setup page
      }
    }
  }, [isFullScreen, step, warnings, handleSubmit]);
  
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
    const token = localStorage.getItem("token");
    try {
      const code = securityCode.join("");
      await axios.post(
        `http://localhost:8000/api/quizzes/${quizId}/verify-student-otp`,
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
        <Hourglass className="h-12 w-12 text-red-500 animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center p-8 bg-gray-900 rounded-lg border border-gray-700">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-white">{error}</p>
        </div>
      </div>
    );
  if (!quiz) return null;

  const renderContent = () => {
    if (step < 4) {
      const steps = [{ id: 1 }, { id: 2 }, { id: 3 }];
      return (
        <div className="flex h-screen bg-black text-white font-sans relative">
            <Toaster position="top-center" reverseOrder={false} />
          <div className="w-full max-w-xs bg-gray-950 border-r border-gray-800 flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center space-x-2 mb-8">
                <ShieldCheck className="h-8 w-8 text-red-500" />
                <h1 className="text-xl font-bold text-white">Take An Assessment</h1>
              </div>
              <div className="p-4 border border-gray-700 rounded-xl space-y-4 bg-gray-900">
                <h2 className="font-bold text-white">{quiz.title}</h2>
                <div className="flex justify-between items-center text-sm text-gray-300">
                  <span className="flex items-center">
                    <Mic className="w-4 h-4 mr-2" /> Proctoring
                  </span>
                  <span className="font-semibold bg-gray-700 text-gray-200 px-2 py-1 rounded">
                    {quiz.proctoringProvider}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-300">
                  <span className="flex items-center">
                    <Hourglass className="w-4 h-4 mr-2" /> Max. Duration
                  </span>
                  <span className="font-semibold text-white">{quiz.duration}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-300">
                  <span className="flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" /> Total Questions
                  </span>
                  <span className="font-semibold text-white">
                    {quiz.questions?.length || 0}
                  </span>
                </div>
              </div>
              <div className="my-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Setup Progress
                </h3>
                <div className="space-y-2">
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
              <img src={Firewall} alt="illustration" className="mb-6 w-42 h-42" />
              <div className="text-center w-full">
                <div className="flex items-center justify-center space-x-3">
                  <User className="w-8 h-8 p-1.5 bg-gray-800 text-white rounded-full" />
                  <div>
                    <p className="font-semibold text-white">{quiz.studentName}</p>
                    <p className="text-xs text-gray-400">{quiz.studentEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-80 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            {steps.map((s, index) => (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center font-bold transition-all ${
                    s.id < step
                      ? "bg-gray-700 text-white"
                      : step === s.id
                      ? "bg-red-600 text-white scale-110"
                      : "bg-gray-800 border-2 border-gray-700 text-white"
                  }`}
                >
                  {s.id < step ? <CheckCircle2 size={20} /> : s.id}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 h-16 bg-gray-700 my-2"></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col p-8 overflow-y-auto">
            <div className="flex-1">
              {step === 1 && (
                <div className="space-y-10 text-gray-300">
                  <h2 className="text-3xl font-bold text-white">Instructions</h2>
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
                  <div className="bg-red-900/40 border border-red-700/50 rounded-lg p-6 flex justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-white mb-3">
                        Proctoring Guidelines
                      </h3>
                      <ul className="list-disc list-inside text-sm space-y-2 text-red-200">
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
                    <img
                      src={Protected}
                      alt="proctoring"
                      className="w-48 h-32 hidden sm:block"
                    />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-10 text-gray-300">
                  <h2 className="text-3xl font-bold text-white">Honour Code</h2>
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      I solemnly swear to be truthful and rely only on my own
                      knowledge.
                    </li>
                    <li>
                      I will not engage in malpractice such as copying or
                      collaborating.
                    </li>
                    <li>
                      I understand any violation will result in
                      disqualification.
                    </li>
                  </ul>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={honourCodeAgreed}
                      onChange={(e) => setHonourCodeAgreed(e.target.checked)}
                      className="mt-1 h-5 w-5 accent-red-500"
                    />
                    <span className="text-white">
                      I solemnly swear to abide by the Honour Code.
                    </span>
                  </label>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-10">
                  <h2 className="text-3xl font-bold text-white">
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
                            <Camera className="text-gray-500"/>
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
                            <ScreenShare className="text-gray-500"/>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-4">
                        {!cameraEnabled ? (
                          <button
                            onClick={handleEnableCamera}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Enable Camera
                          </button>
                        ) : (
                          <button
                            onClick={stopCamera}
                            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                          >
                            Stop Camera
                          </button>
                        )}
                        {!screenEnabled ? (
                          <button
                            onClick={handleEnableScreenShare}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Enable Screen Share
                          </button>
                        ) : (
                          <button
                            onClick={stopScreenShare}
                            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
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
                        className="px-4 py-2 bg-red-600 text-white rounded flex items-center space-x-2 hover:bg-red-700"
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
                              !cameraEnabled || !screenEnabled || !isFullScreen || isOtpVerified
                            }
                            className="w-12 h-14 border-2 border-gray-600 bg-gray-900 rounded text-center text-2xl text-white disabled:bg-gray-800 focus:border-red-500 focus:ring-0"
                          />
                        ))}
                      </div>
                      {securityCodeError && (
                        <p className="text-sm text-red-500 mt-2">
                          {securityCodeError}
                        </p>
                      )}
                    </SetupCheckItem>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800">
              <button
                onClick={handlePrevStep}
                disabled={step === 1}
                className="px-5 py-2 flex items-center space-x-2 border border-gray-600 rounded hover:bg-gray-800 disabled:opacity-50"
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  disabled={step === 2 && !honourCodeAgreed}
                  className="px-8 py-2 flex items-center space-x-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-700"
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
                  className="px-8 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-400 flex items-center space-x-2"
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
            return "bg-gray-700 text-gray-200";
          case "review":
            return "bg-red-600 text-white";
          case "answered-review":
            return "bg-white text-black border-2 border-red-500";
          default:
            return "bg-gray-700";
        }
      };
      return (
        <div className="flex h-screen bg-black text-white font-sans">
          <Toaster position="top-center" reverseOrder={false} />
          <aside className="w-1/4 bg-gray-950 border-r border-gray-800 flex flex-col p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-8 w-8 text-red-500" />
              <h1 className="text-xl font-bold">ProctorX</h1>
            </div>

            <div className="flex space-x-2">
              <ProctoringFeed stream={cameraStream} type="camera" />
              <ProctoringFeed stream={screenStream} type="screen" />
            </div>
            
            <div className="flex-1 overflow-y-auto border-t border-gray-800 pt-4">
              <h2 className="font-semibold mb-3 text-white">Question Palette</h2>
              <div className="grid grid-cols-5 gap-2">
                {quiz.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`h-10 w-10 rounded-md font-bold flex items-center justify-center ${getStatusColor(
                      answers[index]?.status
                    )} ${
                      currentQuestionIndex === index ? "ring-2 ring-red-500" : ""
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <main className="flex-1 flex flex-col p-8">
            <header className="flex justify-between items-center pb-4 border-b border-gray-800 mb-6">
              <h2 className="text-2xl font-bold text-white">{quiz.title}</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-red-500 font-semibold">
                  <Clock className="h-6 w-6" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700"
                >
                  Submit Assignment
                </button>
              </div>
            </header>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">
                Question {currentQuestionIndex + 1} of{" "}
                {quiz.questions.length}
              </h3>
              <p className="text-xl mb-6 text-white">{currentQuestion.questionText}</p>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border rounded cursor-pointer transition-colors ${
                      answers[currentQuestionIndex]?.answer === index
                        ? "bg-red-900/50 border-red-600"
                        : "bg-gray-900 border-gray-700 hover:bg-gray-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestionIndex}`}
                      checked={answers[currentQuestionIndex]?.answer === index}
                      onChange={() => handleAnswerChange(index)}
                      className="h-5 w-5 mr-4 accent-red-500"
                    />
                    <span className="text-gray-200">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <footer className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800">
              <button
                onClick={handleMarkForReview}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                <Bookmark size={16} />
                <span>Mark for Review</span>
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={() =>
                    handleQuestionNavigation(currentQuestionIndex - 1)
                  }
                  disabled={currentQuestionIndex === 0}
                  className="px-5 py-2 flex items-center space-x-2 border border-gray-600 rounded hover:bg-gray-800 disabled:opacity-50"
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
                  className="px-8 py-2 flex items-center space-x-2 bg-red-600 text-white rounded disabled:bg-gray-700 disabled:text-gray-400"
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