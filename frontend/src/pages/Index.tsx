import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';
import StepIndicator from '@/components/StepIndicator';
import WelcomeStep from '@/components/steps/WelcomeStep';
import LanguagesStep from '@/components/steps/LanguagesStep';
import SkillsStep from '@/components/steps/SkillsStep';
import IssueTypesStep from '@/components/steps/IssueTypesStep';
import ProjectTypesStep from '@/components/steps/ProjectTypesStep';
import SummaryStep from '@/components/steps/SummaryStep';
import CreateAccountStep from '@/components/steps/CreateAccountStep';
import GitHubConnectStep from '@/components/steps/GitHubConnectStep';
import logo from "@/assets/logo.png";

// Steps: Welcome(0), Languages(1), Skills(2), IssueTypes(3), ProjectTypes(4), Summary(5), GitHubConnect(6), CreateAccount(7)
const steps = [
  WelcomeStep,
  LanguagesStep,
  SkillsStep,
  IssueTypesStep,
  ProjectTypesStep,
  SummaryStep,
  GitHubConnectStep,
  CreateAccountStep,
];

const Index = () => {
  const navigate = useNavigate();
  const { currentStep } = usePreferencesStore();
  const { isLoggedIn } = useAuthStore();
  const CurrentStepComponent = steps[currentStep];

  const handleLogoClick = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-50"
          style={{ background: 'radial-gradient(circle, hsl(175 80% 50% / 0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-50"
          style={{ background: 'radial-gradient(circle, hsl(280 70% 60% / 0.08) 0%, transparent 70%)' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex-shrink-0">
        <motion.div
          className="flex items-center gap-2 cursor-pointer"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleLogoClick}
        >
          <img src={logo} alt="OpenQuest" className="w-8 h-8 object-contain" />
          <span className="font-semibold text-lg text-foreground">OpenQuest</span>
        </motion.div>
      </header>

      {/* Step Indicator - show only for preference steps (1-5), hide on welcome, GitHub connect, and account creation */}
      {currentStep > 0 && currentStep < 6 && (
        <motion.div
          className="relative z-10 py-4 flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <StepIndicator totalSteps={6} currentStep={currentStep} />
        </motion.div>
      )}

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <CurrentStepComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center flex-shrink-0">
        <p className="text-muted-foreground text-sm">
          Built with love for the open source community
        </p>
      </footer>
    </div>
  );
};

export default Index;
