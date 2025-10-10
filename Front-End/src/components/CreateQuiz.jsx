import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaQuestionCircle, FaCheckCircle } from "react-icons/fa";

function CreateQuiz() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    allowedStudents: 0,
    questions: [{ questionText: "", options: ["", "", "", ""], correctAnswer: null }],
  });

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

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { questionText: "", options: ["", "", "", ""], correctAnswer: null },
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
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:8000/api/quizzes/create", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Quiz created successfully!");
      navigate("/staff-dashboard");
    } catch (err) {
      console.error("Error creating quiz:", err.response?.data || err);
      alert("❌ Failed to create quiz");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-900 via-slate-950 to-black p-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl bg-white/10 backdrop-blur-xl p-10 rounded-2xl shadow-xl border border-white/20 space-y-8"
      >
        <h1 className="text-3xl font-bold text-center text-slate-100">
          Create a New Quiz
        </h1>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quiz Title
          </label>
          <input
            type="text"
            name="title"
            placeholder="Enter quiz title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Allowed Students
          </label>
          <input
            type="number"
            name="allowedStudents"
            placeholder="Enter number of students"
            value={formData.allowedStudents}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <FaQuestionCircle /> Questions
          </h2>

          {formData.questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="p-6 rounded-xl bg-white/5 border border-white/10 shadow-md space-y-4"
            >
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">
                  Question {qIndex + 1}
                </label>
                {formData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-400 hover:text-red-500 transition"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Enter your question"
                value={q.questionText}
                onChange={(e) =>
                  handleQuestionChange(qIndex, "questionText", e.target.value)
                }
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="grid grid-cols-2 gap-4">
                {q.options.map((opt, optIndex) => (
                  <input
                    key={optIndex}
                    type="text"
                    placeholder={`Option ${optIndex + 1}`}
                    value={opt}
                    onChange={(e) =>
                      handleOptionChange(qIndex, optIndex, e.target.value)
                    }
                    className="p-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ))}
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Correct Answer
                </label>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {q.options.map((opt, optIndex) => (
                    <label key={optIndex} className="flex items-center space-x-2 text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name={`correct-answer-${qIndex}`}
                        value={optIndex}
                        checked={q.correctAnswer === optIndex}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, "correctAnswer", parseInt(e.target.value))
                        }
                        className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-500 focus:ring-indigo-500"
                      />
                      <span>Option {optIndex + 1}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-500 transition shadow"
          >
            <FaPlus /> Add Question
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-500 transition flex items-center justify-center gap-2 shadow"
        >
          <FaCheckCircle /> Create Quiz
        </button>
      </form>
    </div>
  );
}

export default CreateQuiz;