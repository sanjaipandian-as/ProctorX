import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { GraduationCap, Users, User, Search as SearchIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

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

  const { user, logout } = useAuth(); // ✅ directly from AuthContext

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
        const res = await api.get(`/api/quizzes/public/${query}`);
        if (res.data && res.data.quizId) foundQuizzes = [res.data];
      } else {
        const res = await api.get("/api/quizzes/public");
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
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-extrabold text-xs">
                PX
              </div>
              <span className="text-xl font-extrabold tracking-tight text-black">
                ProctorX
              </span>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-2xl mx-auto px-4">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search quizzes by ID or title"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black text-black placeholder:text-gray-400 rounded-full transition-all text-xs font-bold"
                  />
                </div>
              </form>

              {/* Search Results Dropdown */}
              {isDropdownVisible && (
                <div className="absolute mt-2 w-full left-0 bg-white border border-gray-100 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
                  {loading ? (
                    <p className="text-gray-400 p-4 animate-pulse text-center text-xs font-bold">Searching...</p>
                  ) : quizzes.length > 0 ? (
                    quizzes.map((quiz) => (
                      <div
                        key={quiz.quizId}
                        onClick={() => handleQuizClick(quiz.quizId)}
                        className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-all"
                      >
                        <h3 className="font-extrabold text-black text-sm">{quiz.title}</h3>
                        <p className="text-gray-500 text-xs mt-0.5">ID: {quiz.quizId}</p>
                        {quiz.createdBy && (
                          <p className="text-gray-400 text-[10px] mt-1 font-bold uppercase tracking-wide">
                            By: {quiz.createdBy.name || "Unknown"}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-xs font-bold">{error || "No quizzes found."}</div>
                  )}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              {!user ? (
                <>
                  <Link to="/staff-login">
                    <Button variant="outline" className="bg-white border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-50 text-xs font-bold px-4 py-2 h-auto rounded-lg shadow-sm">
                      <Users className="h-3.5 w-3.5 mr-1.5" /> Staff Login
                    </Button>
                  </Link>
                  <Link to="/student-login">
                    <Button className="bg-black hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 h-auto rounded-lg shadow-sm">
                      <User className="h-3.5 w-3.5 mr-1.5" /> Student Login
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {user.role === "student" && (
                    <Link to="/student-profile">
                      <Button className="bg-black hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 h-auto rounded-lg shadow-sm">
                        <User className="h-3.5 w-3.5 mr-1.5" /> Profile
                      </Button>
                    </Link>
                  )}
                  {user.role === "teacher" && (
                    <Link to="/staff-dashboard">
                      <Button className="bg-black hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 h-auto rounded-lg shadow-sm">
                        <Users className="h-3.5 w-3.5 mr-1.5" /> Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    className="bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold px-4 py-2 h-auto rounded-lg shadow-sm"
                    onClick={logout}
                  >
                    Logout
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

// import { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const Search = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [quizzes, setQuizzes] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleSearch = async () => {
//     if (!searchTerm.trim()) return;
//     setLoading(true);
//     setError("");
//     setQuizzes([]);

//     try {
//       if (searchTerm.toUpperCase().startsWith("QZ")) {
//         const res = await axios.get(
//           `http://localhost:8000/api/quizzes/public/${searchTerm.trim()}`
//         );
//         setQuizzes([res.data]);
//       } else {
//         const res = await axios.get("http://localhost:8000/api/quizzes/public");
//         const data = Array.isArray(res.data) ? res.data : [];
//         const filtered = data.filter((quiz) =>
//           quiz.title?.toLowerCase().includes(searchTerm.toLowerCase())
//         );
//         setQuizzes(filtered);
//       }
//     } catch (err) {
//       console.error("Error searching quizzes:", err);
//       setError("No quizzes found or invalid code");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="w-full h-full flex flex-col items-center">
//       <div className="flex w-full max-w-3xl gap-3">
//         <input
//           type="text"
//           placeholder="Enter quiz title or Quiz ID (e.g., QZ123456)"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="flex-1 p-5 rounded-xl text-yellow-400 placeholder-yellow-400 bg-black border-2 border-yellow-400 shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all duration-300"
//         />
//         <button
//           onClick={handleSearch}
//           className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl shadow-md hover:bg-yellow-500 transition-all duration-300"
//         >
//           Search
//         </button>
//       </div>

//       {loading && (
//         <p className="text-yellow-400 text-lg mt-6 animate-pulse">
//           Searching quizzes...
//         </p>
//       )}

//       {error && <p className="text-red-400 mt-4">{error}</p>}

//       {!loading && quizzes.length > 0 && (
//         <div className="w-full max-w-3xl space-y-4 mt-6">
//           {quizzes.map((quiz) => (
//             <div
//               key={quiz.quizId}
//               onClick={() => navigate(`/exam/${quiz.quizId}`)}
//               className="p-5 rounded-xl border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors duration-300 cursor-pointer shadow-md"
//             >
//               <h2 className="font-bold text-xl">{quiz.title}</h2>
//               <p className="text-sm mt-1">ID: {quiz.quizId}</p>
//               {quiz.createdBy && (
//                 <p className="text-sm mt-1">
//                   Created by: {quiz.createdBy.name || "Unknown"}
//                 </p>
//               )}
//             </div>
//           ))}
//         </div>
//       )}

//       {!loading && !error && quizzes.length === 0 && searchTerm && (
//         <p className="text-yellow-400 text-center text-lg mt-6">
//           No quizzes found.
//         </p>
//       )}
//     </div>
//   );
// };

// export default Search;
