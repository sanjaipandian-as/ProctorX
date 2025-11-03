import { useState } from "react";
import { FaUser, FaEnvelope, FaLock, FaImage, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import API from "../../Api";

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
      toast.custom(
        (t) => (
          <div
            className={`fixed bottom-0 left-0 w-full bg-gray-900/95 backdrop-blur-lg border-t border-cyan-400/30 p-6 rounded-t-2xl shadow-lg text-center transform transition-all duration-500 ease-in-out ${
              t.visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}
          >
            <p className="text-red-400 text-lg mb-5 font-medium">
              Passwords do not match
            </p>
            <button
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold"
              onClick={() => toast.dismiss(t.id)}
            >
              Try Again
            </button>
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

      const res = await API.post("/students/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem("token", res.data.token);

      toast.custom(
        (t) => (
          <div
            className={`fixed bottom-0 left-0 w-full bg-gray-900/95 backdrop-blur-lg border-t border-cyan-400/20 p-6 rounded-t-2xl shadow-lg text-center transform transition-all duration-500 ease-in-out ${
              t.visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}
          >
            <p className="text-white text-lg mb-5 font-medium">
              Account created successfully! 🎉
            </p>
            <button
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
              onClick={() => {
                toast.dismiss(t.id);
                navigate("/Student-login");
              }}
            >
              Continue
            </button>
          </div>
        ),
        { position: "bottom-center", duration: 5000 }
      );

      setTimeout(() => navigate("/Student-login"), 1500);
    } catch (err) {
      toast.custom(
        (t) => (
          <div
            className={`fixed bottom-0 left-0 w-full bg-gray-900/95 backdrop-blur-lg border-t border-red-500/20 p-6 rounded-t-2xl shadow-lg text-center transform transition-all duration-500 ease-in-out ${
              t.visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
            }`}
          >
            <p className="text-red-400 text-lg mb-5 font-medium">
              {err.response?.data?.message || "Error during signup"}
            </p>
            <button
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold"
              onClick={() => toast.dismiss(t.id)}
            >
              Try Again
            </button>
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0e0e0e] px-4 sm:px-6 py-10 relative">
      <Toaster position="bottom-center" />
      <div className="w-full max-w-md sm:max-w-lg bg-gradient-to-br from-[#1a1a1a] to-[#262626] rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 border border-cyan-400/20">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400">
            Student Signup
          </h2>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Create your account to start learning
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm text-gray-300">Full Name</label>
            <div className="relative mt-2">
              <FaUser className="absolute left-3 top-3 text-cyan-400/70" />
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
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
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
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
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300">
              Confirm Password
            </label>
            <div className="relative mt-2">
              <FaLock className="absolute left-3 top-3 text-cyan-400/70" />
              <input
                type="password"
                placeholder="Confirm your password"
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
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
                className="w-full pl-10 pr-3 py-3 rounded-lg bg-[#121212] border border-cyan-400/30 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
                onChange={handleProfileChange}
              />
            </div>
            {preview && (
              <img
                src={preview}
                alt="Profile Preview"
                className="mt-3 w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mx-auto border border-cyan-400/30 shadow-md"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl ${
              loading
                ? "bg-cyan-600 cursor-not-allowed"
                : "bg-cyan-500 hover:bg-cyan-600"
            } text-white font-semibold text-sm sm:text-lg shadow-lg transition-all transform hover:scale-[1.02]`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-gray-800/30 text-gray-400 hover:text-white font-semibold text-sm sm:text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <FaArrowLeft /> Back
          </button>
        </form>

        <div className="mt-6 text-center text-sm sm:text-base text-gray-400">
          Already have an account?{" "}
          <a
            href="/student-login"
            className="hover:underline hover:text-cyan-300"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
