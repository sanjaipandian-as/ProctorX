import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Clock,
  Camera,
  ScreenShare,
  GraduationCap,
  ScanEye,
  Eraser,
  X,
} from "lucide-react";
import { GrStatusInfo } from "react-icons/gr";
import { motion, AnimatePresence } from "framer-motion";


const ProctoringFeed = ({ type }) => (
  <div className="bg-gray-200 rounded-lg aspect-video w-full flex items-center justify-center text-gray-500 relative">
    {type === "camera" ? <Camera size={32} /> : <ScreenShare size={32} />}
    <span className="absolute bottom-2 text-xs font-semibold text-gray-700">
      {type === "camera" ? "Camera Feed" : "Screen Share"}
    </span>
  </div>
);

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
          {/* <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Instructions</h2>
            
          </div> */}

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
                  <p className="text-sm font-medium text-gray-500">Total questions</p>
                  <p className="text-lg font-semibold text-gray-800">25</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Max. Duration</p>
                  <p className="text-lg font-semibold text-gray-800">30m</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Proctoring</p>
                  <p className="text-lg font-semibold text-gray-800">Remote</p>
                </div>
              </div>
            </div>
            <section>
              <h3 className="text-3xl font-bold mb-4 text-gray-900">Instructions</h3>
              <p className="text-lg mb-4 text-gray-600">
                Please keep a note of the below instructions.
              </p>
              <ul className="list-disc list-inside space-y-2 text-md">
                <li>This assessment can be attempted only ONCE. Hence, please ensure you are seated in a distraction-free environment.</li>
                <li>Please ensure you are connected to a strong wifi/ethernet network.</li>
                <li>In case of internet discrepancies, your timer will still keep running. However, you can continue attempting the current question.</li>
                <li>The security code will be provided by the invigilator at your venue.</li>
                <li>In case of any technical difficulties, please reach out to the invigilator.</li>
                <li>Give your best. Good luck!</li>
              </ul>
            </section>
            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Marking Scheme</h3>
              <p className="text-md mb-3 text-gray-600">
                Refer to the top right of each question for the marks awarded for a correct answer or deducted for an incorrect answer as shown below.
              </p>
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-700 text-md font-semibold px-2 py-0.5 rounded-md mr-2">+X</span>
                  <span className="text-md italic text-gray-800">Correct</span>
                </div>
                <div className="flex items-center">
                  <span className="bg-red-100 text-red-700 text-md font-semibold px-2 py-0.5 rounded-md mr-2">-Y</span>
                  <span className="text-md italic text-gray-800">Incorrect</span>
                </div>
              </div>
            </section>
            <section>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Question Palette</h3>
              <p className="text-md mb-3 text-gray-600">
                The question palette displayed on the left side of the assessment screen will show the following statuses depicted by distinct symbols.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-blue-600 text-white rounded-md">1</span>
                  <span className="text-md">Answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-gray-200 text-gray-700 border border-gray-400 rounded-md">2</span>
                  <span className="text-md">Unanswered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-yellow-500 text-white rounded-md">5</span>
                  <span className="text-md">Marked for review but answered</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center h-8 w-8 font-bold bg-yellow-500 text-white rounded-md">13</span>
                  <span className="text-md">Marked for review but unanswered</span>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const QuizAttemptPage = ({ quiz }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState((quiz?.questions || []).map(() => null));
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  const defaultQuestion = {
    questionText: "Question will appear here. Please load a quiz.",
    options: ["Option 1", "Option 2", "Option 3", "Option 4"],
  };

  const defaultQuiz = {
    questions: [defaultQuestion],
  };

  const currentQuiz = quiz || defaultQuiz;
  const currentQuestion = currentQuiz.questions[currentQuestionIndex] || defaultQuestion;

  const handleAnswerChange = (index) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = index;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const questionsForPalette =
    currentQuiz.questions.length > 1 ? currentQuiz.questions : [1, 2, 3, 4];

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans">
      <InstructionsModal isOpen={isInstructionsOpen} onClose={() => setIsInstructionsOpen(false)} />

      <header className="flex items-stretch justify-between flex-shrink-0 px-0 bg-white">
        <div className="flex items-center py-3">
          <GraduationCap className="h-8 pl-5 w-12 text-red-900" />
          <h1 className="text-lg font-bold pl-2 text-gray-800">
            Simulated Work | Project Sprint CA #1 | Coding with AI
          </h1>
        </div>

        <div className="flex items-stretch pb-0 space-x-6">
          <div className="flex items-center font-medium text-black-600">
            <Clock className="mr-1 mt-0.3" size={18} />
            <span>17m left</span>
          </div>

          <button className="px-12 text-md font-medium text-white bg-gray-900 hover:bg-black-700 focus:outline-none focus:ring-2 focus:ring-black-500 focus:ring-opacity-50">
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
              <span>Your camera feed, audio and screen are being proctored.</span>
            </div>
            <div className="flex items-center space-x-2 mt-2 w-full">
              <ProctoringFeed type="camera" />
              <ProctoringFeed type="screen" />
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
              {questionsForPalette.map((_, idx) => {
                const isActive = currentQuestionIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-14 w-14 font-bold flex items-center justify-center transition-all duration-300 rounded-md ${isActive ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col pt-2 overflow-hidden">
          <main className="flex-1 flex flex-col pl-34 pt-16 overflow-y-auto">
            <div className="flex justify-between items-center">
              <button className="flex items-center space-x-2 py-5 cursor-pointer text-gray-800 rounded font-medium">
                <Bookmark size={16} />
                <span>Mark for Review</span>
              </button>
              <div className="flex items-center mr-40 space-x-0">
                <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-0.5">+1</span>
                <span className="bg-red-100 text-red-700 text-sm font-semibold px-3 py-0.5">0</span>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4 mt-5 text-gray-500">
                Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
              </h3>
              <p className="text-2xl font-bold mb-6 text-gray-900">{currentQuestion.questionText}</p>
              <hr className="w-6/7" />

              <div className="space-y-6 pt-5">
                {currentQuestion.options.map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center p-4 border-3 cursor-pointer transition-colors w-full max-w-md h-14 ${answers[currentQuestionIndex] === idx
                      ? "bg-blue-50 border-blue-600"
                      : "bg-gray-100 border-gray-500 hover:bg-gray-200"
                      }`}
                  >
                    <input
                      type="radio"
                      checked={answers[currentQuestionIndex] === idx}
                      onChange={() => handleAnswerChange(idx)}
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
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className="px-5 py-2 flex items-center space-x-2 cursor-pointer rounded font-medium disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === currentQuiz.questions.length - 1}
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
};

export default QuizAttemptPage;
