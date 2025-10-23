// src/components/QuizAttemptPage.jsx
import React from 'react';
import { 
  FiClock, 
  FiVideo, 
  FiAlertCircle, 
  FiFileText, 
  FiTrash2, 
  FiChevronLeft, 
  FiChevronRight, 
  FiTarget 
} from 'react-icons/fi';

// --- Main Page Component ---
const QuizAttemptPage = () => {
  return (
    <div className="flex flex-col h-screen font-sans bg-gray-50">
      <QuizHeader />
      <div className="flex flex-1 overflow-hidden">
        <QuizSidebar />
        <QuizMainContent />
      </div>
    </div>
  );
};

// --- 1. Header Component ---
const QuizHeader = () => (
  <header className="flex items-center justify-between flex-shrink-0 px-6 py-3 bg-white border-b border-gray-200">
    <div>
      <h1 className="text-lg font-semibold text-gray-800">
        Simulated Work | Project Sprint CA #1 | Coding with AI
      </h1>
    </div>
    <div className="flex items-center space-x-4">
      <div className="flex items-center font-medium text-red-600">
        <FiClock className="mr-1.5" size={18} />
        <span>17m left</span>
      </div>
      <button className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
        Finish Assessment
      </button>
    </div>
  </header>
);

// --- 2. Left Sidebar Component ---
const QuizSidebar = () => (
  <aside className="w-64 p-4 overflow-y-auto bg-white border-r border-gray-200">
    {/* Proctoring Box */}
    <div className="p-3 mb-5 border border-gray-200 rounded-lg">
      <div className="flex items-start mb-2 text-xs text-yellow-700">
        <FiAlertCircle className="mr-2 shrink-0" size={16} />
        <span>Your camera feed, audio and screen are being proctored.</span>
      </div>
      <div className="relative w-full h-32 bg-gray-900 rounded-md">
        {/* Placeholder for camera feed */}
        <img 
          src="https://i.imgur.com/gA8Jg9s.png" // Static placeholder image from your screenshot
          alt="Camera Feed" 
          className="object-cover w-full h-full rounded-md opacity-70" 
        />
        <div className="absolute flex items-center justify-center w-full h-full top-0 left-0">
            <span className="text-sm text-white opacity-50">Camera Feed</span>
        </div>
      </div>
    </div>

    {/* Instructions */}
    <div className="flex items-center p-3 mb-5 text-sm font-medium text-gray-700 rounded-lg cursor-pointer hover:bg-gray-100">
      <FiFileText className="mr-3" size={18} />
      <span>Instructions</span>
    </div>

    {/* Question Palette */}
    <div className="grid grid-cols-5 gap-2">
      {/* Simulating the exact state from your image */}
      {/* Questions 1-21 (Visited) */}
      {Array.from({ length: 21 }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
            num === 13 
              ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1' 
              : 'bg-blue-600 text-white opacity-90 hover:opacity-100'
          }`}
        >
          {num}
        </button>
      ))}
      
      {/* Questions 22-25 (Not Visited) */}
      {Array.from({ length: 4 }, (_, i) => i + 22).map((num) => (
        <button
          key={num}
          className="flex items-center justify-center w-10 h-10 text-sm font-medium bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200"
        >
          {num}
        </button>
      ))}
    </div>
  </aside>
);

// --- 3. Main Content Area ---
const QuizMainContent = () => {
  const options = [
    "Should I ignore keyboard focus?",
    "Remove hover styles?",
    "Add focus styles that mirror hover and use semantic buttons for accessibility?",
    "Hide outlines to match hover?"
  ];
  
  // Static: 3rd option is selected (index 2)
  const selectedOption = 2; 

  return (
    <main className="relative flex-1 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Top Bar: Mark for review & Score */}
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 mr-2 border-gray-300 rounded text-blue-600 focus:ring-blue-500" />
            Mark for review
          </label>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-xs font-bold text-green-700 bg-green-100 rounded-full">+1</span>
            <span className="px-2 py-0.5 text-xs font-bold text-red-700 bg-red-100 rounded-full">0</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-gray-500">
            Question 13 of 25
          </h2>
          <p className="mb-4 text-lg text-gray-900">
            Hover effect exists, but keyboard users have no cue when tabbing.
          </p>
          <p className="mb-6 text-base text-gray-700">
            Which prompt fits best if we use it in GitHub Copilot?
          </p>

          {/* Options List */}
          <div className="space-y-4">
            {options.map((option, index) => (
              <label
                key={index}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedOption === index
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="quiz-option"
                  className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  checked={selectedOption === index}
                  readOnly // This makes it static
                />
                <span className="ml-3 text-base text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between mt-6">
          <button className="flex items-center text-sm font-medium text-gray-600 hover:text-red-600">
            <FiTrash2 className="mr-1.5" />
            Clear Response
          </button>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <FiChevronLeft className="mr-1" size={16} />
              Previous
            </button>
            <button className="flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Next
              <FiChevronRight className="ml-1" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button (from image) */}
      <button className="absolute right-8 bottom-8 p-3 text-red-600 bg-white border border-gray-300 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500">
        <FiTarget size={24} />
      </button>
    </main>
  );
};

export default QuizAttemptPage;