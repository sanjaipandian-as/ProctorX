import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Users, User, Search as SearchIcon, LogOut, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="relative">
      {/* Main Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Section */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="relative">
                <img 
                  src={LOGO} 
                  alt="ProctorX Logo" 
                  className="h-10 w-10 object-contain" 
                />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                ProctorX
              </span>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative group">
                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search quizzes by ID (e.g., QZ123) or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400 transition-all duration-200 hover:bg-white hover:border-gray-400"
                  />
                </div>
              </form>

              {/* Search Results Dropdown */}
              {isDropdownVisible && (
                <div className="absolute top-full left-0 right-0 mt-2 mx-4 sm:mx-8 lg:mx-auto lg:max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center p-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-gray-600">Searching...</span>
                    </div>
                  ) : quizzes.length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Search Results
                      </div>
                      {quizzes.map((quiz) => (
                        <div
                          key={quiz.quizId}
                          onClick={() => handleQuizClick(quiz.quizId)}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                        >
                          <h3 className="font-semibold text-gray-900 text-sm">{quiz.title}</h3>
                          <div className="flex items-center mt-1 space-x-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              ID: {quiz.quizId}
                            </span>
                            {quiz.createdBy && (
                              <span className="text-xs text-gray-500">
                                by {quiz.createdBy.name || "Unknown"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <div className="text-gray-400 mb-2">
                        <SearchIcon className="h-8 w-8 mx-auto" />
                      </div>
                      <p className="text-gray-600 text-sm">{error || "No quizzes found."}</p>
                      <p className="text-gray-400 text-xs mt-1">Try searching by quiz ID (QZ...) or title</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {!user ? (
                <>
                  <Link to="/staff-login">
                    <Button 
                      variant="outline" 
                      className="text-sm font-medium text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-4 py-2 rounded-lg transition-all"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Teacher Login
                    </Button>
                  </Link>
                  <Link to="/student-login">
                    <Button className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow">
                      <User className="h-4 w-4 mr-2" />
                      Student Login
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 mr-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.role === "student" ? "S" : "T"}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden lg:block">
                      {user.name || (user.role === "student" ? "Student" : "Teacher")}
                    </span>
                  </div>
                  
                  {user.role === "student" && (
                    <Link to="/student-profile">
                      <Button className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    </Link>
                  )}
                  {user.role === "teacher" && (
                    <Link to="/staff-dashboard">
                      <Button className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow">
                        <Users className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    className="text-sm font-medium text-gray-700 bg-white border-gray-300 hover:bg-red-50 hover:border-red-300 hover:text-red-600 px-4 py-2 rounded-lg transition-all"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search quizzes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </form>

              {/* Mobile Search Results */}
              {isDropdownVisible && searchQuery && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600 text-sm">Searching...</span>
                    </div>
                  ) : quizzes.length > 0 ? (
                    quizzes.map((quiz) => (
                      <div
                        key={quiz.quizId}
                        onClick={() => handleQuizClick(quiz.quizId)}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-200 last:border-0"
                      >
                        <h3 className="font-medium text-gray-900 text-sm">{quiz.title}</h3>
                        <span className="text-xs text-blue-600">{quiz.quizId}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-sm text-gray-600">
                      {error || "No quizzes found."}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Navigation Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                {!user ? (
                  <>
                    <Link to="/staff-login" className="block">
                      <Button 
                        variant="outline" 
                        className="w-full text-sm font-medium text-gray-700 bg-white border-gray-300 hover:bg-gray-50 py-2.5 rounded-lg"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Teacher Login
                      </Button>
                    </Link>
                    <Link to="/student-login" className="block">
                      <Button className="w-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg">
                        <User className="h-4 w-4 mr-2" />
                        Student Login
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-3 pb-2">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.role === "student" ? "S" : "T"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name || (user.role === "student" ? "Student" : "Teacher")}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    
                    {user.role === "student" && (
                      <Link to="/student-profile" className="block">
                        <Button className="w-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg">
                          <User className="h-4 w-4 mr-2" />
                          Student Profile
                        </Button>
                      </Link>
                    )}
                    {user.role === "teacher" && (
                      <Link to="/staff-dashboard" className="block">
                        <Button className="w-full text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg">
                          <Users className="h-4 w-4 mr-2" />
                          Teacher Dashboard
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      className="w-full text-sm font-medium text-red-600 bg-white border-red-300 hover:bg-red-50 py-2.5 rounded-lg"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </div>
  );
}
