import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Home,
  LogOut,
  Upload,
  Download,
  HelpCircle,
  Loader2,
  CheckCircle
} from "lucide-react";
import API from "../../Api";
import Logo from "../assets/LOGO.png";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed top-20 right-5 z-[100] px-4 py-2 rounded-xl shadow text-sm font-medium ${type === "success" ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"}`}
    >
      {message}
      <button onClick={onClose} className="ml-3 text-lg font-bold">×</button>
    </div>
  );
}

function HelpModal({ onClose, content }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full m-4">
        <div className="flex justify-between p-4 border-b border-gray-700">
          <h3 className="text-white flex items-center gap-2 text-lg font-semibold">
            <HelpCircle className="text-cyan-500" /> CSV Formatting Help
          </h3>
          <button className="text-gray-400 hover:text-white text-2xl" onClick={onClose}>×</button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <pre className="bg-gray-800 p-4 rounded text-gray-200 text-sm whitespace-pre-wrap font-mono">{content}</pre>
        </div>
        <div className="p-4 bg-gray-800/50 border-t border-gray-700 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-cyan-600 text-white rounded font-semibold">Got it</button>
        </div>
      </div>
    </div>
  );
}

const helpPromptText = `CSV rules:
Headers must be exactly:
questionType,questionText,option1,option2,option3,option4,correctAnswerIndex,marks
questionType = mcq | descriptive | coding
For descriptive rows leave option1..option4 and correctAnswerIndex empty
For coding rows leave option1..option4 and correctAnswerIndex empty; coding testcases must be added in UI after import
Every row must have 8 columns
All text in double quotes if it contains commas
Marks must be a positive number`;

// --- 1. DEFINE DEFAULT BOILERPLATE CODE HERE ---
const defaultCode = {
  javascript: `// Javascript Starter Code
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');

function solve() {
    // Write your code here
    
}
solve();`,

  python: `# Python Starter Code
import sys

def solve():
    # Read input
    data = sys.stdin.read().split()
    # Write logic here

if __name__ == "__main__":
    solve()`,

  java: `// Java Starter Code
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your code here
        
    }
}`,

  cpp: `// C++ Starter Code
#include <cmath>
#include <cstdio>
#include <vector>
#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    // Enter your code below
    
    return 0;
}`
};

