import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>);

export default function EditQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`http://localhost:8000/api/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuiz(data);
      } catch (err) {
        setError("Failed to load quiz. Please check the ID or try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleQuizTitleChange = (e) => {
    setQuiz({ ...quiz, title: e.target.value });
  };
  
  const handleQuizStatusChange = (e) => {
    setQuiz({ ...quiz, status: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const addQuestion = () => {
    const newQuestion = {
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
  };

  const removeQuestion = (index) => {
    const updatedQuestions = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:8000/api/quizzes/${quizId}`, quiz, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Quiz updated successfully!');
      navigate('/staff-dashboard');
    } catch (err) {
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading Quiz Editor...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!quiz) return null;

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">Edit Quiz</h1>
          <div>
            <button onClick={() => navigate('/teacher-dashboard')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition mr-4">
              Cancel
            </button>
            <button onClick={handleSaveChanges} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition disabled:bg-emerald-800">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </header>

        <div className="bg-white/10 p-8 rounded-2xl space-y-8">
          <div>
            <label htmlFor="quizTitle" className="block text-lg font-medium text-gray-300 mb-2">Quiz Title</label>
            <input type="text" id="quizTitle" value={quiz.title} onChange={handleQuizTitleChange} className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-3 focus:ring-purple-500 focus:border-purple-500 text-lg"/>
          </div>
          <div>
            <label htmlFor="quizStatus" className="block text-lg font-medium text-gray-300 mb-2">Status</label>
            <select id="quizStatus" value={quiz.status} onChange={handleQuizStatusChange} className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg px-4 py-3 focus:ring-purple-500 focus:border-purple-500 text-lg">
                <option value="inactive">Inactive</option>
                <option value="active">Active</option>
            </select>
          </div>

          <hr className="border-gray-700"/>

          <div>
            <h2 className="text-2xl font-semibold text-gray-200 mb-6">Questions</h2>
            <div className="space-y-8">
              {quiz.questions.map((q, qIndex) => (
                <div key={q._id || qIndex} className="bg-white/5 p-6 rounded-xl border border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-lg font-medium text-gray-300">Question {qIndex + 1}</label>
                    <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-400 p-2 rounded-full bg-red-900/50 hover:bg-red-900/80 transition">
                      <TrashIcon />
                    </button>
                  </div>
                  <textarea value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)} placeholder="Enter the question text..." className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg px-4 py-3 mb-4 h-28 focus:ring-purple-500 focus:border-purple-500"></textarea>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex}>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Option {oIndex + 1}</label>
                        <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"/>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                     <label className="block text-sm font-medium text-gray-400 mb-1">Correct Answer</label>
                     <select value={q.correctAnswer} onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', Number(e.target.value))} className="w-full bg-gray-800 border-2 border-gray-600 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500">
                        {q.options.map((_, oIndex) => (
                           <option key={oIndex} value={oIndex}>Option {oIndex + 1}</option>
                        ))}
                     </select>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addQuestion} className="mt-8 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition">
              <PlusIcon /> Add Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
