import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./Dashboard";
import StudentLogin from "./components/Studentlogin";
import StudentSignup from "./components/Studentsignup";
import StaffLogin from "./components/Stafflogin";
import { Toaster } from "react-hot-toast";

// Lazy Loaded Pages
const StaffDashboard = React.lazy(() => import("./components/StaffDashboard"));
const CreateQuiz = React.lazy(() => import("./components/CreateQuiz"));
const QuizEditPage = React.lazy(() => import("./pages/QuizEditPage"));
const QuizAnsweringPage = React.lazy(() => import("./pages/QuizAnsweringPage"));
const QuizAttempt = React.lazy(() => import("./pages/QuizAttempt"));
const QuizResults = React.lazy(() => import("./pages/QuizResults"));
const StudentDashboard = React.lazy(() => import("./components/StudentDashboard"));
const AdminLogin = React.lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const ExamMonitor = React.lazy(() => import("./pages/ExamMonitor"));
const AiQuiz = React.lazy(() => import("./components/AiQuiz"));

const AdminRoute = ({ children }) => {
  const isAuth = !!localStorage.getItem("adminAuth");
  return isAuth ? children : <Navigate to="/admin/login" replace />;
};

const AdminLoginRoute = ({ children }) => {
  const isAuth = !!localStorage.getItem("adminAuth");
  return isAuth ? <Navigate to="/admin/dashboard" replace /> : children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <Suspense
          fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-white text-black font-sans">
              <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/student-signup" element={<StudentSignup />} />
            <Route path="/staff-login" element={<StaffLogin />} />

            {/* Dashboards */}
            <Route path="/student-profile" element={<StudentDashboard />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />

            {/* Quizzes */}
            <Route path="/create-quiz" element={<CreateQuiz />} />
            <Route path="/ai-quiz" element={<AiQuiz />} />
            <Route path="/edit-quiz/:quizId" element={<QuizEditPage />} />
            <Route path="/exam/:quizId" element={<QuizAttempt />} />
            <Route path="/quiz/:quizId/answer" element={<QuizAnsweringPage />} />
            <Route path="/results/:resultId" element={<QuizResults />} />
            
            {/* Live Monitoring Dashboard */}
            <Route path="/monitor/:quizId" element={<ExamMonitor />} />

            {/* Admin Portal */}
            <Route
              path="/admin/login"
              element={
                <AdminLoginRoute>
                  <AdminLogin />
                </AdminLoginRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
