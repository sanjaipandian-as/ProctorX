import React, { useRef, useState, useEffect } from "react";
import { Topbar } from "./components/Topbar";
import {
  ArrowRight, Play, Sparkles, Shield, Zap, Award, BookOpen, Users, Star,
  Clock, TrendingUp, CheckCircle2, ChevronRight, Globe
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

// --- Data ---
const features = [
  {
    icon: Shield,
    title: "AI Integrity",
    description: "Military-grade proctoring with real-time facial analysis.",
    color: "text-blue-600",
    gradient: "from-blue-500/20 to-blue-600/5",
    delay: 0.1
  },
  {
    icon: Zap,
    title: "Instant Analytics",
    description: "Deep insights into student performance in milliseconds.",
    color: "text-violet-600",
    gradient: "from-violet-500/20 to-violet-600/5",
    delay: 0.2
  },
  {
    icon: Award,
    title: "Smart Grading",
    description: "Automated evaluation for complex question types.",
    color: "text-emerald-600",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    delay: 0.3
  },
  {
    icon: BookOpen,
    title: "Question Vault",
    description: "Access a community-driven bank of premium content.",
    color: "text-rose-600",
    gradient: "from-rose-500/20 to-rose-600/5",
    delay: 0.4
  }
];

const quizzes = [
  {
    quizId: "QZ708443",
    title: "General Knowledge",
    category: "General",
    duration: "45m",
    participants: "1.2k",
    rating: 4.8,
    difficulty: "Medium",
    color: "bg-blue-500"
  },
  {
    quizId: "QZ840043",
    title: "CS Fundamentals",
    category: "Tech",
    duration: "60m",
    participants: "892",
    rating: 4.9,
    difficulty: "Hard",
    color: "bg-violet-500"
  },
  {
    quizId: "QZ303385",
    title: "World History",
    category: "History",
    duration: "40m",
    participants: "634",
    rating: 4.7,
    difficulty: "Easy",
    color: "bg-amber-500"
  },
  {
    quizId: "QZ588027",
    title: "Mathematics",
    category: "Science",
    duration: "50m",
    participants: "523",
    rating: 4.6,
    difficulty: "Medium",
    color: "bg-rose-500"
  }
];

const stats = [
  { value: "50k+", label: "Active Learners" },
  { value: "99.9%", label: "Uptime Guarentee" },
  { value: "10k+", label: "Quizzes Created" },
  { value: "4.8", label: "App Store Rating" }
];

const testimonials = [
  {
    quote: "It’s rare to find software that feels this polished. The AI proctoring is invisible yet effective.",
    author: "Dr. Sarah Chen",
    role: "Dean, Stanford",
    avatar: "SC"
  },
  {
    quote: "Finally, an assessment platform that doesn't feel like a spreadsheet. It's actually fun to use.",
    author: "Marcus Johnson",
    role: "Student, MIT",
    avatar: "MJ"
  }
];

// --- Components ---

const AnimatedBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
    <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-400/10 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000" />
    <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-pink-400/10 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
  </div>
);

const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    viewport={{ once: true, margin: "-50px" }}
    className={`relative overflow-hidden backdrop-blur-xl bg-white/40 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const featuresRef = useRef(null);
  const quizRef = useRef(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const y = useTransform(scrollY, [0, 300], [0, 50]);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStartQuiz = (quizId) => {
    if (!user) {
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white/90 backdrop-blur-md border border-gray-200 p-6 rounded-2xl shadow-2xl max-w-sm w-full"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100/50 rounded-full">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Authentication Required</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              To ensure the integrity of our assessments, please sign in to continue.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => { toast.dismiss(t.id); navigate("/student-login"); }}
                className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.dismiss(t.id)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      ));
      return;
    }
    navigate(`/exam/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      <AnimatedBackground />
      <Toaster position="bottom-center" />
      <Topbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            style={{ opacity, y }}
            className="flex flex-col items-center text-center relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-gray-200/60 backdrop-blur-sm mb-8 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-600 tracking-wide">NEXT GEN PROCTORING</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold tracking-tighter text-gray-900 mb-8 max-w-4xl leading-[0.9]"
            >
              Mastery Measured <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 italic font-serif pr-2">
                Perfectly.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-500 max-w-2xl mb-12 leading-relaxed font-light"
            >
              The most advanced AI-driven assessment platform designed for the modern world of education. Secure, scalable, and stunningly simple.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                onClick={() => scrollToSection(quizRef)}
                className="h-14 px-8 rounded-full bg-gray-900 hover:bg-gray-800 text-white text-lg font-medium shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Start Assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                onClick={() => scrollToSection(featuresRef)}
                variant="outline"
                className="h-14 px-8 rounded-full border-gray-200 bg-white/50 backdrop-blur-md hover:bg-white text-gray-900 text-lg font-medium transition-all hover:scale-105"
              >
                Explore Features
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Overlay */}
          <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-4 px-4">
            {stats.map((stat, i) => (
              <GlassCard key={i} delay={0.4 + (i * 0.1)} className="p-6 text-center hover:bg-white/60 transition-colors">
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid (Bento Style) */}
      <section ref={featuresRef} className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Intelligence baked in.
            </h2>
            <div className="h-1 w-20 bg-blue-600 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: feature.delay }}
                viewport={{ once: true }}
                className={`group relative p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiz Collection */}
      <section ref={quizRef} className="py-32 bg-white/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-blue-600 font-medium">
                <Globe className="w-5 h-5 animate-pulse" />
                <span>Global Challenges</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                Featured Assessments
              </h2>
            </div>
            <Button
              variant="ghost"
              className="group text-lg font-medium text-gray-600 hover:text-blue-600"
              onClick={() => user ? navigate("/student-dashboard") : navigate("/student-login")}
            >
              View All Quizzes
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {quizzes.map((quiz, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                onClick={() => handleStartQuiz(quiz.quizId)}
                className="group cursor-pointer relative bg-white rounded-3xl p-1 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative h-full p-8 rounded-[20px] bg-slate-50 overflow-hidden">
                  {/* Decorative Circle */}
                  <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-10 ${quiz.color}`} />

                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white ${quiz.color} shadow-lg shadow-blue-500/20`}>
                      {quiz.category}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold bg-white px-3 py-1 rounded-full shadow-sm">
                      <Star className="w-4 h-4 fill-current" />
                      {quiz.rating}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {quiz.title}
                  </h3>
                  <div className="flex gap-4 text-sm text-gray-500 mb-8 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {quiz.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> {quiz.participants}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      {quiz.difficulty} Level
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-45">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Loved by the best.</h2>
              <p className="text-xl text-gray-500 mb-8 leading-relaxed">
                See why Ivy League institutions and top-tier companies trust ProctorX for their most critical assessments.
              </p>
              <div className="flex gap-4">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                      U{i}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">from 2000+ reviews</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {testimonials.map((t, i) => (
                <GlassCard key={i} className="p-8 hover:scale-[1.02] transition-transform">
                  <p className="text-lg text-gray-700 font-medium leading-relaxed mb-6">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{t.author}</div>
                      <div className="text-sm text-gray-500">{t.role}</div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modern Simple Footer */}
      <footer className="py-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-xl tracking-tight">ProctorX</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500 font-medium">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Twitter</a>
          </div>
          <div className="text-sm text-gray-400">
            © 2024 ProctorX Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
