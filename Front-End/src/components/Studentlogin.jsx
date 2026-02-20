import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import API from "../../Api";
import Proctor from "../assets/LOGO.png";
import { Users } from "lucide-react";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/students/login", { email, password });
      login(res.data.token);
      toast.success("Login Successful!");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FDFCF4] overflow-hidden relative font-sans lg:justify-end">
      <Toaster position="top-center" />

      {/* Left Side Background Shape (Full Screen Curve) - Now Anchored Left */}
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
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Welcome back!</h1>
          <p className="text-orange-50/90 text-xl font-light">Pick up where you left off</p>
        </div>

        {/* Illustration Container */}
        <div className="w-[450px] h-[350px] flex items-center justify-center relative">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl transform scale-75"></div>
            <img
              src="https://img.freepik.com/free-vector/team-goals-concept-illustration_114360-5175.jpg?w=740&t=st=1707200000~exp=1707200600~hmac=abc"
              className="relative w-full h-full object-contain mix-blend-screen opacity-90 grayscale-[0.1]"
              alt="Teamwork Illustration"
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

      {/* Right Side: Form - Now Anchored Right via parent justify-end */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 h-full flex flex-col justify-center items-center p-8 sm:p-12 z-10 lg:ml-auto"
      >
        <div className="w-full max-w-md flex flex-col items-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-12 tracking-wide">Sign In</h2>

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
              <p className="text-gray-400 text-xs mb-4 uppercase tracking-wider font-semibold">You're all set up!</p>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-16 py-4 bg-[#F97316] text-white rounded-xl font-semibold hover:bg-[#EA580C] transition-all transform active:scale-95 shadow-xl text-lg disabled:opacity-70"
              >
                {loading ? "..." : "Complete"}
              </button>
            </div>
          </form>

          <a
            href="/student-signup"
            className="mt-16 text-sm text-gray-400 hover:text-[#F97316] transition-colors font-medium border-b border-transparent hover:border-gray-400 pb-0.5"
          >
            Create an account
          </a>
        </div>
      </motion.div>

    </div>
  );
}
