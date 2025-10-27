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

// Helper function to create neon glow classes
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

// --- Data Arrays ---
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

// --- Main Component ---
export default function About() {
  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans relative overflow-hidden">
      {/* Neon Aurora Background */}
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

      {/* Main Content (relative z-10) */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative flex items-center justify-center min-h-[60vh] py-24 text-center overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-5xl md:text-7xl font-bold mb-6 text-white"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400">
                Empowering Education
              </span>
              <br />
              Through AI-Driven Proctoring
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
            >
              ProctorX ensures secure, transparent, and efficient exam
              experiences powered by modern AI technologies.
            </motion.p>
          </div>
        </section>

        {/* Our Mission Section */}
        <motion.section
          variants={sectionFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="py-24"
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6 text-white">Our Mission</h2>
            <p className="text-3xl font-medium text-slate-200 mb-6">
              To redefine digital education with{" "}
              <span className={getGlowClasses("cyan").text}>trust</span>,{" "}
              <span className={getGlowClasses("fuchsia").text}>fairness</span>,
              and{" "}
              <span className={getGlowClasses("cyan").text}>innovation</span>.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              We believe that the future of learning is remote, but that
              shouldn't mean sacrificing integrity. ProctorX bridges the gap by
              blending cutting-edge AI with human insight, making remote exams as
              reliable and secure as any in-person assessment.
            </p>
          </div>
        </motion.section>

        {/* Our Values Section */}
        <motion.section
          variants={sectionFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="py-24"
        >
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-16 text-white">
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
                    className={`p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 cursor-pointer ${glow.border} ${glow.shadow}`}
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

        {/* --- PHASE 1: CURRENT FEATURES (NEW DESIGN) --- */}
        <motion.section
          variants={sectionFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="py-24"
        >
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-4 text-white">
              <span className={getGlowClasses("cyan").text}>Phase 1:</span>{" "}
              Current Features
            </h2>
            <p className="text-center text-lg text-slate-400 mb-16">
              Live and fully functional on the ProctorX platform.
            </p>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-10">
              <ul className="columns-2 md:columns-4 gap-x-8 gap-y-6">
                {phase1Features.map((feature) => (
                  <motion.li
                    key={feature.name}
                    variants={itemFadeInUp}
                    className="flex items-center gap-4 mb-4 break-inside-avoid"
                  >
                    <feature.icon
                      className={`h-7 w-7 ${
                        getGlowClasses("fuchsia").icon
                      } flex-shrink-0`}
                    />
                    <span className="text-lg font-medium text-slate-100">
                      {feature.name}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        {/* --- ROADMAP SECTION (PHASE 2 & 3 - NEW DESIGN) --- */}
        <motion.section
          variants={sectionFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="py-24"
        >
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-4 text-white">
              The ProctorX Roadmap
            </h2>
            <p className="text-center text-lg text-slate-400 mb-24">
              Our vision for the next generation of digital education.
            </p>

            {/* Timeline Container */}
            <div className="relative">
              {/* The glowing timeline "spine" */}
              <div
                className="absolute left-4 w-1 h-full bg-cyan-900 rounded-full
                           md:left-1/2 md:-translate-x-1/2"
              >
                <div
                  className="w-full h-full bg-cyan-500 rounded-full"
                  style={{
                    boxShadow: "0 0 15px theme(colors.cyan.400)",
                  }}
                ></div>
              </div>

              {/* --- PHASE 2 NODE (Left on desktop, full on mobile) --- */}
              <motion.div
                variants={itemFadeInUp}
                className="relative w-full pl-16 md:w-1/2 md:pr-12 md:pl-0 mb-16"
              >
                {/* Timeline Dot */}
                <div
                  className="absolute top-8 left-[-8px] w-6 h-6 rounded-full bg-black border-4 border-cyan-400
                             shadow-[0_0_15px_theme(colors.cyan.400)]"
                ></div>
                
                {/* Content Box */}
                <div className="p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl">
                  <h3
                    className={`text-3xl font-bold mb-6 ${
                      getGlowClasses("fuchsia").text
                    }`}
                  >
                    Phase 2: Upcoming
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {phase2Features.map((item) => (
                      <div key={item.title}>
                        <item.icon
                          className={`h-7 w-7 mb-2 ${
                            getGlowClasses("cyan").icon
                          }`}
                        />
                        <h4 className="text-lg font-semibold mb-1 text-white">
                          {item.title}
                        </h4>
                        <p className="text-slate-300 text-sm">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* --- PHASE 3 NODE (Right on desktop, full on mobile) --- */}
              <motion.div
                variants={itemFadeInUp}
                className="relative w-full pl-16 md:w-1/2 md:ml-auto md:pl-12"
              >
                {/* Timeline Dot */}
                <div
                  className="absolute top-8 left-[-8px] w-6 h-6 rounded-full bg-black border-4 border-fuchsia-400
                             shadow-[0_0_15px_theme(colors.fuchsia.400)]"
                ></div>
                
                {/* Content Box */}
                <div className="p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl">
                  <h3
                    className={`text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400`}
                  >
                    Phase 3: Futuristic Plans
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {phase3Features.map((item) => (
                      <div key={item.title}>
                        <item.icon
                          className={`h-7 w-7 mb-2 ${
                            getGlowClasses("fuchsia").icon
                          }`}
                        />
                        <h4 className="text-lg font-semibold mb-1 text-white">
                          {item.title}
                        </h4>
                        <p className="text-slate-300 text-sm">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Team Section */}
        <motion.section
          variants={sectionFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="py-16 text-center border-t border-white/10"
        >
          <p className="text-lg text-slate-400">
            Built with passion and precision by the ProctorX Team.
          </p>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          variants={sectionFadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="py-24 text-center"
        >
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-8 text-white">
              Join the Future of Secure Assessments
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-lg bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 text-white
                         shadow-lg shadow-fuchsia-500/30 transition-all duration-300
                         hover:shadow-xl hover:shadow-fuchsia-500/50"
              style={{ backgroundSize: "200% auto" }}
            >
              Start Your Journey with ProctorX
              <ArrowRight className="h-5 w-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

