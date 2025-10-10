import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Camera,
  ScreenShare,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Clock,
  Bookmark,
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

const QuizAnsweringPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600);

  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const proctoringSetupRef = useRef(false);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    if (proctoringSetupRef.current) return;
    proctoringSetupRef.current = true;
    
    const startProctoring = async () => {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setCameraStream(camStream);
        cameraStreamRef.current = camStream;

        const scrStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        setScreenStream(scrStream);
        screenStreamRef.current = scrStream;
      } catch (err) {
        console.error("Proctoring setup failed:", err);
        setError("Camera and screen sharing are required to start the quiz. Please allow permissions and refresh.");
      }
    };
    startProctoring();

    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!user) {
        navigate(`/exam/${quizId}`, { replace: true });
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:8000/api/quizzes/public/${quizId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const quizData = res.data;
        setQuiz(quizData);
        setTimeLeft(quizData.durationInMinutes * 60 || 3600);
        setAnswers(
          Array(quizData.questions.length).fill({
            answer: null,
            status: "unanswered",
          })
        );
      } catch (err) {
        setError("Failed to load the quiz. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, user, navigate]);

  const handleSubmit = () => {
    console.log("Submitting answers:", answers);
    navigate(`/quiz/${quizId}/results`, { replace: true });
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

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
    if (index >= 0 && index < quiz.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleMarkForReview = () => {
    const newAnswers = [...answers];
    const currentStatus = newAnswers[currentQuestionIndex].status;
    
    newAnswers[currentQuestionIndex].status = currentStatus === "review" || currentStatus === "answered-review" 
      ? (newAnswers[currentQuestionIndex].answer !== null ? "answered" : "unanswered")
      : (newAnswers[currentQuestionIndex].answer !== null ? "answered-review" : "review");
      
    setAnswers(newAnswers);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading Quiz...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500 p-8 text-center">{error}</div>;
  }
  if (!quiz) {
    return null;
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "answered": return "bg-green-600 text-white";
      case "unanswered": return "bg-gray-300 text-gray-800";
      case "review": return "bg-yellow-500 text-white";
      case "answered-review": return "bg-purple-600 text-white";
      default: return "bg-gray-300 text-gray-800";
    }
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-1/4 bg-white border-r border-gray-200 flex flex-col p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-8 w-8 text-red-500" />
          <h1 className="text-xl font-bold text-gray-800">ProctorX</h1>
        </div>
        <ProctoringFeed stream={cameraStream} type="camera" />
        <ProctoringFeed stream={screenStream} type="screen" />
        <div className="flex-1 overflow-y-auto border-t pt-4">
          <h2 className="font-semibold mb-3 text-gray-700">Question Palette</h2>
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => handleQuestionNavigation(index)}
                className={`h-10 w-10 rounded-md font-bold text-sm transition-transform duration-150 flex items-center justify-center
                  ${getStatusColor(answers[index]?.status)}
                  ${currentQuestionIndex === index ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col p-8">
        <header className="flex justify-between items-center pb-4 border-b mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{quiz.title}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-red-600 font-semibold">
              <Clock className="h-6 w-6" />
              <span className="text-xl">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-md"
            >
              Submit Assignment
            </button>
          </div>
        </header>

        <div className="flex-1">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </h3>
          </div>
          <p className="text-xl text-gray-700 mb-6">{currentQuestion.questionText}</p>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200
                  ${answers[currentQuestionIndex]?.answer === index
                    ? "bg-blue-100 border-blue-500 ring-2 ring-blue-300"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  checked={answers[currentQuestionIndex]?.answer === index}
                  onChange={() => handleAnswerChange(index)}
                  className="h-5 w-5 mr-4 accent-blue-600"
                />
                <span className="text-gray-800">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <footer className="flex justify-between items-center mt-6 pt-6 border-t">
          <button
            onClick={handleMarkForReview}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition"
          >
            <Bookmark size={16} />
            <span>Mark for Review</span>
          </button>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleQuestionNavigation(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="px-5 py-2 flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => handleQuestionNavigation(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === quiz.questions.length - 1}
              className="px-8 py-2 flex items-center space-x-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition shadow disabled:opacity-50"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default QuizAnsweringPage;

