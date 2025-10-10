import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Clock, Users, Star, Play, BookOpen, Laptop, Calculator, Globe } from "lucide-react";

const quizzes = [
  {
    title: "Advanced Mathematics",
    description: "Calculus, Linear Algebra, and Statistics",
    duration: "2 hours",
    participants: 1247,
    rating: 4.8,
    difficulty: "Advanced",
    icon: Calculator,
    color: "var(--neon-blue)"
  },
  {
    title: "Computer Science Fundamentals",
    description: "Data Structures, Algorithms, and Programming",
    duration: "1.5 hours",
    participants: 892,
    rating: 4.9,
    difficulty: "Intermediate",
    icon: Laptop,
    color: "var(--neon-purple)"
  },
  {
    title: "World History",
    description: "Ancient Civilizations to Modern Era",
    duration: "1 hour",
    participants: 634,
    rating: 4.7,
    difficulty: "Beginner",
    icon: Globe,
    color: "var(--neon-teal)"
  },
  {
    title: "English Literature",
    description: "Shakespeare, Poetry, and Critical Analysis",
    duration: "1.5 hours",
    participants: 523,
    rating: 4.6,
    difficulty: "Intermediate",
    icon: BookOpen,
    color: "var(--neon-blue)"
  }
];

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case "Beginner": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "Intermediate": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "Advanced": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

export function QuizGrid() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6">
            <span className="gradient-text">Featured Assessments</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Discover a world of knowledge with our curated collection of 
            interactive quizzes and examinations designed to challenge and inspire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {quizzes.map((quiz, index) => (
            <Card key={index} className="glass border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-300 hover:neon-glow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <quiz.icon 
                        className="h-6 w-6" 
                        style={{ color: quiz.color }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg group-hover:gradient-text transition-all duration-300">
                        {quiz.title}
                      </CardTitle>
                      <CardDescription className="text-white/60">
                        {quiz.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getDifficultyColor(quiz.difficulty)}>
                    {quiz.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{quiz.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{quiz.participants.toLocaleString()} participants</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{quiz.rating}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 group-hover:neon-glow transition-all duration-300"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Assessment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass rounded-lg p-6 text-center">
            <div className="text-3xl gradient-text mb-2">50,000+</div>
            <div className="text-white/70">Active Students</div>
          </div>
          <div className="glass rounded-lg p-6 text-center">
            <div className="text-3xl gradient-text mb-2">10,000+</div>
            <div className="text-white/70">Assessments Created</div>
          </div>
          <div className="glass rounded-lg p-6 text-center">
            <div className="text-3xl gradient-text mb-2">99.9%</div>
            <div className="text-white/70">Security Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}
