import { Card, CardContent } from "../ui/Card";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "The future belongs to those who learn more skills and combine them in creative ways.",
    author: "Dr. Sarah Chen",
    highlight: "ProctorX has revolutionized how we conduct online assessments."
  },
  {
    quote: "Intelligence plus character - that is the goal of true education.",
    author: "Marcus Johnson",
    highlight: "The AI proctoring system is incredibly sophisticated yet user-friendly."
  },
  {
    quote: "Education is not preparation for life; education is life itself.",
    author: "Emma Rodriguez",
    highlight: "Students love the seamless experience and instant feedback."
  }
];

const motivationalQuotes = [
  {
    quote: "Success is where preparation and opportunity meet.",
    author: "Bobby Unser"
  },
  {
    quote: "The expert in anything was once a beginner.",
    author: "Helen Hayes"
  },
  {
    quote: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6">
            <span className="gradient-text">Voices of Success</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Hear from educators and students who have transformed their learning journey with ProctorX
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="glass border-white/10 p-6 hover:border-white/20 transition-all duration-300">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between">
                  <Quote className="h-8 w-8 text-blue-400" />
                </div>
                <blockquote className="text-white/90 italic text-lg leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-white">{testimonial.author}</div>
                  <div className="text-sm text-white/60">{testimonial.role}</div>
                  <div className="text-sm gradient-text">{testimonial.institution}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-sm text-white/80">"{testimonial.highlight}"</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10">
          <h3 className="text-2xl md:text-3xl text-center mb-8">
            <span className="gradient-text">Words of Wisdom</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {motivationalQuotes.map((quote, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-white/5 border border-white/10">
                <Quote className="h-6 w-6 text-teal-400 mx-auto mb-4" />
                <blockquote className="text-white/90 italic mb-3">
                  "{quote.quote}"
                </blockquote>
                <cite className="text-sm text-white/60">— {quote.author}</cite>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="inline-block glass rounded-full px-8 py-4 border border-white/20">
            <p className="text-lg text-white/80">
              Ready to <span className="gradient-text">unlock your potential</span>?
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
