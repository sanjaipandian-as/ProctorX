import { GraduationCap, Mail, Phone, MapPin, Twitter, Linkedin, Github, Facebook } from "lucide-react";
import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";

const footerLinks = {
  platform: [
    { name: "Dashboard", href: "/" },
    { name: "Create Quiz", href: "#create" },
    { name: "Attempt Quiz", href: "#QuizGrid" },
    { name: "Analytics", href: "#analytics" }
  ],
  features: [
    { name: "AI Proctoring", href: "/about-us" },
    { name: "Secure Exams", href: "/about-us" },
    { name: "Real-time Monitoring", href: "/about-us" },
    { name: "Automated Grading", href: "/about-us" }
  ],
  support: [
    { name: "Help Center", href: "#help" },
    { name: "Documentation", href: "#docs" },
    { name: "Contact Us", href: "#contact" },
    { name: "System Status", href: "#status" }
  ],
  company: [
    { name: "About Us", href: "/about-us" },
    { name: "Careers", href: "#careers" },
    { name: "Privacy Policy", href: "#privacy" },
    { name: "Terms of Service", href: "#terms" }
  ]
};

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
  { name: "GitHub", icon: Github, href: "#" },
  { name: "Facebook", icon: Facebook, href: "#" }
];

export function Footer() {
  const navigate = useNavigate();

  const handleLinkClick = (e, href) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.replace("#", "");
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    } else if (href.startsWith("/")) {
      e.preventDefault();
      navigate(href);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-black/50 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex items-center space-x-2 mb-6">
                <GraduationCap className="h-8 w-8" style={{ color: 'var(--neon-blue)' }} />
                <span className="gradient-text text-2xl tracking-wide">ProctorX</span>
              </div>
              <p className="text-white/70 mb-6 max-w-md">
                Revolutionizing online education with AI-powered proctoring and secure assessment solutions.
                Unlock your potential with the future of learning.
              </p>
              <div className="space-y-3 mb-6 flex flex-col items-center lg:items-start">
                <div className="flex items-center space-x-3 text-white/60">
                  <Mail className="h-4 w-4" />
                  <span>contact: proctorxofficial@gmail.com</span>
                </div>
                <div className="flex items-center space-x-3 text-white/60">
                  <Phone className="h-4 w-4" />
                  <span>+91 XXXXXXXXXX</span>
                </div>
                <div className="flex items-center space-x-3 text-white/60">
                  <MapPin className="h-4 w-4" />
                  <span>Tamil Nadu, IN</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {socialLinks.map((social, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="icon"
                    className="glass border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                  >
                    <social.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:col-span-3 text-center md:text-left">
              {Object.entries(footerLinks).map(([key, links]) => (
                <div key={key}>
                  <h3 className="text-white mb-4 capitalize">{key}</h3>
                  <ul className="space-y-3 flex flex-col items-center md:items-start">
                    {links.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          onClick={(e) => handleLinkClick(e, link.href)}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-white text-lg mb-2">Stay Updated</h3>
              <p className="text-white/60">Get the latest updates on new features and educational insights</p>
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 sm:gap-0 sm:space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 w-full sm:flex-1 md:w-auto"
              />
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 w-full sm:w-auto">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-white/60 text-sm text-center md:text-left">
            © 2024 ProctorX. All rights reserved. Empowering education through technology.
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm">
            <a href="#privacy" onClick={(e) => handleLinkClick(e, "#privacy")} className="text-white/60 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" onClick={(e) => handleLinkClick(e, "#terms")} className="text-white/60 hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#cookies" onClick={(e) => handleLinkClick(e, "#cookies")} className="text-white/60 hover:text-white transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
