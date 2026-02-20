import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Users, User, Search as SearchIcon, LogOut, Menu, X, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { user, logout } = useAuth();

  // Scroll effect for floating navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        else if (res.data && Array.isArray(res.data)) foundQuizzes = res.data;
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
      setError("No quizzes found.");
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
    <div className="relative font-sans">
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled ? "p-4" : "p-6"
          }`}
      >
        <div
          className={`mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-between ${isScrolled
            ? "max-w-6xl h-16 px-6 rounded-[24px] border border-gray-100 bg-white/80 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
            : "max-w-full h-20 px-8 bg-transparent"
            }`}
        >
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 flex-shrink-0 group">
            <div className="relative">
              <img
                src={LOGO}
                alt="ProctorX"
                className="h-10 w-10 object-contain brightness-100 group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <span className={`text-2xl font-black tracking-tighter transition-colors ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`}>
              ProctorX
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-12">
            <form onSubmit={handleSubmit} className="w-full relative">
              <div className="relative group">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#FFB343] transition-colors" />
                <Input
                  type="text"
                  placeholder="Find an assessment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#FFB343] focus:ring-4 focus:ring-orange-100 text-gray-900 placeholder:text-gray-400 transition-all hover:bg-white"
                />
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isDropdownVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 max-h-[400px] overflow-hidden"
                  >
                    {loading ? (
                      <div className="p-12 flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-[#FFB343] border-t-transparent animate-spin rounded-full" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Searching Quizzes</span>
                      </div>
                    ) : quizzes.length > 0 ? (
                      <div className="py-2">
                        <div className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 flex justify-between">
                          <span>Results Matched</span>
                          <span>{quizzes.length} Total</span>
                        </div>
                        <div className="overflow-y-auto max-h-[300px] custom-scrollbar">
                          {quizzes.map((quiz) => (
                            <div
                              key={quiz.quizId}
                              onClick={() => handleQuizClick(quiz.quizId)}
                              className="px-6 py-5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 group"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-bold text-gray-900 text-base group-hover:text-[#FF9F2E] transition-colors">{quiz.title}</h3>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[10px] bg-orange-100 text-[#FF9F2E] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{quiz.quizId}</span>
                                    {quiz.createdBy && <span className="text-xs text-gray-400 font-medium">by {quiz.createdBy.name}</span>}
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#FFB343] group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center text-gray-400">
                        <SearchIcon className="h-10 w-10 text-gray-100 mx-auto mb-4" />
                        <p className="font-bold">No results found.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden md:flex items-center space-x-6">
            {!user ? (
              <>
                <Link to="/staff-login" className="text-sm font-bold text-gray-500 hover:text-[#FFB343] uppercase tracking-widest transition-colors">
                  Instructor
                </Link>
                <Link to="/student-login">
                  <Button className="bg-[#FFB343] hover:bg-[#FF9F2E] text-white px-8 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20">
                    Sign In
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-5">
                <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-black text-gray-900 leading-tight">
                      {user.name || "Student"}
                    </span>
                    <span className="text-[10px] font-bold text-[#FFB343] uppercase tracking-widest">
                      {user.role}
                    </span>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#FFB343] to-[#FF9F2E] flex items-center justify-center text-white font-black text-lg ring-4 ring-orange-500/10">
                    {user.name?.charAt(0).toUpperCase() || "S"}
                  </div>
                </div>

                {user.role === "student" && (
                  <Link to="/student-profile">
                    <Button variant="ghost" className="text-gray-400 hover:text-[#FFB343] hover:bg-orange-50 p-2 rounded-xl transition-all">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                {user.role === "teacher" && (
                  <Link to="/staff-dashboard">
                    <Button variant="ghost" className="text-gray-400 hover:text-[#FFB343] hover:bg-orange-50 p-2 rounded-xl transition-all">
                      <Users className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 transition-all hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden mt-4 mx-2 overflow-hidden bg-white border border-gray-100 rounded-3xl shadow-2xl backdrop-blur-3xl"
            >
              <div className="p-8 space-y-8">
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search quizzes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900"
                    />
                  </div>
                </form>

                <div className="flex flex-col gap-4">
                  {!user ? (
                    <>
                      <Link to="/staff-login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-sm font-black text-gray-500 py-6 uppercase tracking-[0.2em]">
                          Teacher Login
                        </Button>
                      </Link>
                      <Link to="/student-login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full bg-[#FFB343] text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em]">
                          Student Login
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FFB343] flex items-center justify-center text-white font-black text-xl">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{user.name}</p>
                          <p className="text-[10px] font-bold text-[#FFB343] uppercase tracking-widest">{user.role}</p>
                        </div>
                      </div>
                      <Link to={user.role === "student" ? "/student-profile" : "/staff-dashboard"} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-sm font-black text-gray-500 py-6 uppercase tracking-[0.2em]">
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full justify-start text-sm font-black text-red-500 py-6 uppercase tracking-[0.2em]"
                      >
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      {isScrolled && <div className="h-20" />}
    </div>
  );
}
