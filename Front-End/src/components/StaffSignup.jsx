import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../../Api";

function StaffSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    profilePicture: null,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

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
    if (loading) return; 
    setLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("password", formData.password);
    if (formData.profilePicture)
      data.append("profilePicture", formData.profilePicture);

    try {
      const res = await API.post("/teachers/signup", data);
      const result = res.data;

      console.log("Signup response:", res);

      if (res.status >= 200 && res.status < 300) {
        alert(result.message || "Signup Successful!");
        navigate("/staff-login");
      } else {
        alert(result.message || "Signup failed. Please try again");
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert("Email already exists! Please log in instead.");
      } else {
        alert("Error signing up staff. Please try again later.");
      }
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-black to-gray-900 px-4 sm:px-6 md:px-8 py-10">
      <div className="w-full max-w-md sm:max-w-lg bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-800 p-6 sm:p-8 md:p-10 relative">
        {/* Header */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-white mb-3">
          Create Staff Account
        </h1>
        <p className="text-gray-400 text-center mb-8 text-sm sm:text-base">
          Join the{" "}
          <span className="text-indigo-400 font-semibold">ProctorX</span>{" "}
          platform
        </p>
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              className="mt-2 w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm sm:text-base"
              required
            />
          </div>

          
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
              className="mt-2 w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm sm:text-base"
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
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              className="mt-2 w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm sm:text-base"
              required
            />
          </div>

          
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Profile Picture
            </label>
            <input
              type="file"
              name="profilePicture"
              onChange={handleChange}
              className="mt-2 block w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm sm:file:text-base file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
            />
            {preview && (
              <img
                src={preview}
                alt="Profile Preview"
                className="mt-3 w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mx-auto border border-indigo-500/40 shadow-md"
              />
            )}
          </div>

          
          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${
                loading
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white font-semibold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] text-sm sm:text-base`}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full bg-gray-800/30 text-gray-400 hover:text-white font-semibold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] text-sm sm:text-base"
            >
              <FaArrowLeft /> Back
            </button>
          </div>
        </form>

        
        <p className="text-gray-400 text-center mt-6 text-sm sm:text-base">
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
