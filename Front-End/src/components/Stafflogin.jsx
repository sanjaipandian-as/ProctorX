import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import API from "../../Api";
import Proctor from "../assets/LOGO.png";
import { UserCog } from "lucide-react";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/teachers/login", { email, password });
      login(res.data.token);
      toast.success("Login Successful!");
      setTimeout(() => navigate("/staff-dashboard"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
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
          className="w-full h-full text-[#F97316] fill-current drop-shadow-[20px_0_30px_rgba(0,0,0,0.05)]"
          style={{ transform: 'scaleX(-1)' }}
        >
          <path d="M 30 0 L 100 0 L 100 100 L 30 100 C -20 60 70 40 30 0 Z" />
        </svg>
      </div>

      {/* Left Side Content - Anchored Left */}
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
          <span className="font-semibold tracking-wider text-lg opacity-90">ProctorX Staff</span>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Instructor Portal</h1>
          <p className="text-orange-50/90 text-xl font-light">Manage your assessments seamlessly</p>
        </div>

        {/* Illustration Container */}
        <div className="w-[450px] h-[350px] flex items-center justify-center relative">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl transform scale-75"></div>
            {/* You can replace this placeholder illustration with a more specific one for staff */}
            <div className="w-full h-full flex items-center justify-center text-white/80">
              <UserCog size={180} strokeWidth={0.5} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side: Form - Anchored Right */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center p-8 sm:p-12 z-10 lg:ml-auto"
      >
        <div className="w-full max-w-md flex flex-col items-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-12 tracking-wide">Staff Login</h2>

          <form onSubmit={handleLogin} className="w-full space-y-12">
            <div className="space-y-1 group">
              <input
                type="email"
                placeholder="Email"
                className="w-full py-4 bg-transparent border-b border-gray-300 focus:border-[#F97316] outline-none transition-colors text-gray-700 placeholder-gray-400 text-base font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1 group">
              <input
                type="password"
                placeholder="Password"
                className="w-full py-4 bg-transparent border-b border-gray-300 focus:border-[#F97316] outline-none transition-colors text-gray-700 placeholder-gray-400 text-base font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-8 text-center w-full">
              <p className="text-gray-400 text-xs mb-4 uppercase tracking-wider font-semibold">Welcome back, Professor!</p>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-16 py-4 bg-[#F97316] text-white rounded-xl font-semibold hover:bg-[#EA580C] transition-all transform active:scale-95 shadow-xl text-lg disabled:opacity-70"
              >
                {loading ? "..." : "Enter Portal"}
              </button>
            </div>
          </form>

          <a
            href="/staff-signup"
            className="mt-16 text-sm text-gray-400 hover:text-[#F97316] transition-colors font-medium border-b border-transparent hover:border-gray-400 pb-0.5"
          >
            New instructor? Register here
          </a>
        </div>
      </motion.div>

    </div>
  );
}
