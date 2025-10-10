import React from "react";
import { Topbar } from "./components/Topbar";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Features } from "./components/Feautures";
import { QuizGrid } from "./components/QuizGrid";
import { Testimonials } from "./components/Testimonials";
import { Footer } from "./components/Footer";

function Dashboard() {
  return (
    <div className="w-full bg-black text-white relative overflow-x-hidden">
      <Topbar />


      <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 pt-12 pb-16">
        <span className="flex items-center justify-center px-4 py-1 rounded-full bg-black/80 border border-gray-700 text-sm md:text-base text-gray-300 space-x-1 mb-6">
          <Sparkles className="h-5 w-5 text-teal-400" />
          <span>Future Of Learning</span>
        </span>


        <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Unlock Your
          </span>{" "}
          <span className="text-white">Potential</span>
        </h1>

        <p className="text-xl md:text-2xl italic text-gray-300 max-w-3xl mb-6">
          "Education is the most powerful weapon which you can use to change the world.
          Experience the future of online examinations with AI-powered proctoring."
        </p>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12">
          Transform your learning journey with{" "}
          <span className="bg-gradient-to-r text-2xl font-bold from-[#00d9ff] to-[#8b5cf6] bg-clip-text text-transparent font-semibold">ProctorX</span> – where technology meets education to create{" "}
          <span className="text-cyan-400 font-semibold">Exams Made Smarter</span>
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          <button className="flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg hover:opacity-80 transition">
            <span>Start Your Journey</span>
            <ArrowRight size={20} />
          </button>
          <button className="flex items-center space-x-2 px-8 py-4 rounded-xl bg-black border border-gray-600 text-white text-lg hover:bg-gray-800 transition">
            <Play size={20} />
            <span>Watch Demo</span>
          </button>
        </div>
      </div>


      <Features />
      <QuizGrid />
      <Testimonials />
      <Footer />
    </div>
  );
}

export default Dashboard;
