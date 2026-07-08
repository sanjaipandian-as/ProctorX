import React, { useState } from "react";
import { FaUser, FaEnvelope, FaLock, FaIdBadge, FaImage, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

function StaffSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    staffId: "",
    profilePicture: null,
  });
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");

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
    setMessage("");
    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("staffId", formData.staffId);
    if (formData.profilePicture) data.append("profilePicture", formData.profilePicture);

    try {
      const res = await api.post("/api/auth/signup/teacher", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const result = res.data;
      navigate("/staff-login");
    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed. Please try again");
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans py-12"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-4">
            PX
          </div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">
            Staff Registration
          </h1>
          <p className="text-gray-500 text-xs mt-1.5 font-medium">
            Join the ProctorX platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Full Name</label>
            <div className="relative">
              <FaUser className="absolute left-3.5 top-3.5 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-3.5 text-gray-400 w-3.5 h-3.5" />
              <input
                type="email"
                name="email"
                placeholder="educator@institution.edu"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Staff ID</label>
            <div className="relative">
              <FaIdBadge className="absolute left-3.5 top-3.5 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                name="staffId"
                placeholder="Enter your unique Staff ID"
                value={formData.staffId}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
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
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Profile Picture</label>
            <div className="relative">
              <FaImage className="absolute left-3.5 top-3.5 text-gray-400 w-3.5 h-3.5" />
              <input
                type="file"
                name="profilePicture"
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-gray-200 file:text-black hover:file:bg-gray-300 cursor-pointer"
              />
            </div>
            {preview && (
              <div className="mt-4 flex justify-center">
                <img
                  src={preview}
                  alt="Profile Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-2 rounded-xl bg-black hover:bg-gray-900 text-white font-bold text-sm transition-all"
          >
            Create Staff Account
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-3.5 rounded-xl bg-white text-gray-600 hover:text-black font-bold text-sm border border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2 transition-all"
          >
            <FaArrowLeft className="w-3 h-3" /> Back
          </button>
        </form>

        {message && (
          <div className="mt-5 p-3 bg-red-50 border border-red-100 rounded-lg text-center text-xs font-bold text-red-600">
            {message}
          </div>
        )}

        <div className="mt-8 text-center text-xs font-bold text-gray-500">
          Already have an account?{" "}
          <a href="/staff-login" className="text-black hover:underline">
            Login Here
          </a>
        </div>
      </div>
    </div>
  );
}

export default StaffSignup;
