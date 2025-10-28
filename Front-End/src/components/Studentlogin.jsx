import { useState, useContext } from "react";
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import ProctorX from "../assets/ProctorX.png";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import API from "../../Api";

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
      toast.custom(
        (t) => (
          <div
            className={`fixed bottom-0 left-0 w-full bg-gray-900/95 backdrop-blur-lg border-t border-cyan-400/20 p-6 rounded-t-2xl shadow-lg text-center transform transition-all duration-500 ease-in-out ${
              t.visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}
          >
            <p className="text-white text-lg mb-5 font-medium">Login Successful 🎉</p>
            <div className="flex justify-center">
              <button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg"
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate("/");
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ),
        { position: "bottom-center", duration: 4000 }
      );
    } catch (err) {
      toast.custom(
        (t) => (
          <div
            className={`fixed bottom-0 left-0 w-full bg-black-900/95 backdrop-blur-lg border-t  p-6 rounded-t-2xl shadow-lg text-center transform transition-all duration-500 ease-in-out ${
              t.visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}
          >
            <p className="text-red-400 text-lg mb-5 font-medium">
              {err.response?.data?.message || "Invalid email or password"}
            </p>
            <div className="flex justify-center">
              <button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg"
                onClick={() => toast.dismiss(t.id)}
              >
                Try Again
              </button>
            </div>
          </div>
        ),
        { position: "bottom-center", duration: 4000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0e0e0e] p-4">
      <Toaster />
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
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-[1.02] ${
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
            className="w-full py-3 rounded-xl bg-gray-800/30 text-gray-400 hover:text-white font-semibold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <FaArrowLeft /> Back
          </button>
        </form>

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
