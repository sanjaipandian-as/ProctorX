import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./Dashboard";
import Studentlogin from "./components/Studentlogin";
import StudentSignup from "./components/Studentsignup";
import StaffSignup from "./components/StaffSignup";
import Stafflogin from "./components/Stafflogin";
import StaffDashboard from "./components/StaffDashboard";
import CreateQuiz from "./components/CreateQuiz";
import QuizEditPage from "./pages/QuizEditPage";
import QuizAnsweringPage from "./pages/QuizAnsweringPage";
import QuizFlow from "./pages/QuizAttempt";
import QuizResults from "./pages/QuizResults";
import StudentDashboard from "./components/StudentDashboard";
import About from "./pages/AboutUs";
import CompilerPage from "./pages/CompilerPage";
import DescriptiveEditor from "./components/DescriptiveEditor";
import AiQuiz from "./components/AiQuiz";

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/student-login" element={<Studentlogin />} />
                <Route path="/student-signup" element={<StudentSignup />} />
                <Route path="/staff-signup" element={<StaffSignup />} />
                <Route path="/staff-login" element={<Stafflogin />} />
                <Route path="/staff-dashboard" element={<StaffDashboard />} />
                <Route path="/create-quiz" element={<CreateQuiz />} />
                <Route path="/edit-quiz/:quizId" element={<QuizEditPage />} />
                <Route path="/exam/:quizId" element={<QuizFlow />} />
                <Route path="/answer" element={<QuizAnsweringPage />} />
                <Route path="/results/:resultId" element={<QuizResults />} />
                <Route path="/student-profile" element={<StudentDashboard />} />
                <Route path="/about-us" element={<About />} />
                <Route path="/Compilor/:quizId" element={<CompilerPage />} />
                <Route path="/descriptive-editor" element={<DescriptiveEditor />} />
                <Route path="/ai-quiz" element={<AiQuiz />} />

            </Routes>
        </AuthProvider>
    );
}

export default App;
