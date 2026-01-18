import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LogIn, Code, Users, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import logo from "@/assets/logo.png";

const Landing = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  const handleGetStarted = () => {
    navigate("/onboarding");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <motion.div
          className="flex items-center gap-2 cursor-pointer"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="OpenQuest" className="w-8 h-8 object-contain" />
          <span className="font-semibold text-lg text-foreground">OpenQuest</span>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img src={logo} alt="OpenQuest" className="w-24 h-24 object-contain mx-auto mb-8" />
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            From <span className="font-black" style={{ color: '#6b6966' }}>Iron</span> to{' '}
            <span className="font-black" style={{ color: '#f9ebc8', textShadow: '0 0 20px rgba(249, 235, 200, 0.8), 0 0 40px rgba(249, 235, 200, 0.5), 0 0 60px rgba(249, 235, 200, 0.3)' }}>Oracle</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Get personalized recommendations for open source projects tailored to your interests and skillset.
            Contribute your way through the open source world and work your way to the top!
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleLogin}
              className="border-border hover:bg-muted px-8 py-6 text-lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Log In
            </Button>
          </motion.div>

          {/* Features */}
          <motion.div
            className="grid md:grid-cols-3 gap-8 mt-20"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <Code className="w-10 h-10 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold text-foreground mb-2">Skill-Based Matching</h3>
              <p className="text-muted-foreground text-sm">
                Get recommendations based on your programming languages and frameworks
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <Users className="w-10 h-10 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold text-foreground mb-2">Community Focus</h3>
              <p className="text-muted-foreground text-sm">
                Show off your skills and rise to the top all while contributing to the open source community
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <Rocket className="w-10 h-10 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold text-foreground mb-2">Start Contributing</h3>
              <p className="text-muted-foreground text-sm">
                Jump into issues for first-timers or experienced developers and strengthen your portfolio
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Built with love for the open source community
        </p>
      </footer>
    </div>
  );
};

export default Landing;
