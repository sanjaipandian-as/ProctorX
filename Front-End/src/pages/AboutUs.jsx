import { motion } from "framer-motion";
import {
  Scale,
  Lightbulb,
  Server,
  ArrowRight,
  Cpu,
  Shield,
  LayoutDashboard,
  KeyRound,
  ClipboardEdit,
  Laptop,
  BarChart3,
  MonitorSmartphone,
  Video,
  ScanFace,
  TrendingUp,
  Mail,
  UserCircle,
  Lock,
  Building,
  Moon,
  BrainCircuit,
  View,
  Medal,
  Eye,
  MicVocal,
  Globe,
  Sigma,
  Atom,
  GraduationCap,
} from "lucide-react";

// Animation variants
const sectionFadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

const itemFadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const cardHoverEffect = {
  scale: 1.05,
  transition: { duration: 0.3 },
};

const getGlowClasses = (color) => {
  if (color === "cyan") {
    return {
      text: "text-cyan-400 [text-shadow:0_0_12px_theme(colors.cyan.400)]",
      icon: "text-cyan-400 [filter:drop-shadow(0_0_6px_theme(colors.cyan.500))]",
      border: "hover:border-cyan-500/70 transition-all duration-300",
      shadow: "hover:shadow-[0_0_25px_-5px_theme(colors.cyan.500)]",
    };
  }
  return {
    text: "text-fuchsia-400 [text-shadow:0_0_12px_theme(colors.fuchsia.400)]",
    icon: "text-fuchsia-400 [filter:drop-shadow(0_0_6px_theme(colors.fuchsia.500))]",
    border: "hover:border-fuchsia-500/70 transition-all duration-300",
    shadow: "hover:shadow-[0_0_25px_-5px_theme(colors.fuchsia.500)]",
  };
};

const values = [
  {
    icon: Scale,
    title: "Integrity",
    desc: "We uphold the highest standards of academic honesty, ensuring fairness in every exam.",
    color: "cyan",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    desc: "We harness the power of AI and modern tech to build smarter, more intuitive exam ecosystems.",
    color: "fuchsia",
  },
  {
    icon: Server,
    title: "Reliability",
    desc: "We deliver consistent, robust performance that educators and students can depend on.",
    color: "cyan",
  },
];

const phase1Features = [
  { icon: Cpu, name: "AI-Powered Proctoring" },
  { icon: Shield, name: "Secure Exam Environment" },
  { icon: LayoutDashboard, name: "Smart Quiz Dashboard" },
  { icon: KeyRound, name: "JWT Authentication System" },
  { icon: ClipboardEdit, name: "Quiz Creation & Management" },
  { icon: Laptop, name: "Student Quiz Portal" },
  { icon: BarChart3, name: "Real-time Result Analytics" },
  { icon: MonitorSmartphone, name: "Responsive Modern UI" },
];

const phase2Features = [
  {
    icon: Video,
    title: "Live Exam Recording",
    desc: "Record sessions for later review by administrators.",
  },
  {
    icon: ScanFace,
    title: "Enhanced Face & Voice Detection",
    desc: "Advanced AI models to identify users and noise anomalies.",
  },
  {
    icon: TrendingUp,
    title: "Teacher Insights Dashboard",
    desc: "Visualized reports on performance, alerts, and class trends.",
  },
  {
    icon: Mail,
    title: "Email Notifications & Alerts",
    desc: "Instant updates for quiz submissions and proctor warnings.",
  },
  {
    icon: UserCircle,
    title: "User Profiles & Achievements",
    desc: "Profiles with badges, achievements, and progress stats.",
  },
  {
    icon: Lock,
    title: "Improved Data Privacy",
    desc: "Strengthened backend security for all student and exam data.",
  },
  {
    icon: Building,
    title: "Custom Branding",
    desc: "Allow institutions to personalize the UI with their logo.",
  },
  {
    icon: Moon,
    title: "Dark/Light Theme Toggle",
    desc: "Let users switch between light and neon dark modes.",
  },
];

