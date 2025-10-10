import { useState, useContext } from "react";
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import ProctorX from '../assets/ProctorX.png';
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/students/login", { email, password });
      login(res.data.token);
      navigate("/");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error during login");
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0e0e0e] p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-[#1a1a1a] to-[#262626] rounded-2xl shadow-2xl p-8 border border-cyan-400/20 relative">
        <div className="text-center mb-6">
          <img src={ProctorX} alt="ProctorX Logo" className="w-24 h-24 mx-auto mb-4 drop-shadow-lg" />
          <h2 className="text-3xl font-bold text-cyan-400">Student Login</h2>
          <p className="text-gray-400 mt-1">Login to access your learning dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-300">Email</label>
            <div className="relative mt-2">
              <FaEnvelope className="absolute left-3 top-3 text-cyan-400/70" />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
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
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-[1.02]"
          >
            Enter Learning Zone
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-gray-800/30 text-gray-400 hover:text-white font-semibold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <FaArrowLeft /> Back
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-red-400">{message}</p>}

        <div className="mt-6 text-center text-sm text-gray-400">
          Don’t have an account?{" "}
          <a href="/Student-signup" className="hover:underline hover:text-cyan-300">
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
