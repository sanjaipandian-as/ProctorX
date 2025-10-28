import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import { Brain, Shield, BarChart3, Users, Eye, Lock, Zap, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import "../index.css";

const features = [
    {
        icon: Brain,
        title: "AI Proctoring",
        description: "Advanced artificial intelligence monitors and ensures exam integrity in real-time",
        image: "https://images.unsplash.com/photo-1674027444636-ce7379d51252?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaSUyMGFydGlmaWNpYWwlMjBpbnRlbGxpZ2VuY2UlMjBicmFpbnxlbnwxfHx8fDE3NTg1NTQxMjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
        color: "var(--neon-blue)"
    },
    {
        icon: Shield,
        title: "Secure Exams",
        description: "Bank-level security ensures your assessments remain confidential and tamper-proof",
        image: "https://examonline.in/wp-content/uploads/2021/06/Secure-Exam-Browser.png",
        color: "var(--neon-purple)"
    },
    {
        icon: BarChart3,
        title: "Student Dashboard",
        description: "Comprehensive analytics and progress tracking for enhanced learning outcomes",
        image: "https://mir-s3-cdn-cf.behance.net/project_modules/1400/2ee9ef186898989.657d81d67f18e.png",
        color: "var(--neon-teal)"
    },
    {
        icon: Users,
        title: "Teacher Tools",
        description: "Powerful administration tools for creating, managing, and analyzing assessments",
        image: "https://itsm.tools/wp-content/uploads/2019/07/staff-training.jpg",
        color: "var(--neon-blue)"
    }
];

const additionalFeatures = [
    { icon: Eye, title: "Real-time Monitoring", color: "var(--neon-blue)" },
    { icon: Lock, title: "Data Encryption", color: "var(--neon-purple)" },
    { icon: Zap, title: "Instant Results", color: "var(--neon-teal)" },
    { icon: CheckCircle, title: "Automated Grading", color: "var(--neon-blue)" }
];



export function Features() {
    return (
        <section id="Features" className="py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                <div className="text-center mb-16">
                    <h2 className="bg-gradient-to-r text-4xl sm:text-5xl font-bold from-[#00d9ff] via-[#8b5cf6] to-[#14b8a6] bg-clip-text text-transparent mb-6">
                        Revolutionary Features
                    </h2>


                    <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto">
                        Experience the next generation of online education with cutting-edge technology
                        that ensures integrity, security, and excellence in every assessment.
                    </p>
                </div>


                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {features.map((feature, index) => (
                        <Card key={index} className="glass border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300">
                            <div className="relative h-40 sm:h-48 overflow-hidden">
                                <ImageWithFallback
                                    src={feature.image}
                                    alt={feature.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <feature.icon
                                        className="h-8 w-8 mb-2"
                                        style={{ color: feature.color }}
                                    />
                                </div>
                            </div>
                            <CardHeader>
                                <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                                <CardDescription className="text-white/70">
                                    {feature.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>


                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-xl p-4 sm:p-6">
                    {additionalFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className="glass rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center border border-white/10 hover:bg-white/5 transition-all duration-300"
                        >
                            <feature.icon
                                className="h-8 w-8 sm:h-10 sm:w-10 mb-4"
                                style={{ color: feature.color }}
                            />
                            <h3 className="text-sm sm:text-base md:text-lg font-medium text-white leading-snug">
                                {feature.title}
                            </h3>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <div className="glass rounded-2xl p-6 sm:p-8 border border-white/10">
                        <h3 className="text-2xl md:text-3xl mb-4">
                            <span className="gradient-text">Exams Made Smarter</span>
                        </h3>
                        <p className="text-base sm:text-lg text-white/70">
                            Join thousands of educators and students who have transformed their assessment experience
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