const phase3Features = [
  {
    icon: BrainCircuit,
    title: "AI Behavior Analysis",
    desc: "Detect abnormal mouse movement, gaze, and response patterns.",
  },
  {
    icon: View,
    title: "Metaverse Classrooms",
    desc: "Host immersive, 3D virtual exams in secure metaverse spaces.",
  },
  {
    icon: Medal,
    title: "Blockchain-Verified Certificates",
    desc: "Provide tamper-proof and easily verifiable exam certifications.",
  },
  {
    icon: Eye,
    title: "Neural Exam Insights",
    desc: "Track attention, stress, and focus using deep learning.",
  },
  {
    icon: MicVocal,
    title: "Voice Command & AI Assistant",
    desc: "Interact with the system using voice commands (powered by OpenAI).",
  },
  {
    icon: Globe,
    title: "Global AI Proctor Network",
    desc: "Connect universities worldwide via live AI-assisted proctoring.",
  },
  {
    icon: Sigma,
    title: "Smart Cheating Prediction",
    desc: "Preemptively identify suspicious attempts before violations occur.",
  },
  {
    icon: Atom,
    title: "Quantum-Safe Encryption",
    desc: "Prepare for next-generation security standards.",
  },
  {
    icon: GraduationCap,
    title: "Predictive Grading System",
    desc: "AI-driven performance predictions based on response patterns.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
        <div
          className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] opacity-20 mix-blend-hard-light"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 217, 255, 1), transparent 60%)",
            filter: "blur(150px)",
          }}
        ></div>
        <div
          className="absolute bottom-[-20%] right-[-20%] w-[700px] h-[700px] opacity-20 mix-blend-hard-light"
          style={{
            background:
              "radial-gradient(circle, rgba(209, 52, 235, 1), transparent 60%)",
            filter: "blur(150px)",
          }}
        ></div>
      </div>

      <motion.div 
        className="relative z-10"
        initial="hidden"
        animate="visible"
        variants={sectionFadeIn}
      >
        <section className="relative flex items-center justify-center min-h-[60vh] py-24 text-center overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <motion.h1
              variants={itemFadeInUp}
              className="text-4xl md:text-7xl font-bold mb-6 text-white"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400">
                Empowering Education
              </span>
              <br />
              Through AI-Driven Proctoring
            </motion.h1>
            <motion.p
              variants={itemFadeInUp}
              className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
            >
              ProctorX ensures secure, transparent, and efficient exam
              experiences powered by modern AI technologies.
            </motion.p>
          </div>
        </section>
        
        <motion.section
          className="py-16 md:py-24"
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Our Mission</h2>
            <p className="text-2xl md:text-3xl font-medium text-slate-200 mb-6">
              To redefine digital education with{" "}
              <span className={getGlowClasses("cyan").text}>trust</span>,{" "}
              <span className={getGlowClasses("fuchsia").text}>fairness</span>,
              and{" "}
              <span className={getGlowClasses("cyan").text}>innovation</span>.
            </p>
            <p className="text-base md:text-lg text-slate-300 leading-relaxed">
              We believe that the future of learning is remote, but that
              shouldn't mean sacrificing integrity. ProctorX bridges the gap by
              blending cutting-edge AI with human insight, making remote exams as
              reliable and secure as any in-person assessment.
            </p>
          </div>
        </motion.section>
        
        <motion.section
          className="py-16 md:py-24"
        >
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-white">
              Our Core Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value) => {
                const glow = getGlowClasses(value.color);
                return (
                  <motion.div
                    key={value.title}
                    variants={itemFadeInUp}
                    whileHover={cardHoverEffect}
                    className={`p-6 md:p-8 rounded-2xl bg-white/5 md:backdrop-blur-lg border border-white/10 cursor-pointer ${glow.border} ${glow.shadow}`}
                  >
                    <value.icon
                      className={`h-10 w-10 mb-5 ${glow.icon}`}
                    />
                    <h3 className="text-2xl font-semibold mb-3 text-white">
                      {value.title}
                    </h3>
                    <p className="text-slate-300">{value.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>
        
        <motion.section
          className="py-16 md:py-24 relative"
        >
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 text-white">
              <span className={getGlowClasses("cyan").text}>Phase 1:</span>{" "}
              Current Features
            </h2>
            <p className="text-center text-base md:text-lg text-slate-400 mb-12 md:mb-16">
              Live and fully functional on the ProctorX platform.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {phase1Features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemFadeInUp}
                  whileHover={{ scale: 1.05 }}
                  className="relative p-6 rounded-2xl bg-white/5 border border-white/10 md:backdrop-blur-md hover:border-cyan-500/50 hover:shadow-[0_0_25px_-5px_theme(colors.cyan.500)] transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-fuchsia-500/10 to-transparent rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-black/40 border border-white/10 mb-4">
                      <feature.icon
                        className={`h-8 w-8 ${getGlowClasses("fuchsia").icon}`}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.name}
                    </h3>
                    <div className="w-10 h-[2px] bg-gradient-to-r from-cyan-400 to-fuchsia-400 rounded-full mb-2"></div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Cutting-edge, production-ready functionality integrated with our
                      core AI-driven system.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="py-16 md:py-28 bg-gradient-to-b from-black via-slate-900 to-black"
        >
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400">
              The Future of ProctorX
            </h2>
            <p className="text-center text-base md:text-lg text-slate-300 mb-12 md:mb-20">
              Building a secure and intelligent digital assessment world.
            </p>

            <div className="grid gap-8 md:gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ...phase2Features.map((item) => ({ ...item, phase: "Coming Soon" })),
                ...phase3Features.map((item) => ({ ...item, phase: "Futuristic" }))
              ].map((item, index) => (
                <motion.div
                  variants={itemFadeInUp}
                  key={item.title + index}
                  className="group p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 md:backdrop-blur-xl shadow-lg hover:shadow-cyan-500/10 transition-all"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-black border border-cyan-500/50 group-hover:border-fuchsia-400 transition-all">
                      <item.icon className={`h-7 w-7 ${getGlowClasses("cyan").icon}`} />
                    </div>
                    <span className="text-sm uppercase tracking-widest text-cyan-400 opacity-80">
                      {item.phase}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="mt-6 w-full h-1 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full opacity-30 group-hover:opacity-100 transition-all"></div>
                </motion.div>
              ))}
              
            </div>
            <motion.div variants={itemFadeInUp} className="max-w-3xl mt-12 md:mt-20 mx-auto">
              <div className="p-6 md:p-10 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-cyan-500/20 border border-cyan-400/30 md:backdrop-blur-xl">
                <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">
                  The Future = ProctorX
                </h3>
                <p className="text-slate-300 text-base md:text-lg mb-6">
                  A world where exams stay secure, AI becomes your trusted partner,
                  and learners prove their true potential — anywhere.
                </p>
                <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-black font-semibold hover:opacity-90 transition">
                  Join the Evolution
                </button>
              </div>
            </motion.div>
          </div>
          
        </motion.section>

        <motion.section
          className="py-16 text-center border-t border-white/10"
        >
          <p className="text-base md:text-lg text-slate-400 px-6">
            Built with passion and precision by the ProctorX Team.
          </p>
        </motion.section>
        
        <motion.section
          className="py-16 md:py-24 text-center"
        >
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
              Join the Future of Secure Assessments
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-base md:text-lg bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 text-white
                        shadow-lg shadow-fuchsia-500/30 transition-all duration-300
                        hover:shadow-xl hover:shadow-fuchsia-500/50"
              style={{ backgroundSize: "200% auto" }}
            >
              Start Your Journey with ProctorX
              <ArrowRight className="h-5 w-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" />
              
            </motion.button>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}

