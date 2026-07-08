import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Shield, ArrowLeft } from "lucide-react";
import api from "../lib/api";
import toast, { Toaster } from "react-hot-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Map email to username for admin login backend schema compatibility
      const res = await api.post("/api/admin/login", { username: email, password });
      
      // Store token
      localStorage.setItem("token", res.data.token); // Store in central token key so api.js interceptor automatically picks it up!
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminAuth", "true");
      localStorage.setItem("adminName", res.data.admin.username);
      localStorage.setItem("adminRole", "admin");

      toast.success("Login successful!");
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div 
      className="h-screen w-screen flex items-center justify-center bg-gray-50 p-4 font-sans"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      <Toaster position="top-center" />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Admin Gateway</h2>
          <p className="text-gray-500 text-xs mt-1.5 font-medium">Authorized personnel only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Username / Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-gray-400 w-3.5 h-3.5" />
              <input
                type="password"
                placeholder="Enter admin password"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-black text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-black hover:bg-gray-900 text-white font-bold text-sm transition-all shadow-md mt-2"
          >
            Authenticate
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full py-3.5 rounded-xl bg-white text-gray-600 hover:text-black font-bold text-sm border border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </button>
        </form>

        {error && (
          <div className="mt-5 p-3 bg-red-50 border border-red-100 rounded-lg text-center text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <p className="text-center text-gray-400 text-[10px] mt-8 font-medium">
          &copy; {new Date().getFullYear()} ProctorX. Admin Access Only.
        </p>
      </div>
    </div>
  );
}
