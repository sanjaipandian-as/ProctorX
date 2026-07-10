import { useState, useContext } from "react";
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import api from "../lib/api";
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
      const res = await api.post("/api/auth/login/student", { email, password });
      login(res.data.token);
      navigate("/");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error during login");
    }
  };

  return (
    <div 
      className="h-screen w-screen flex items-center justify-center bg-gray-50 p-4 font-sans"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 border border-gray-100 relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-4">
            PX
          </div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Student Access</h2>
          <p className="text-gray-500 text-xs mt-1.5 font-medium">Log in to enter the examination portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-3.5 text-gray-400 w-3.5 h-3.5" />
              <input
                type="email"
                placeholder="student@university.edu"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Password</label>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-3.5 text-gray-400 w-3.5 h-3.5" />
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-black hover:bg-gray-900 text-white font-bold text-sm transition-all"
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full py-3.5 rounded-xl bg-white text-gray-600 hover:text-black font-bold text-sm border border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2 transition-all"
          >
            <FaArrowLeft className="w-3 h-3" /> Back to Home
          </button>
        </form>

        {message && (
          <div className="mt-5 p-3 bg-red-50 border border-red-100 rounded-lg text-center text-xs font-bold text-red-600">
            {message}
          </div>
        )}

        <div className="mt-8 text-center text-xs font-bold text-gray-500">
          Don’t have an account?{" "}
          <a href="/Student-signup" className="text-black hover:underline">
            Register Here
          </a>
        </div>
      </div>
    </div>
  );
}
