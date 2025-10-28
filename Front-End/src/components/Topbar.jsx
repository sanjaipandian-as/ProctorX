import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { GraduationCap, Users, User, Search as SearchIcon, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API from "../../Api";
import LOGO from "../assets/LOGO.png";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { user, logout } = useAuth();

  const runSearch = async (query) => {
    if (!query) {
      setQuizzes([]);
      setError("");
      setIsDropdownVisible(false);
      return;
    }
    setLoading(true);
    setError("");
    setQuizzes([]);
    setIsDropdownVisible(true);
    try {
      let foundQuizzes = [];
      if (query.toUpperCase().startsWith("QZ")) {
        const res = await API.get(`/api/quizzes/public/${query}`);
        if (res.data && res.data.quizId) foundQuizzes = [res.data];
      } else {
        const res = await API.get("/api/quizzes/public");
        const data = Array.isArray(res.data) ? res.data : [];
        foundQuizzes = data.filter((quiz) =>
          quiz.title?.toLowerCase().includes(query.toLowerCase())
        );
      }
      setQuizzes(foundQuizzes);
    } catch (err) {
      console.error("Error searching quizzes:", err);
      setError("No quizzes found or invalid code.");
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedSearchQuery) runSearch(debouncedSearchQuery);
    else {
      setQuizzes([]);
      setError("");
      setIsDropdownVisible(false);
    }
  }, [debouncedSearchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(searchQuery);
  };

  const handleQuizClick = (quizId) => {
    navigate(`/exam/${quizId}`);
    setSearchQuery("");
    setIsDropdownVisible(false);
  };

  return (
    <div className="relative">
      <nav className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-between h-auto py-3 gap-4 sm:h-16">
            
            <div className="flex items-center space-x-2 order-1">
              <img src={LOGO} alt="Logo" className="h-12 w-12 sm:h-16 sm:w-16" />
              <span className="bg-gradient-to-r text-xl sm:text-2xl font-bold from-[#00d9ff] to-[#8b5cf6] bg-clip-text text-transparent">
                ProctorX
              </span>
            </div>

            <div className="relative w-full sm:flex-1 sm:max-w-xl order-3 sm:order-2">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search quizzes by ID or title"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 sm:py-4 bg-white/20 border-white/10 focus:border-blue-400/50 focus:ring-blue-400/20 text-white placeholder:text-gray-400 rounded-full transition-all duration-300"
                  />
                </div>
              </form>

              {isDropdownVisible && (
                <div className={`absolute mt-2 w-full bg-white/50 backdrop-blur-lg rounded-xl shadow-lg z-50 max-h-60 sm:max-h-72 overflow-y-auto ${
                  searchQuery.toUpperCase().startsWith("QZ") && quizzes.length > 0
                    ? "flex justify-center items-center"
                    : ""
                }`}>
                  {loading ? (
                    <p className="text-yellow-400 p-3 sm:p-4 animate-pulse text-center">Searching...</p>
                  ) : quizzes.length > 0 ? (
                    quizzes.map((quiz) => (
                      <div
                        key={quiz.quizId}
                        onClick={() => handleQuizClick(quiz.quizId)}
                        className={`p-3 sm:p-4 hover:bg-white/10 cursor-pointer transition-all border-white/10 ${
                          searchQuery.toUpperCase().startsWith("QZ") && quizzes.length > 0
                            ? "border-b-0"
                            : "border-b"
                        }`}
                      >
                        <h3 className="font-bold text-red-500 text-sm sm:text-base">{quiz.title}</h3>
                        <p className="text-gray-300 text-xs sm:text-sm">ID: {quiz.quizId}</p>
                        {quiz.createdBy && (
                          <p className="text-gray-400 text-xs">
                            Created by: {quiz.createdBy.name || "Unknown"}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-red-400 text-sm">{error || "No quizzes found."}</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 order-2 sm:order-3">
              {!user ? (
                <>
                  <Link to="/staff-login">
                    <Button variant="outline" className="text-sm sm:text-base bg-black/30 backdrop-blur-md border-white/20 text-white hover:bg-white/10">
                      <Users className="h-4 w-4 min-[800px]:mr-1" /> <span className="hidden min-[800px]:inline">Teacher Login</span>
                    </Button>
                  </Link>
                  <Link to="/student-login">
                    <Button className="text-sm sm:text-base bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <User className="h-4 w-4 min-[800px]:mr-1" /> <span className="hidden min-[800px]:inline">Student Login</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {user.role === "student" && (
                    <Link to="/student-profile">
                      <Button className="text-sm sm:text-base bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        <User className="h-4 w-4 min-[800px]:mr-1" /> <span className="hidden min-[800px]:inline">Student Profile</span>
                      </Button>
                    </Link>
                  )}
                  {user.role === "teacher" && (
                    <Link to="/staff-dashboard">
                      <Button className="text-sm sm:text-base bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        <Users className="h-4 w-4 min-[800px]:mr-1" /> <span className="hidden min-[800px]:inline">Teacher Dashboard</span>
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    className="text-sm sm:text-base bg-black/30 border-white/20 text-white hover:bg-red-500/20 hover:border-red-400"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 min-[800px]:mr-1" /> <span className="hidden min-[800px]:inline">Logout</span>
                  </Button>
                </>
              )}
            </div>

          </div>
        </div>
      </nav>
    </div>
  );
}
