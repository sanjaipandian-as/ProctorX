import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import API from "../../Api";
import Proctor from "../assets/LOGO.png";
import { Users, Upload, ArrowLeft } from "lucide-react";

export default function StudentSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (profilePicture) formData.append("profilePicture", profilePicture);

      const res = await API.post("/students/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem("token", res.data.token);
      toast.success("Account created successfully! 🎉");
      setTimeout(() => navigate("/student-login"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FDFCF4] overflow-hidden relative font-sans lg:justify-end">
      <Toaster position="top-center" />

      {/* Left Side Background Shape (Full Screen Curve) - Anchored Left */}
      <div className="absolute top-0 left-0 w-[60%] h-full hidden lg:block pointer-events-none z-0">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full text-[#FFB343] fill-current drop-shadow-[20px_0_30px_rgba(0,0,0,0.05)]"
          style={{ transform: 'scaleX(-1)' }}
        >
          <path d="M 30 0 L 100 0 L 100 100 L 30 100 C -20 60 70 40 30 0 Z" />
        </svg>
      </div>

      {/* Left Side Content - Now on Left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="hidden lg:flex absolute top-0 left-0 w-[50%] h-full flex-col justify-center items-center text-white z-20"
      >
        <div className="absolute top-12 left-12 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <img src={Proctor} alt="Logo" className="w-8 h-8 rounded-full bg-white p-1" />
          </div>
          <span className="font-semibold tracking-wider text-lg opacity-90">ProctorX</span>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Join Us!</h1>
          <p className="text-white/90 text-xl font-light">Start your learning journey today</p>
        </div>

        {/* Illustration Container */}
        <div className="w-[450px] h-[350px] flex items-center justify-center relative">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl transform scale-75"></div>
            <img
              src="https://img.freepik.com/free-vector/creative-team-concept-illustration_114360-3944.jpg?w=740&t=st=1707202000~exp=1707202600~hmac=abc"
              className="relative w-full h-full object-contain mix-blend-screen opacity-90 grayscale-[0.1]"
              alt="Community Illustration"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-white/80">
              <Users size={180} strokeWidth={0.5} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side: Form - Anchored Right */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center p-8 sm:p-12 z-10 overflow-y-auto lg:ml-auto"
      >
        <div className="w-full max-w-md flex flex-col items-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 tracking-wide">Create Account</h2>

          <form onSubmit={handleSignup} className="w-full space-y-8">

            <div className="space-y-1 group">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full py-3 bg-transparent border-b border-gray-300 focus:border-[#FFB343] outline-none transition-colors text-gray-700 placeholder-gray-400 text-base font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1 group">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full py-3 bg-transparent border-b border-gray-300 focus:border-[#FFB343] outline-none transition-colors text-gray-700 placeholder-gray-400 text-base font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1 group">
              <input
                type="password"
                placeholder="Password"
                className="w-full py-3 bg-transparent border-b border-gray-300 focus:border-[#FFB343] outline-none transition-colors text-gray-700 placeholder-gray-400 text-base font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1 group">
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full py-3 bg-transparent border-b border-gray-300 focus:border-[#FFB343] outline-none transition-colors text-gray-700 placeholder-gray-400 text-base font-medium"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Profile Picture Upload */}
            <div className="flex items-center gap-4 pt-2">
              <div className="relative overflow-hidden w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 group-hover:border-[#FFB343] transition-colors">
                {preview ? (
                  <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="text-gray-400 w-6 h-6" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">Profile Picture</span>
                <span className="text-xs text-gray-400">Tap to upload (Optional)</span>
              </div>
            </div>

            <div className="pt-6 text-center w-full">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-16 py-4 bg-[#FFB343] text-white rounded-xl font-semibold hover:bg-[#E5A03C] transition-all transform active:scale-95 shadow-xl text-lg disabled:opacity-70"
              >
                {loading ? "Creating..." : "Sign Up"}
              </button>
            </div>
          </form>

          <a
            href="/student-login"
            className="mt-10 text-sm text-gray-400 hover:text-[#FFB343] transition-colors font-medium border-b border-transparent hover:border-gray-400 pb-0.5"
          >
            Already have an account? Login
          </a>
        </div>
      </motion.div>
    </div>
  );
}
