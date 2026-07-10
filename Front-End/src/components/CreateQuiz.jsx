import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaTrash,
  FaQuestionCircle,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaCode,
  FaFileAlt,
  FaListUl,
  FaCalendarAlt,
  FaUsers,
  FaBookOpen,
  FaTrophy,
} from "react-icons/fa";
import api from "../lib/api";
import toast from "react-hot-toast";

function CreateQuiz() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  
  const defaultQuestions = [
    // 5 MCQs
    ...Array(5).fill().map((_, i) => ({
      questionText: "",
      questionType: "mcq",
      options: ["", "", "", ""],
      correctAns: null,
      descriptiveAnswer: "",
      testcases: [{ input: "", output: "" }],
      starterCode: { python: "", javascript: "", java: "", cpp: "" },
      marks: 1,
    })),
    // 2 Descriptive
    ...Array(2).fill().map((_, i) => ({
      questionText: "",
      questionType: "descriptive",
      options: ["", "", "", ""],
      correctAns: null,
      descriptiveAnswer: "",
      testcases: [{ input: "", output: "" }],
      starterCode: { python: "", javascript: "", java: "", cpp: "" },
      marks: 5,
    })),
    // 1 Coding
    {
      questionText: "",
      questionType: "coding",
      options: ["", "", "", ""],
      correctAns: null,
      descriptiveAnswer: "",
      testcases: [{ input: "", output: "" }],
      starterCode: { python: "", javascript: "", java: "", cpp: "" },
      marks: 10,
    }
  ];

  const [formData, setFormData] = useState({
    title: "",
    durationInMinutes: 60,
    classroomId: "",
    allowedStudentsRaw: "",
    scheduledAt: "",
    autoStart: true,
    questions: defaultQuestions,
  });

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await api.get("/api/classrooms");
        setClassrooms(res.data);
      } catch (err) {
        console.error("Failed to load classrooms:", err);
      }
    };
    fetchClassrooms();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[optIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleTestcaseChange = (qIndex, tIndex, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].testcases[tIndex][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const addTestcase = (qIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].testcases.push({ input: "", output: "" });
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeTestcase = (qIndex, tIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].testcases.splice(tIndex, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleStarterCodeChange = (qIndex, lang, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].starterCode[lang] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const addQuestion = (type = "mcq") => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          questionText: "",
          questionType: type,
          options: type === "mcq" ? ["", "", "", ""] : [],
          correctAns: type === "mcq" ? null : 0,
          descriptiveAnswer: "",
          testcases: type === "coding" ? [{ input: "", output: "" }] : [],
          starterCode: { python: "", javascript: "", java: "", cpp: "" },
          marks: type === "mcq" ? 1 : type === "descriptive" ? 5 : 10,
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allowedStudents = formData.allowedStudentsRaw
      ? formData.allowedStudentsRaw
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email !== "")
      : [];

    if (!formData.title) {
      return toast.error("Quiz title is required");
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.questionText) {
        return toast.error(`Question ${i + 1} text is empty`);
      }

      if (q.questionType === "mcq") {
        if (q.options.some((o) => !o.trim())) {
          return toast.error(`Please fill all options for MCQ Question ${i + 1}`);
        }
        if (q.correctAns === null) {
          return toast.error(`Please select the correct option for MCQ Question ${i + 1}`);
        }
      } else if (q.questionType === "descriptive") {
        if (!q.descriptiveAnswer?.trim()) {
          return toast.error(`Expected answer is empty for descriptive Question ${i + 1}`);
        }
      } else if (q.questionType === "coding") {
        if (q.testcases.some((tc) => !tc.input.trim() || !tc.output.trim())) {
          return toast.error(`Please complete all test cases for programming Question ${i + 1}`);
        }
      }
    }

    const formattedQuestions = formData.questions.map((q, idx) => {
      const base = {
        questionText: q.questionText,
        questionType: q.questionType,
        marks: parseInt(q.marks || 1, 10),
        order: idx,
      };

      if (q.questionType === "mcq") {
        base.options = q.options;
        base.correctAns = q.correctAns;
      } else if (q.questionType === "descriptive") {
        base.descriptiveAnswer = q.descriptiveAnswer;
        base.options = [];
        base.correctAns = 0;
      } else if (q.questionType === "coding") {
        base.testcases = q.testcases;
        base.starterCode = q.starterCode;
        base.options = [];
        base.correctAns = 0;
      }

      return base;
    });

    const payload = {
      title: formData.title,
      durationInMinutes: parseInt(formData.durationInMinutes, 10),
      allowedStudents,
      classroomId: formData.classroomId || null,
      scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null,
      autoStart: formData.autoStart,
      questions: formattedQuestions,
    };

    try {
      await api.post("/api/quizzes", payload);
      toast.success("Quiz created successfully!");
      navigate("/staff-dashboard");
    } catch (err) {
      console.error("Error creating quiz:", err.response?.data || err);
      toast.error(err.response?.data?.message || "Failed to create quiz");
    }
  };

  // Helper Metrics
  const totalQuestions = formData.questions.length;
  const mcqCount = formData.questions.filter(q => q.questionType === "mcq").length;
  const descriptiveCount = formData.questions.filter(q => q.questionType === "descriptive").length;
  const codingCount = formData.questions.filter(q => q.questionType === "coding").length;
  const totalMarks = formData.questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

  const durationPresets = [15, 30, 45, 60, 90, 120];

  return (
    <div 
      className="h-screen w-screen flex flex-col bg-white text-black font-sans overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Inject custom light scrollbar styles to avoid the dark webkit scrollbar track from global CSS */}
      <style>{`
        .light-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .light-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .light-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1) !important;
          border-radius: 9999px !important;
        }
        .light-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>

      <form onSubmit={handleSubmit} className="flex flex-col h-full w-full">
        
        {/* Top Header Panel */}
        <div className="h-[72px] border-b border-gray-200 px-6 md:px-10 flex items-center justify-between shrink-0 bg-white shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold">
              PX
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">Quiz Creator</h1>
              <p className="text-gray-500 text-xs mt-1">Design premium assessments & dynamic tests</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live Stats */}
            <div className="hidden lg:flex items-center gap-5 mr-6 border-r border-gray-200 pr-6 text-xs text-gray-600 font-bold">
              <span className="flex items-center gap-1.5">
                <FaBookOpen className="text-gray-400" /> {totalQuestions} Questions
              </span>
              <span className="flex items-center gap-1.5">
                <FaTrophy className="text-gray-400" /> {totalMarks} Total Marks
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/staff-dashboard")}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-lg transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-black hover:bg-gray-900 text-white font-bold rounded-lg transition-all flex items-center gap-2 text-xs"
            >
              <FaCheckCircle className="w-3.5 h-3.5" /> Create Quiz
            </button>
          </div>
        </div>

        {/* Double-Panel Workspace Layout (Borderless Separation + Transparent Scrollbar) */}
        <div className="flex flex-1 overflow-hidden w-full">
          
          {/* LEFT PANEL: Sleek Configuration Dashboard */}
          <div className="w-[380px] md:w-[420px] shrink-0 bg-[#fbfbfc] p-6 overflow-y-auto light-scrollbar space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Category: General details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                  General details
                </div>

                {/* Quiz Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g. Midterm Physics Exam"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-xs"
                  />
                </div>

                {/* Duration & Presets */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <FaClock className="text-gray-400" />
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="durationInMinutes"
                    placeholder="60"
                    value={formData.durationInMinutes}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-xs"
                  />
                  {/* Preset helpers */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {durationPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, durationInMinutes: preset })}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                          formData.durationInMinutes === preset
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-500 border-gray-200 hover:text-black hover:border-gray-300"
                        }`}
                      >
                        {preset}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category: Scheduling */}
              <div className="space-y-4 pt-4 border-t border-gray-200/60">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                  Scheduling
                </div>

                {/* Date & Time */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <FaCalendarAlt className="text-gray-400" /> Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={formData.scheduledAt}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-xs"
                  />
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Leave blank to launch manually whenever you click "Go Live".
                  </p>
                </div>

                {/* Auto Start Switch */}
                <div 
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    formData.autoStart 
                      ? 'bg-black border-black text-white shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({ ...formData, autoStart: !formData.autoStart })}
                >
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold block">Automated Startup</span>
                    <span className={`text-[9px] block ${formData.autoStart ? 'text-gray-300' : 'text-gray-500'}`}>
                      Starts automatically & creates OTP
                    </span>
                  </div>
                  <div className={`w-8 h-4.5 rounded-full transition-all relative p-0.5 ${formData.autoStart ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-all shadow-sm ${formData.autoStart ? 'right-[2px]' : 'left-[2px]'}`} />
                  </div>
                </div>
              </div>

              {/* Category: Access Control */}
              <div className="space-y-4 pt-4 border-t border-gray-200/60">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                  Access control
                </div>

                {/* Classroom */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <FaUsers className="text-gray-400" /> Classroom Restrict
                  </label>
                  <select
                    name="classroomId"
                    value={formData.classroomId}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-xs"
                  >
                    <option value="">No Classroom Restriction (Public)</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Allowed Students */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <FaEnvelope className="text-gray-400" /> Allowed Student Emails
                  </label>
                  <textarea
                    name="allowedStudentsRaw"
                    rows="3"
                    placeholder="student1@univ.edu, student2@univ.edu"
                    value={formData.allowedStudentsRaw}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-xs font-medium"
                  />
                  <p className="text-[10px] text-gray-500">
                    If empty, anyone who has the generated OTP can join.
                  </p>
                </div>
              </div>

            </div>

            {/* Quick Summary card inside Sidebar */}
            <div className="mt-8 bg-white border border-gray-200 rounded-xl p-4 space-y-2.5 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Assessment blueprint</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="text-gray-500 font-medium">MCQ Count</div>
                  <div className="text-base font-extrabold mt-0.5">{mcqCount}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="text-gray-500 font-medium">Descriptive</div>
                  <div className="text-base font-extrabold mt-0.5">{descriptiveCount}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="text-gray-500 font-medium">Programming</div>
                  <div className="text-base font-extrabold mt-0.5">{codingCount}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="text-gray-500 font-medium">Total Marks</div>
                  <div className="text-base font-extrabold mt-0.5">{totalMarks}</div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Scrollable Dynamic Workspace */}
          <div className="flex-1 bg-white p-6 md:p-10 overflow-y-auto light-scrollbar space-y-6">
            
            {/* Top Info Bar */}
            <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                  <FaQuestionCircle className="text-black" /> Questions Workspace
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Customize and build questions of varying types.</p>
              </div>
              
              {/* Filter / Jump tags */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 font-bold rounded-lg flex items-center gap-1">
                  <FaListUl className="w-3 h-3" /> {mcqCount} MCQ
                </span>
                <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg flex items-center gap-1">
                  <FaFileAlt className="w-3 h-3" /> {descriptiveCount} Desc
                </span>
                <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-lg flex items-center gap-1">
                  <FaCode className="w-3 h-3" /> {codingCount} Coding
                </span>
              </div>
            </div>

            {/* Questions Mapping */}
            <div className="space-y-8">
              {formData.questions.map((q, qIndex) => (
                <div key={qIndex} className="p-6 md:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6 transition-all hover:shadow-md relative overflow-hidden">

                  {/* Header row: Question index label, Type pills, Marks, Delete */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <span className="text-xs font-extrabold text-black uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-md">
                      Question {qIndex + 1}
                    </span>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Premium Segmented Selector */}
                      <div className="flex items-center gap-0.5 bg-gray-100 border border-gray-200 p-0.5 rounded-lg">
                        {[
                          { type: "mcq", label: "MCQ", icon: FaListUl },
                          { type: "descriptive", label: "Descriptive", icon: FaFileAlt },
                          { type: "coding", label: "Coding", icon: FaCode },
                        ].map((btn) => {
                          const Icon = btn.icon;
                          const isActive = q.questionType === btn.type;
                          return (
                            <button
                              key={btn.type}
                              type="button"
                              onClick={() => handleQuestionChange(qIndex, "questionType", btn.type)}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                                isActive
                                  ? "bg-white text-black shadow-sm border border-gray-200"
                                  : "text-gray-500 hover:text-black hover:bg-gray-200"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" /> {btn.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Marks Input */}
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        <span className="text-xs font-bold text-gray-500">Marks:</span>
                        <input
                          type="number"
                          value={q.marks || 1}
                          onChange={(e) => handleQuestionChange(qIndex, "marks", parseInt(e.target.value, 10))}
                          className="w-12 p-0.5 bg-white border border-gray-300 text-black font-extrabold text-center focus:outline-none focus:border-black rounded text-xs"
                        />
                      </div>

                      {/* Remove Button */}
                      {formData.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Question Statement</label>
                    <input
                      type="text"
                      placeholder={
                        q.questionType === "coding"
                          ? "e.g. Write a program to merge two sorted lists."
                          : "Enter the question prompt or query..."
                      }
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)}
                      className="w-full px-3.5 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-all text-sm font-medium"
                    />
                  </div>

                  {/* Conditionally Render Content Blocks based on type */}
                  {q.questionType === "mcq" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {q.options.map((opt, optIndex) => {
                        const isCorrect = q.correctAns === optIndex;
                        return (
                          <div key={optIndex} className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleQuestionChange(qIndex, "correctAns", optIndex)}
                              className={`w-10 h-10 shrink-0 rounded-lg border-2 text-xs font-extrabold transition-all flex items-center justify-center ${
                                isCorrect
                                  ? "bg-green-500 border-green-500 text-white shadow"
                                  : "bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:text-black"
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}
                            </button>
                            <input
                              type="text"
                              placeholder={`Option ${optIndex + 1}`}
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              className={`w-full px-3.5 py-2.5 rounded-lg border focus:outline-none transition-all text-xs font-medium ${
                                isCorrect
                                  ? "bg-green-50 border-green-200 text-green-900 focus:ring-1 focus:ring-green-500"
                                  : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-1 focus:ring-black focus:bg-white"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.questionType === "descriptive" && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Suggested Reference / Answer Key Description</label>
                      <textarea
                        rows="3"
                        placeholder="Define the correct expected answer or keywords for evaluation..."
                        value={q.descriptiveAnswer}
                        onChange={(e) => handleQuestionChange(qIndex, "descriptiveAnswer", e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all text-xs leading-relaxed"
                      />
                    </div>
                  )}

                  {q.questionType === "coding" && (
                    <div className="space-y-6 pt-2">
                      {/* Code Editors templates */}
                      <div className="space-y-3">
                        <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Starter Templates (Optional)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {["python", "javascript", "java", "cpp"].map((lang) => (
                            <div key={lang}>
                              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                                {lang} Starter Code
                              </label>
                              <textarea
                                rows="3"
                                placeholder={`e.g. def solution():\n  pass`}
                                value={q.starterCode[lang]}
                                onChange={(e) => handleStarterCodeChange(qIndex, lang, e.target.value)}
                                className="w-full p-2.5 rounded bg-gray-900 border border-gray-800 text-gray-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Test cases side-by-side */}
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Test Cases Setup</span>
                          <button
                            type="button"
                            onClick={() => addTestcase(qIndex)}
                            className="text-xs text-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded font-bold border border-gray-200 transition-all"
                          >
                            + Add Test Case
                          </button>
                        </div>

                        <div className="space-y-3">
                          {q.testcases.map((tc, tcIndex) => (
                            <div
                              key={tcIndex}
                              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-start bg-gray-50 p-4 border border-gray-200 rounded-lg"
                            >
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase">
                                  Input
                                </label>
                                <textarea
                                  rows="2"
                                  placeholder="Standard input"
                                  value={tc.input}
                                  onChange={(e) => handleTestcaseChange(qIndex, tcIndex, "input", e.target.value)}
                                  className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900 font-mono text-xs focus:outline-none focus:border-black"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase">
                                  Expected Output
                                </label>
                                <textarea
                                  rows="2"
                                  placeholder="Expected output"
                                  value={tc.output}
                                  onChange={(e) => handleTestcaseChange(qIndex, tcIndex, "output", e.target.value)}
                                  className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900 font-mono text-xs focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                />
                              </div>
                              {q.testcases.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeTestcase(qIndex, tcIndex)}
                                  className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded border border-red-100 mt-6 transition-colors"
                                >
                                  <FaTrash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* Premium Add Question Options */}
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-4">
              <span className="text-xs font-bold text-gray-500 block uppercase tracking-wide">Add a new question to the assessment</span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => addQuestion("mcq")}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <FaPlus className="w-2.5 h-2.5" /> MCQ Question
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("descriptive")}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <FaPlus className="w-2.5 h-2.5" /> Descriptive Question
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion("coding")}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <FaPlus className="w-2.5 h-2.5" /> Coding Question
                </button>
              </div>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}

export default CreateQuiz;