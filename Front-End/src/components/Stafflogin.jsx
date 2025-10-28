import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import API from "../../Api";

function StaffLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/teachers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      console.log("Login Response:", result);

      if (result.token) {
        // ✅ Clear old data before saving new login data
        localStorage.clear();
        sessionStorage.clear();

        // ✅ Save the new token and login
        login(result.token);
        localStorage.setItem("token", result.token);

        alert("Login Successful!");
        navigate("/staff-dashboard");
      } else {
        alert(result.message || "Login failed");
      }
    } catch (error) {
      alert("Error logging in staff");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-black to-gray-900 px-6">
      <div className="w-full max-w-lg bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-800 p-10">
        <h1 className="text-4xl font-extrabold text-center text-white mb-3">
          Staff Login
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Access your <span className="text-indigo-400 font-semibold">ProctorX</span> account
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="mt-2 w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="mt-2 w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full bg-gray-800/30 text-gray-400 hover:text-white font-semibold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <FaArrowLeft /> Back
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6">
          Don’t have an account?{" "}
          <Link to="/staff-signup" className="text-indigo-400 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default StaffLogin;
