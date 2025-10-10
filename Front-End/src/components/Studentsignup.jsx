import { useState } from "react";
import { FaUser, FaEnvelope, FaLock, FaImage, FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function StudentSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (profilePicture) formData.append("profilePicture", profilePicture);

      const res = await axios.post("http://localhost:8000/students/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem("token", res.data.token);
      navigate("/Student-login");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error during signup");
    }
  };

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    setProfilePicture(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0e0e0e] p-2">
      <div className="w-full max-w-md bg-gradient-to-br from-[#1a1a1a] to-[#262626] rounded-2xl shadow-2xl p-8 border border-cyan-400/20 relative">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-cyan-400">Student Signup</h2>
          <p className="text-gray-400 mt-1">Create your account to start learning</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300">Full Name</label>
            <div className="relative mt-2">
              <FaUser className="absolute left-3 top-3 text-cyan-400/70" />
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

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

          <div>
            <label className="block text-sm text-gray-300">Confirm Password</label>
            <div className="relative mt-2">
              <FaLock className="absolute left-3 top-3 text-cyan-400/70" />
              <input
                type="password"
                placeholder="Confirm your password"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300">Profile Picture</label>
            <div className="relative mt-2">
              <FaImage className="absolute left-3 top-3 text-cyan-400/70" />
              <input
                type="file"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                onChange={handleProfileChange}
              />
            </div>
            {preview && (
              <img
                src={preview}
                alt="Profile Preview"
                className="mt-3 w-20 h-20 rounded-full object-cover mx-auto border border-cyan-400/30 shadow-md"
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-[1.02]"
          >
            Sign Up
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
          Already have an account?{" "}
          <a href="/Student-login" className="hover:underline hover:text-cyan-300">
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
