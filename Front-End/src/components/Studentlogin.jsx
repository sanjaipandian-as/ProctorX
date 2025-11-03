import { useState, useContext } from "react";
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import ProctorX from "../assets/ProctorX.png";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../../Api";
import Proctor from "../assets/LOGO.png";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/students/login", { email, password });
      login(res.data.token);
      alert("Login Successful!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0e0e0e] px-4 sm:px-6 py-10">
      <div className="w-full max-w-md sm:max-w-lg bg-gradient-to-br from-[#1a1a1a] to-[#262626] rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 border border-cyan-400/20 relative">
        <div className="text-center mb-6">
          <img
            src={Proctor}
            alt="ProctorX Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 drop-shadow-lg"
          />
          <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400">
            Student Login
          </h2>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Login to access your learning dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm text-gray-300">Email</label>
            <div className="relative mt-2">
              <FaEnvelope className="absolute left-3 top-3 text-cyan-400/70" />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300">Password</label>
            <div className="relative mt-2">
              <FaLock className="absolute left-3 top-3 text-cyan-400/70" />
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm sm:text-lg shadow-lg transition-all transform hover:scale-[1.02] ${
              loading
                ? "bg-cyan-600 cursor-not-allowed"
                : "bg-cyan-500 hover:bg-cyan-600"
            }`}
          >
            {loading ? "Entering Learning Zone..." : "Enter Learning Zone"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-gray-800/30 text-gray-400 hover:text-white font-semibold text-sm sm:text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <FaArrowLeft /> Back
          </button>
        </form>

        <div className="mt-6 text-center text-sm sm:text-base text-gray-400">
          Don’t have an account?{" "}
          <a
            href="/student-signup"
            className="hover:underline hover:text-cyan-300"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
