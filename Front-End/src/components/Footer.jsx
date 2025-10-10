import { GraduationCap, Mail, Phone, MapPin, Twitter, Linkedin, Github, Facebook } from "lucide-react";
import { Button } from "../ui/Button";

const footerLinks = {
  platform: [
    { name: "Dashboard", href: "#dashboard" },
    { name: "Create Quiz", href: "#create" },
    { name: "Attempt Quiz", href: "#attempt" },
    { name: "Analytics", href: "#analytics" }
  ],
  features: [
    { name: "AI Proctoring", href: "#proctoring" },
    { name: "Secure Exams", href: "#security" },
    { name: "Real-time Monitoring", href: "#monitoring" },
    { name: "Automated Grading", href: "#grading" }
  ],
  support: [
    { name: "Help Center", href: "#help" },
    { name: "Documentation", href: "#docs" },
    { name: "Contact Us", href: "#contact" },
    { name: "System Status", href: "#status" }
  ],
  company: [
    { name: "About Us", href: "#about" },
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
  return (
    <footer className="bg-black/50 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <GraduationCap className="h-8 w-8" style={{ color: 'var(--neon-blue)' }} />
                <span className="gradient-text text-2xl tracking-wide">ProctorX</span>
              </div>
              <p className="text-white/70 mb-6 max-w-md">
                Revolutionizing online education with AI-powered proctoring and secure assessment solutions. 
                Unlock your potential with the future of learning.
              </p>
              <div className="space-y-3 mb-6">
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-8 lg:col-span-3">
              <div>
                <h3 className="text-white mb-4">Platform</h3>
                <ul className="space-y-3">
                  {footerLinks.platform.map((link, index) => (
                    <li key={index}>
                      <a 
                        href={link.href} 
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-white mb-4">Features</h3>
                <ul className="space-y-3">
                  {footerLinks.features.map((link, index) => (
                    <li key={index}>
                      <a 
                        href={link.href} 
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-white mb-4">Support</h3>
                <ul className="space-y-3">
                  {footerLinks.support.map((link, index) => (
                    <li key={index}>
                      <a 
                        href={link.href} 
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h3 className="text-white text-lg mb-2">Stay Updated</h3>
              <p className="text-white/60">Get the latest updates on new features and educational insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                />
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="py-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-white/60 text-sm">
            © 2024 ProctorX. All rights reserved. Empowering education through technology.
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <a href="#privacy" className="text-white/60 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="text-white/60 hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#cookies" className="text-white/60 hover:text-white transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
