import { Topbar } from "./components/Topbar";
import React, { useState, useEffect } from "react";
import { ArrowRight, ShieldCheck, Zap, BarChart3, User, Key, Play } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import API from "../Api";
import LOGO from "./assets/LOGO.png";

const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    viewport={{ once: true, margin: "-50px" }}
    className={`bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden ${className}`}
  >
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
    <div
      className="bg-gray-50 min-h-screen text-gray-900 font-sans antialiased overflow-x-hidden selection:bg-black selection:text-white"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
    >
      <Toaster position="bottom-center" />
      <Topbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden bg-white min-h-[75vh] flex flex-col justify-center rounded-b-[48px] shadow-sm">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-100"
        >
          <source src="/hills.mp4" type="video/mp4" />
        </video>

        <div className="max-w-6xl mx-auto relative z-10 border-b border-gray-100/50 pb-8">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">The Future of Assessment</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-black"
            >
              The Science of <br className="hidden md:block" />
              <span className="text-gray-400"> Excellence</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-xl text-sm md:text-base text-gray-500 font-medium leading-relaxed mb-8"
            >
              ProctorX combines high-fidelity monitoring with intelligent analytics
              to deliver a seamless, high-performance examination experience.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Link to="/student-login">
                <button
                  className="px-8 py-3.5 bg-black text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition-all shadow-sm group flex items-center justify-center"
                >
                  Access Portal
                  <ArrowRight className="inline-block ml-2 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <button
                onClick={() => {
                  const section = document.getElementById("features-grid");
                  if (section) section.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center space-x-2.5 px-6 py-3.5 text-gray-600 font-bold hover:text-black transition-colors text-xs uppercase tracking-wider"
              >
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group border border-gray-200">
                  <Play className="w-3 h-3 fill-current text-black group-hover:scale-110 transition-transform" />
                </div>
                <span>Watch Tour</span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 pt-6 pb-12 relative bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Active Institutions", value: "250+", sub: "Global Partners" },
            { label: "Assessments Hosted", value: "1.2M", sub: "Last 12 Months" },
            { label: "Platform Uptime", value: "99.9%", sub: "Enterprise Grade" }
          ].map((stat, i) => (
            <GlassCard key={i} delay={i * 0.1} className="p-6 hover:shadow-md transition-all group">
              <h4 className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-3">{stat.label}</h4>
              <p className="text-3xl font-extrabold tracking-tight text-black mb-1">{stat.value}</p>
              <p className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">{stat.sub}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features-grid" className="px-6 py-16 md:py-24 relative bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-black">
                Architected for Precision
              </h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Every feature is engineered to provide absolute integrity and
                a frictionless experience for both educators and students.
              </p>
            </div>
            <button
              onClick={() => {
                const section = document.getElementById("features-list");
                if (section) section.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-2.5 bg-white border border-gray-200 text-black rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm"
            >
              View All Features
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "AI Supervision",
                desc: "Real-time behavior analysis and identity verification using proprietary neural engines.",
                icon: ShieldCheck
              },
              {
                title: "Rapid Deployment",
                desc: "Generate complex assessments in seconds with our integrated AI question foundry.",
                icon: Zap
              },
              {
                title: "Deep Analytics",
                desc: "Gain surgical insights into student performance with cross-cohort data sets.",
                icon: BarChart3
              }
            ].map((f, i) => (
              <GlassCard key={i} delay={i * 0.1} className="p-8 group hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center bg-gray-50 border border-gray-200 transition-colors group-hover:bg-black">
                  <f.icon className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-extrabold text-black mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Live Quizzes */}
      <section id="featured-bank" className="px-6 py-16 md:py-24 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          {/* OTP Access Notice */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 p-8 rounded-2xl bg-gray-50 border border-gray-200 text-black relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <ShieldCheck className="w-48 h-48 text-black" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-6 max-w-lg">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-gray-200 shrink-0">
                  <Key className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-black mb-2">Instant Demo Access</h3>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed">
                    To access and experience any premium assessment from the <span className="text-black font-extrabold">Elite Tiers</span> bank,
                    please use the universal demo OTP provided.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  {[0, 0, 0, 0, 0, 0].map((digit, i) => (
                    <div key={i} className="w-8 h-10 sm:w-10 sm:h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-lg sm:text-xl font-mono font-extrabold text-black">
                      {digit}
                    </div>
                  ))}
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Universal Access Code</span>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-black">Elite Tiers</h2>
              <p className="text-gray-500 text-sm font-medium">Featured examinations from our top-tier academic partners.</p>
            </div>
            <button
              onClick={() => navigate("/student-login")}
              className="text-black font-bold tracking-wider uppercase text-xs hover:translate-x-1 transition-transform h-auto p-0 flex items-center gap-1.5"
            >
              Explore Bank <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-gray-50 border border-gray-100 animate-pulse" />
              ))
            ) : (
              quizzes.map((quiz, i) => (
                <GlassCard key={quiz.quizId} delay={i * 0.05} className="group cursor-pointer hover:border-gray-300 transition-colors">
                  <div className="p-6" onClick={() => handleStartQuiz(quiz.quizId)}>
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-3 py-1 bg-gray-100 border border-gray-200 text-black text-[9px] font-bold rounded-md uppercase tracking-widest">
                        {quiz.quizId}
                      </span>
                      <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-black group-hover:text-white transition-all">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                    <h3 className="text-lg font-extrabold text-black mb-1.5 truncate tracking-tight">{quiz.title}</h3>
                    <div className="flex items-center space-x-2 text-gray-500 text-xs font-semibold">
                      <User className="w-3.5 h-3.5" />
                      <span>{quiz.createdBy?.name || "Official ProctorX"}</span>
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{quiz.questionsCount || 20} Modules</span>
                    <span className="text-[10px] font-bold text-black uppercase tracking-wider">Public Access</span>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-16 md:py-24 overflow-hidden relative bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-8 text-black leading-[1.2]">
                Trusted by the <br />
                <span className="text-gray-400">World's Best</span> Educators.
              </h2>
              <div className="flex flex-col gap-6">
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
                  <div key={i} className="pl-6 border-l-2 border-gray-300">
                    <p className="text-sm italic font-medium text-gray-600 mb-3 leading-relaxed">"{t.q}"</p>
                    <p className="font-extrabold text-black text-[10px] uppercase tracking-widest">{t.a}</p>
                    <p className="text-gray-500 text-[10px] font-bold">{t.t}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-white border border-gray-200 relative overflow-hidden shadow-sm flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-transparent" />
                <div className="absolute w-1/2 h-1/2 border border-gray-100 rounded-full animate-pulse" />
                <span className="text-6xl md:text-8xl font-extrabold text-gray-50 tracking-tighter z-10 relative">PROX</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 md:py-24 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black rounded-3xl p-10 md:p-16 text-center relative overflow-hidden shadow-lg">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-8 tracking-tight leading-tight relative z-10">
              Ready to redefine the <br /> examination standard?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link to="/student-login">
                <button className="px-8 py-3.5 bg-white text-black rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-all">
                  Get Started Now
                </button>
              </Link>
              <button className="px-8 py-3.5 bg-transparent border border-gray-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-gray-900 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
                  PX
                </div>
                <span className="text-xl font-extrabold tracking-tight text-black">ProctorX</span>
              </div>
              <p className="text-gray-500 font-medium text-xs max-w-sm leading-relaxed">
                Standardizing the future of academic and professional
                certification through hardware-agnostic digital supervision.
              </p>
            </div>
            {[
              { title: "Network", links: ["Public Quizzes", "Institutions", "Global Stats"] },
              { title: "Company", links: ["Architecture", "Security Lab", "Partnerships"] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-gray-400 mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-xs font-bold text-gray-600 hover:text-black transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">© 2026 ProctorX Intelligence Labs</span>
            <div className="flex items-center space-x-6">
              {['Twitter', 'GitHub', 'LinkedIn'].map((s) => (
                <a key={s} href="#" className="text-[9px] font-extrabold text-gray-400 hover:text-black transition-colors uppercase tracking-widest">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
