import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function StaffSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    profilePicture: null,
  });
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    if (e.target.name === "profilePicture") {
      const file = e.target.files[0];
      setFormData({ ...formData, profilePicture: file });
      if (file) setPreview(URL.createObjectURL(file));
      else setPreview(null);
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    if (formData.profilePicture) data.append("profilePicture", formData.profilePicture);

    try {
      const res = await fetch("http://localhost:8000/teachers/signup", {
        method: "POST",
        body: data,
      });
      const result = await res.json();

      if (res.ok) {
        alert(result.message || "Signup Successful!");
        navigate("/staff-login");
      } else {
        alert(result.message || "Signup failed. Please try again");
      }
    } catch (error) {
      alert("Error signing up staff");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-black to-gray-900 px-6">
      <div className="w-full max-w-lg bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-800 p-10 relative">
        <h1 className="text-4xl font-extrabold text-center text-white mb-3">
          Create Staff Account
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Join the <span className="text-indigo-400 font-semibold">ProctorX</span> platform
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              className="mt-2 w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Email Address</label>
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
            <label className="block text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              className="mt-2 w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Profile Picture</label>
            <input
              type="file"
              name="profilePicture"
              onChange={handleChange}
              className="mt-2 block w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
            />
            {preview && (
              <img
                src={preview}
                alt="Profile Preview"
                className="mt-3 w-20 h-20 rounded-full object-cover mx-auto border border-indigo-500/40 shadow-md"
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
          >
            Sign Up
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full bg-gray-800/30 text-gray-400 hover:text-white font-semibold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <FaArrowLeft /> Back
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6">
          Already have an account?{" "}
          <a href="/staff-login" className="text-indigo-400 hover:underline">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}

export default StaffSignup;
