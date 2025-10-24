import { useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaImage,
  FaArrowLeft,
} from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function StudentSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      // UPDATED TOAST: Using Login page's ERROR toast style
      toast.custom(
        (t) => (
          <div
            className={`fixed bottom-0 left-0 w-full bg-black-900/95 backdrop-blur-lg border-t  p-6 rounded-t-2xl shadow-lg text-center transform transition-all duration-500 ease-in-out ${t.visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
              }`}
          >
            <p className="text-red-400 text-lg mb-5 font-medium">
              Passwords do not match
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
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (profilePicture) formData.append("profilePicture", profilePicture);
      const res = await axios.post(
        "http://localhost:8000/students/signup",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      localStorage.setItem("token", res.data.token);

      // UPDATED TOAST: Using Login page's SUCCESS toast style
      toast.custom(
        (t) => (
          <div
            className={`fixed bottom-0 left-0 w-full bg-gray-900/95 backdrop-blur-lg border-t border-cyan-400/20 p-6 rounded-t-2xl shadow-lg text-center transform transition-all duration-500 ease-in-out ${t.visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
              }`}
          >
            <p className="text-white text-lg mb-5 font-medium">
              Account created successfully! 🎉
            </p>
            <div className="flex justify-center">
              <button
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate("/dashboard");
                }}
              >
                Continue
              </button>
            </div>
          </div>
        ),
        {
          position: "bottom-center",
          duration: 5000,
          onClose: () => navigate("/dashboard"),
        }
      );

      setTimeout(() => navigate("/Student-login"), 1000);
    } catch (err) {
      // UPDATED TOAST: Using Login page's ERROR toast style
      toast.custom(
        (t) => (
          <div
            className={`fixed bottom-0 left-0 w-full bg-black-900/95 backdrop-blur-lg border-t  p-6 rounded-t-2xl shadow-lg text-center transform transition-all duration-500 ease-in-out ${t.visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
              }`}
          >
            <p className="text-red-400 text-lg mb-5 font-medium">
              {err.response?.data?.message || "Error during signup"}
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

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    setProfilePicture(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0e0e0e] p-2 relative">
      <Toaster position="bottom-center" />
      <div className="w-full max-w-md bg-gradient-to-br from-[#1a1a1a] to-[#262626] rounded-2xl shadow-2xl p-8 border border-cyan-400/20">
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
            disabled={loading}
            className={`w-full py-3 rounded-xl ${loading ? "bg-cyan-600" : "bg-cyan-500 hover:bg-cyan-600"
              } text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-[1.02]`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
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
          Already have an account?{" "}
          <a
            href="/Student-login"
            className="hover:underline hover:text-cyan-300"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}