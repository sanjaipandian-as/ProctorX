import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { GraduationCap, Users, User, Search as SearchIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API from "../../Api";

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-cyan-400" />
              <span className="bg-gradient-to-r text-2xl font-bold from-[#00d9ff] to-[#8b5cf6] bg-clip-text text-transparent">
                ProctorX
              </span>
            </div>
            <div className="relative flex-1 max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search quizzes by ID or title"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 bg-white/20 border-white/10 focus:border-blue-400/50 focus:ring-blue-400/20 text-white placeholder:text-gray-400 rounded-full transition-all duration-300 hover:bg-white/10 focus:bg-white/10"
                  />
                </div>
              </form>
              {isDropdownVisible && (
                <div className="absolute mt-2 w-full bg-white/20 backdrop-blur-lg rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
                  {loading ? (
                    <p className="text-yellow-400 p-4 animate-pulse text-center">Searching...</p>
                  ) : quizzes.length > 0 ? (
                    quizzes.map((quiz) => (
                      <div
                        key={quiz.quizId}
                        onClick={() => handleQuizClick(quiz.quizId)}
                        className="p-4 border-b border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                      >
                        <h3 className="font-bold text-white">{quiz.title}</h3>
                        <p className="text-gray-300 text-sm">ID: {quiz.quizId}</p>
                        {quiz.createdBy && (
                          <p className="text-gray-400 text-xs">
                            Created by: {quiz.createdBy.name || "Unknown"}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-red-400">{error || "No quizzes found."}</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Link to="/staff-login">
                    <Button variant="outline" className="bg-black/30 backdrop-blur-md border-white/20 text-white hover:bg-white/10">
                      <Users className="h-4 w-4 mr-2" /> Teacher Login
                    </Button>
                  </Link>
                  <Link to="/student-login">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                      <User className="h-4 w-4 mr-2" /> Student Login
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {user.role === "student" && (
                    <Link to="/student-profile">
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                        <User className="h-4 w-4 mr-2" /> Student Profile
                      </Button>
                    </Link>
                  )}
                  {user.role === "teacher" && (
                    <Link to="/staff-dashboard">
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                        <Users className="h-4 w-4 mr-2" /> Teacher Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    className="bg-black/30 backdrop-blur-md border-white/20 text-white hover:bg-red-500/20 hover:border-red-400"
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