export default function CreateQuiz() {
  const navigate = useNavigate();
  // Only allowing these 4 languages
  const languages = ["javascript", "python", "java", "cpp"];

  const [formData, setFormData] = useState({
    title: "",
    allowedStudents: 0,
    questions: [
      {
        questionType: "mcq",
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        marks: 1,
        descriptiveAnswer: "",
        // --- 2. USE DEFAULT CODE IN INITIAL STATE ---
        starterCode: { ...defaultCode },
        testcases: Array.from({ length: 8 }, () => ({ input: "", output: "" }))
      }
    ]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const closeToast = () => setToast(null);

  useEffect(() => {
    return () => {};
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    showToast("Logged out.");
    setTimeout(() => navigate("/login"), 1000);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const handleQuestionField = (index, field, value) => {
    setFormData(prev => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], [field]: value };
      
      if (field === "questionType") {
        if (value === "mcq" && !Array.isArray(questions[index].options)) questions[index].options = ["", "", "", ""];
        
        if (value === "coding") {
            // --- 3. USE DEFAULT CODE WHEN SWITCHING TO CODING ---
            // If starterCode is missing or empty, fill it with the defaults
            if (!questions[index].starterCode || Object.keys(questions[index].starterCode).length === 0) {
                questions[index].starterCode = { ...defaultCode };
            }
            if (!Array.isArray(questions[index].testcases)) questions[index].testcases = Array.from({ length: 8 }, () => ({ input: "", output: "" }));
        }
      }
      if (field === "marks") questions[index].marks = Number(value);
      return { ...prev, questions };
    });
  };

  const handleStarterCodeChange = (qIndex, lang, code) => {
    setFormData(prev => {
        const questions = [...prev.questions];
        questions[qIndex] = {
            ...questions[qIndex],
            starterCode: {
                ...questions[qIndex].starterCode,
                [lang]: code
            }
        };
        return { ...prev, questions };
    });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    setFormData(prev => {
      const questions = [...prev.questions];
      if (!Array.isArray(questions[qIndex].options)) questions[qIndex].options = ["", "", "", ""];
      questions[qIndex].options[oIndex] = value;
      return { ...prev, questions };
    });
  };

  const handleTestcaseChange = (qIndex, tcIndex, field, value) => {
    setFormData(prev => {
      const questions = [...prev.questions];
      if (!Array.isArray(questions[qIndex].testcases)) questions[qIndex].testcases = Array.from({ length: 8 }, () => ({ input: "", output: "" }));
      const tcs = [...questions[qIndex].testcases];
      tcs[tcIndex] = { ...tcs[tcIndex], [field]: value };
      questions[qIndex].testcases = tcs;
      return { ...prev, questions };
    });
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionType: "mcq",
          questionText: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
          marks: 1,
          descriptiveAnswer: "",
          // --- 4. USE DEFAULT CODE FOR NEW QUESTIONS ---
          starterCode: { ...defaultCode },
          testcases: Array.from({ length: 8 }, () => ({ input: "", output: "" }))
        }
      ]
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => {
      if (prev.questions.length <= 1) {
        showToast("Quiz must have at least one question.", "error");
        return prev;
      }
      const questions = prev.questions.filter((_, i) => i !== index);
      return { ...prev, questions };
    });
  };

  const downloadTemplate = () => {
    const header = '"questionType","questionText","option1","option2","option3","option4","correctAnswerIndex","marks"\n';
    const example = '"mcq","What is 2+2?","1","2","4","3",2,2\n"descriptive","Explain photosynthesis","","","","",,5\n"coding","Sum two numbers","","","","",,4\n';
    const csv = "data:text/csv;charset=utf-8," + header + example;
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "quiz_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      showToast("Upload a CSV file.", "error");
      return;
    }
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = ev.target.result.split("\n").filter(r => r.trim() !== "");
        if (rows.length <= 1) throw new Error("CSV is empty or missing headers.");
        const headers = rows[0].split(",").map(h => h.replace(/"/g, "").trim());
        const expected = ["questionType","questionText","option1","option2","option3","option4","correctAnswerIndex","marks"];
        if (JSON.stringify(headers) !== JSON.stringify(expected)) throw new Error("CSV headers incorrect. Use template.");
        const newQuestions = [];
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(",").map(c => c.replace(/"/g, "").trim());
          if (cols.length !== 8) throw new Error(`Row ${i+1} must have 8 columns.`);
          const [questionType, questionText, o1, o2, o3, o4, correctStr, marksStr] = cols;
          const qType = questionType.toLowerCase();
          const marks = Number(marksStr) || 1;
          if (!["mcq","descriptive","coding"].includes(qType)) throw new Error(`Row ${i+1} invalid questionType.`);
          if (!questionText) throw new Error(`Row ${i+1} missing questionText.`);
          
          const baseQuestion = {
            questionText,
            marks,
            // --- 5. USE DEFAULT CODE FOR CSV IMPORTED QUESTIONS ---
            starterCode: { ...defaultCode },
            testcases: Array.from({ length: 8 }, () => ({ input: "", output: "" }))
          };

          if (qType === "mcq") {
            const correct = correctStr === "" ? 0 : Number(correctStr);
            if (isNaN(correct) || correct < 0 || correct > 3) throw new Error(`Row ${i+1} correctAnswerIndex must be 0-3.`);
            newQuestions.push({
              ...baseQuestion,
              questionType: "mcq",
              options: [o1 || "", o2 || "", o3 || "", o4 || ""],
              correctAnswer: correct,
              descriptiveAnswer: "",
            });
          } else if (qType === "descriptive") {
            newQuestions.push({
              ...baseQuestion,
              questionType: "descriptive",
              options: ["", "", "", ""],
              correctAnswer: null,
              descriptiveAnswer: "",
            });
          } else {
            newQuestions.push({
              ...baseQuestion,
              questionType: "coding",
              options: ["", "", "", ""],
              correctAnswer: null,
              descriptiveAnswer: "",
            });
          }
        }
        setFormData(prev => ({ ...prev, questions: newQuestions }));
        showToast(`Imported ${newQuestions.length} questions.`);
      } catch (err) {
        showToast(err.message || "Failed to parse CSV", "error");
      } finally {
        setIsParsing(false);
        e.target.value = null;
      }
    };
    reader.onerror = () => {
      showToast("Failed to read file.", "error");
      setIsParsing(false);
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const validateBeforeSubmit = () => {
    if (!formData.title || !formData.title.trim()) { showToast("Quiz title required.", "error"); return false; }
    if (!Array.isArray(formData.questions) || formData.questions.length === 0) { showToast("Add at least one question.", "error"); return false; }
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.questionText || !q.questionText.trim()) { showToast(`Question ${i+1} text required.`, "error"); return false; }
      if (!q.marks || isNaN(Number(q.marks)) || Number(q.marks) <= 0) { showToast(`Question ${i+1} must have positive marks.`, "error"); return false; }
      if (q.questionType === "mcq") {
        if (!Array.isArray(q.options) || q.options.length < 4 || q.options.some(o => !o || !o.toString().trim())) { showToast(`Question ${i+1} requires 4 non-empty options.`, "error"); return false; }
        if (typeof q.correctAnswer === "undefined" || q.correctAnswer === null || isNaN(Number(q.correctAnswer)) || Number(q.correctAnswer) < 0 || Number(q.correctAnswer) > 3) { showToast(`Question ${i+1} correct answer invalid.`, "error"); return false; }
      }
      if (q.questionType === "coding") {
        if (!Array.isArray(q.testcases) || q.testcases.length !== 8) { showToast(`Question ${i+1} must have 8 testcases.`, "error"); return false; }
      }
    }
    return true;
  };

  const submitQuiz = async (e) => {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: formData.title,
        allowedStudents: Number(formData.allowedStudents) || 0,
        questions: formData.questions.map(q => ({
          questionType: q.questionType,
          questionText: q.questionText,
          marks: Number(q.marks),
          options: q.questionType === "mcq" ? q.options.slice(0,4) : undefined,
          correctAnswer: q.questionType === "mcq" ? Number(q.correctAnswer) : undefined,
          descriptiveAnswer: q.questionType === "descriptive" ? (q.descriptiveAnswer || "") : undefined,
          // Send the starterCode object (contains code for all 4 languages)
          starterCode: q.questionType === "coding" ? q.starterCode : undefined,
          testcases: q.questionType === "coding" ? q.testcases.map(tc => ({ input: tc.input || "", output: tc.output || "" })) : undefined
        }))
      };
      await API.post("/api/quizzes/create", payload, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Quiz created!", "success");
      setTimeout(() => navigate("/staff-dashboard"), 1200);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create quiz", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      {showHelpModal && <HelpModal content={helpPromptText} onClose={() => setShowHelpModal(false)} />}

      <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-lg border-b border-white/10 h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="logo" className="h-10 w-10" />
          <span className="text-xl font-bold">ProctorX</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/staff-dashboard")} className="p-2 rounded bg-gray-800">
            <Home className="h-5 w-5" />
          </button>
          <button onClick={handleLogout} className="p-2 rounded bg-red-900/40">
            <LogOut className="h-5 w-5 text-red-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-10 pt-24">
        <form onSubmit={submitQuiz} className="space-y-10">
          <h1 className="text-4xl font-bold text-center">Create Quiz</h1>

          <div className="bg-white/10 p-6 rounded-xl border border-white/20 space-y-6">
            <div>
              <label className="text-sm text-gray-300 block mb-1">Quiz Title</label>
              <input name="title" value={formData.title} onChange={handleChange} className="w-full mt-2 p-3 bg-white/5 border border-white/10 rounded" />
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-1">Allowed Students (0 = unlimited)</label>
              <input type="number" name="allowedStudents" value={formData.allowedStudents} onChange={handleChange} className="w-full mt-2 p-3 bg-white/5 border border-white/10 rounded" min={0} />
            </div>

            <div className="border-t border-white/10 pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-base">Import Questions from CSV</label>
                <button type="button" className="text-cyan-400 flex items-center gap-2" onClick={() => setShowHelpModal(true)}>
                  <HelpCircle className="h-4 w-4" /> Help
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1 px-4 py-3 rounded bg-cyan-900/30 border border-cyan-500/30 cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="h-5 w-5" />
                  {isParsing ? "Parsing..." : "Upload CSV"}
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>

                <button type="button" onClick={downloadTemplate} className="flex-1 px-4 py-3 rounded bg-gray-800 border border-white/10 flex items-center justify-center gap-2">
                  <Download className="h-5 w-5" /> Download Template
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {formData.questions.map((q, i) => (
              <div key={i} className="bg-white/5 p-5 rounded-xl border border-white/10 relative">
                <span className="absolute -top-3 -left-3 bg-cyan-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <select value={q.questionType} onChange={(e) => handleQuestionField(i, "questionType", e.target.value)} className="px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded">
                      <option value="mcq">MCQ</option>
                      <option value="descriptive">Descriptive</option>
                      <option value="coding">Coding</option>
                    </select>
                    <input type="number" min={1} value={q.marks} onChange={(e) => handleQuestionField(i, "marks", Number(e.target.value))} className="w-24 px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded" placeholder="Marks" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => removeQuestion(i)} className="text-red-400 p-2 rounded bg-red-900/30">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <textarea rows={3} value={q.questionText} onChange={(e) => handleQuestionField(i, "questionText", e.target.value)} className="w-full p-3 mb-4 bg-[#0B0B0B] border border-white/10 rounded" placeholder="Enter question text" />

                {q.questionType === "mcq" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                      {q.options.map((opt, j) => (
                        <div key={j}>
                          <label className="text-xs text-gray-300 mb-1 block">Option {j + 1}</label>
                          <input type="text" value={opt} onChange={(e) => handleOptionChange(i, j, e.target.value)} className="w-full px-3 py-2 bg-[#0B0B0B] border border-white/10 rounded" placeholder={`Option ${j + 1}`} />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-sm text-gray-300">Correct Answer</span>
                      {q.options.map((_, j) => (
                        <label key={j} className="flex items-center gap-2">
                          <input type="radio" name={`correct-${i}`} checked={q.correctAnswer === j} value={j} onChange={(e) => handleQuestionField(i, "correctAnswer", Number(e.target.value))} className="h-4 w-4 accent-cyan-500" />
                          {String.fromCharCode(65 + j)}
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {q.questionType === "descriptive" && (
                  <div className="mb-4">
                    <label className="text-xs text-gray-300 mb-1 block">Reference Answer (optional)</label>
                    <textarea rows={4} value={q.descriptiveAnswer} onChange={(e) => handleQuestionField(i, "descriptiveAnswer", e.target.value)} className="w-full px-3 py-2 bg-[#0B0B0B] border border-white/10 rounded" placeholder="Suggested answer or grading notes" />
                  </div>
                )}

                {q.questionType === "coding" && (
                  <>
                    <div className="mb-4">
                        <label className="text-xs text-gray-300 mb-3 block">Starter Code (Pre-filled with defaults, you can edit)</label>
                        
                        {/* GRID LAYOUT: Show all 4 languages side-by-side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {languages.map(lang => (
                                <div key={lang}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold uppercase text-cyan-400">{lang}</span>
                                    </div>
                                    <textarea
                                        rows={6}
                                        value={q.starterCode[lang] || ""}
                                        onChange={(e) => handleStarterCodeChange(i, lang, e.target.value)}
                                        className="w-full px-3 py-2 bg-[#0B0B0B] border border-white/10 rounded font-mono text-xs text-gray-300 focus:border-cyan-500 outline-none"
                                        placeholder={`// ${lang} boilerplate code...`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-200 mb-2">Testcases (8) - (stdin/stdout)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="text-left">
                              <th className="p-2 text-gray-400 w-12">#</th>
                              <th className="p-2 text-gray-400">Input</th>
                              <th className="p-2 text-gray-400">Expected Output</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 8 }).map((_, tcIndex) => {
                              const tc = (q.testcases && q.testcases[tcIndex]) || { input: "", output: "" };
                              return (
                                <tr key={tcIndex} className="border-t border-white/5">
                                  <td className="p-2 align-top text-gray-300">{tcIndex + 1}</td>
                                  <td className="p-2">
                                    <input value={tc.input} onChange={(e) => handleTestcaseChange(i, tcIndex, "input", e.target.value)} className="w-full px-3 py-2 bg-[#0B0B0B] border border-white/10 rounded" placeholder="stdin" />
                                  </td>
                                  <td className="p-2">
                                    <input value={tc.output} onChange={(e) => handleTestcaseChange(i, tcIndex, "output", e.target.value)} className="w-full px-3 py-2 bg-[#0B0B0B] border border-white/10 rounded" placeholder="expected stdout" />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addQuestion} className="w-full p-3 rounded bg-cyan-800/40 border border-cyan-500/30 text-cyan-300 flex items-center justify-center gap-2">
            <Plus className="h-5 w-5" /> Add Question
          </button>

          <button type="submit" disabled={isSubmitting} className="w-full p-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black rounded font-semibold flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle className="h-5 w-5" />} {isSubmitting ? "Creating..." : "Create Quiz"}
          </button>
        </form>
      </main>
    </div>
  );
}