import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await api.post("/api/auth/login/teacher", formData);
      const result = res.data;

      if (result.token) {
        localStorage.clear();
        sessionStorage.clear();

        login(result.token);
        localStorage.setItem("token", result.token);

        navigate("/staff-dashboard");
      } else {
        setMessage(result.message || "Login failed");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Error logging in staff");
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-4">
            PX
          </div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">
            Staff Portal
          </h1>
          <p className="text-gray-500 text-xs mt-1.5 font-medium">
            ProctorX Educator Access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-3.5 text-gray-400 w-3.5 h-3.5" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-3.5 text-gray-400 w-3.5 h-3.5" />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-black hover:bg-gray-900 text-white font-bold text-sm transition-all"
          >
            Secure Login
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

        <p className="text-gray-400 text-center text-[10px] mt-8 font-medium leading-relaxed">
          Instructor accounts must be provisioned by a system administrator. Please contact IT support for credentials.
        </p>
      </div>
    </div>
  );
}

export default StaffLogin;
