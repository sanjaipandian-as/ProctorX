import { Topbar } from "./components/Topbar";
import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Shield, Zap, Award, BookOpen, Users, Star, Clock, Globe, ChevronRight, TrendingUp, CheckCircle2, Play, BarChart3, ShieldCheck, User, Key } from "lucide-react";
import { Button } from "./ui/Button";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../Api";
import LOGO from "./assets/LOGO.png";

const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    viewport={{ once: true, margin: "-100px" }}
    className={`relative overflow-hidden backdrop-blur-md bg-white/70 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const Dashboard = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchPublicQuizzes = async () => {
      try {
        const res = await API.get("/api/quizzes/public");
        const data = Array.isArray(res.data) ? res.data : [];
        if (data.length > 0) {
          setQuizzes(data.slice(0, 4));
        } else {
          setQuizzes([
            { quizId: "QZ-882", title: "Quantum Mechanics", createdBy: { name: "Dr. Elena Vance" }, questionsCount: 45 },
            { quizId: "QZ-451", title: "Neural Networks", createdBy: { name: "Prof. Magnusson" }, questionsCount: 60 },
            { quizId: "QZ-109", title: "Cyber Security", createdBy: { name: "Alice Security" }, questionsCount: 30 },
            { quizId: "QZ-667", title: "Digital Forensics", createdBy: { name: "Agent Smith" }, questionsCount: 50 }
          ]);
        }
      } catch (err) {
        console.error("Error fetching public quizzes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicQuizzes();
  }, []);

  const handleStartQuiz = (quizId) => {
    navigate(`/exam/${quizId}`);
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 selection:bg-orange-100 selection:text-orange-900 font-sans antialiased">
      <Toaster position="bottom-center" />
      <Topbar />

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(255,179,67,0.08),transparent_50%)]">
        <div
          className="absolute pointer-events-none transition-transform duration-300 ease-out opacity-40"
          style={{
            left: mousePosition.x - 250,
            top: mousePosition.y - 250,
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255,179,67,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">The Future of Assessment</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(3.5rem,10vw,8rem)] font-black tracking-tighter leading-[0.85] mb-8 text-gray-900"
            >
              The Science of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB343] to-[#FF9F2E] italic serif-font px-2">
                Excellence
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="max-w-2xl text-xl text-gray-500 font-medium leading-relaxed mb-12"
            >
              ProctorX combines high-fidelity monitoring with intelligent analytics
              to deliver a seamless, high-performance examination experience.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-6"
            >
              <Link to="/student-login">
                <button
                  className="px-12 py-5 bg-[#FFB343] text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/20 group"
                >
                  Access Portal
                  <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <button
                onClick={() => {
                  const section = document.getElementById("features-grid");
                  if (section) section.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center space-x-3 px-8 py-5 text-gray-900 font-bold hover:text-[#FFB343] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group">
                  <Play className="w-4 h-4 fill-current text-orange-400 group-hover:scale-110 transition-transform" />
                </div>
                <span>Watch Product Tour</span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-12 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: "Active Institutions", value: "250+", sub: "Global Partners" },
            { label: "Assessments Hosted", value: "1.2M", sub: "Last 12 Months" },
            { label: "Platform Uptime", value: "99.9%", sub: "Enterprise Grade" }
          ].map((stat, i) => (
            <GlassCard key={i} delay={i * 0.1} className="p-10 border-orange-50 shadow-none hover:shadow-xl hover:shadow-orange-500/5 transition-all group">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-4">{stat.label}</h4>
              <p className="text-5xl font-black tracking-tighter text-gray-900 mb-2 group-hover:text-[#FFB343] transition-colors">{stat.value}</p>
              <p className="text-gray-400 font-medium">{stat.sub}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features-grid" className="px-6 py-32 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-black tracking-tight mb-6 text-gray-900">
                Architected for <br />Precision.
              </h2>
              <p className="text-xl text-gray-500">
                Every feature is engineered to provide absolute integrity and
                a frictionless experience for both educators and students.
              </p>
            </div>
            <button
              onClick={() => {
                const section = document.getElementById("features-list");
                if (section) section.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
            >
              View All Features
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AI Supervision",
                desc: "Real-time behavior analysis and identity verification using proprietary neural engines.",
                icon: ShieldCheck,
                color: "orange"
              },
              {
                title: "Rapid Deployment",
                desc: "Generate complex assessments in seconds with our integrated AI question foundry.",
                icon: Zap,
                color: "blue"
              },
              {
                title: "Deep Analytics",
                desc: "Gain surgical insights into student performance with cross-cohort data sets.",
                icon: BarChart3,
                color: "purple"
              }
            ].map((f, i) => (
              <GlassCard key={i} delay={i * 0.1} className="p-12 group hover:-translate-y-2 transition-all duration-500 shadow-none hover:shadow-2xl hover:shadow-orange-500/5">
                <div className={`w-16 h-16 rounded-2xl mb-8 flex items-center justify-center bg-gray-50 border border-gray-100 group-hover:bg-orange-50 transition-colors`}>
                  <f.icon className="w-8 h-8 text-gray-400 group-hover:text-[#FFB343] transition-colors" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight group-hover:text-[#FFB343] transition-colors">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Live Quizzes */}
      <section id="featured-bank" className="px-6 py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          {/* OTP Access Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 p-8 md:p-12 rounded-[40px] bg-[#0f172a] text-white relative overflow-hidden shadow-2xl shadow-orange-500/10"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <ShieldCheck className="w-64 h-64 text-orange-400" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row items-center gap-8 max-w-2xl">
                <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
                  <Key className="w-10 h-10 text-[#FFB343]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-widest text-[#FFB343] mb-3">Instant Demo Access</h3>
                  <p className="text-gray-400 text-lg font-medium leading-relaxed">
                    To access and experience any premium assessment from the <span className="text-white">Elite Tiers</span> bank,
                    please use the universal demo OTP provided.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2 sm:gap-4">
                  {[0, 0, 0, 0, 0, 0].map((digit, i) => (
                    <div key={i} className="w-12 h-16 sm:w-16 sm:h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl font-mono font-black text-white shadow-2xl group hover:border-[#FFB343]/50 transition-colors">
                      {digit}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-black text-orange-400/60 uppercase tracking-[0.3em]">Universal Access Code</span>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-4 text-gray-900">Elite Tiers</h2>
              <p className="text-gray-500 text-xl font-medium">Featured examinations from our top-tier academic partners.</p>
            </div>
            <button
              onClick={() => navigate("/student-login")}
              className="text-[#FFB343] font-black tracking-widest uppercase text-sm hover:translate-x-2 transition-transform h-auto p-0 flex items-center gap-2"
            >
              Explore Universal Bank <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-[32px] bg-white animate-pulse" />
              ))
            ) : (
              quizzes.map((quiz, i) => (
                <GlassCard key={quiz.quizId} delay={i * 0.05} className="group cursor-pointer hover:shadow-2xl hover:shadow-orange-500/10">
                  <div className="p-8" onClick={() => handleStartQuiz(quiz.quizId)}>
                    <div className="flex justify-between items-start mb-12">
                      <span className="px-4 py-1.5 bg-orange-50 border border-orange-100 text-[#FF9F2E] text-[10px] font-black rounded-full uppercase tracking-widest">
                        {quiz.quizId}
                      </span>
                      <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-[#FFB343] group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2 truncate tracking-tight group-hover:text-[#FFB343] transition-colors">{quiz.title}</h3>
                    <div className="flex items-center space-x-3 text-gray-400 text-sm font-semibold">
                      <User className="w-4 h-4" />
                      <span>{quiz.createdBy?.name || "Official ProctorX"}</span>
                    </div>
                  </div>
                  <div className="px-8 py-5 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{quiz.questionsCount || 20} Modules</span>
                    <span className="text-xs font-bold text-gray-900">Public Access</span>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-32 overflow-hidden relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-black tracking-tight mb-8 text-gray-900 leading-[1.1]">
                Trusted by the <br />
                <span className="text-[#FFB343]">World's Best</span> Educators.
              </h2>
              <div className="flex flex-col gap-8">
                {[
                  {
                    q: "The AI supervision engine is transformative. It's the most reliable system we've integrated.",
                    a: "Dr. Elena Vance",
                    t: "Oxford Cybernetics Lab"
                  },
                  {
                    q: "Security and scale was our primary concern. ProctorX delivered on both counts flawlessly.",
                    a: "James Moriarty",
                    t: "Apex Digital Academy"
                  }
                ].map((t, i) => (
                  <div key={i} className="pl-8 border-l-4 border-orange-100">
                    <p className="text-xl italic font-serif text-gray-600 mb-4 tracking-tight">"{t.q}"</p>
                    <p className="font-black text-gray-900 text-sm uppercase tracking-widest">{t.a}</p>
                    <p className="text-gray-400 text-xs font-bold">{t.t}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[48px] bg-orange-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FFB343]/20 to-transparent" />
                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-orange-200/50 rounded-full animate-ping" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-9xl font-black text-gray-900/5">PROX</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-32">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#FFB343] rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-orange-500/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
            <h2 className="text-[clamp(1.5rem,5vw,3rem)] font-black text-white mb-12 tracking-tight leading-tight relative z-10">
              Ready to redefine the <br /> examination standard?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
              <Link to="/student-login">
                <button className="px-12 py-5 bg-white text-[#FFB343] rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                  Get Started Now
                </button>
              </Link>
              <button className="px-12 py-5 bg-orange-600/20 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600/30 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-20 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-8">
                <img src={LOGO} alt="ProctorX" className="h-10 w-10" />
                <span className="text-2xl font-black tracking-tighter text-gray-900">ProctorX</span>
              </div>
              <p className="text-gray-500 font-medium max-w-sm leading-relaxed">
                Standardizing the future of academic and professional
                certification through hardware-agnostic digital supervision.
              </p>
            </div>
            {[
              { title: "Network", links: ["Public Quizzes", "Institutions", "Global Stats"] },
              { title: "Company", links: ["Architecture", "Security Lab", "Partnerships"] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm font-bold text-gray-900 hover:text-[#FFB343] transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">© 2024 ProctorX Intelligence Labs</span>
            <div className="flex items-center space-x-8">
              {['Twitter', 'GitHub', 'LinkedIn'].map((s) => (
                <a key={s} href="#" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
