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

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING - E2B INDUSTRIAL AESTHETIC
// Pure black, monospace typography, terminal windows, orange accents
// ═══════════════════════════════════════════════════════════════════════════════

// Steps: Welcome(0), Languages(1), Skills(2), IssueTypes(3), ProjectTypes(4), Summary(5), CreateAccount(6)
// GitHub OAuth is done after signup in Dashboard
const steps = [
  WelcomeStep,
  LanguagesStep,
  SkillsStep,
  IssueTypesStep,
  ProjectTypesStep,
  SummaryStep,
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
    <div className="min-h-screen bg-[#000000] text-white overflow-hidden selection:bg-[#FF6B00]/30 font-mono flex flex-col">
      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleLogoClick}
          >
            <div className="w-8 h-8 bg-[#FF6B00] flex items-center justify-center">
              <span className="text-black font-black text-lg">Q</span>
            </div>
            <span className="text-white/80 font-medium tracking-wide">OpenQuest</span>
          </motion.div>

          {/* Right Nav */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="text-[13px] text-white/60 hover:text-white tracking-widest uppercase transition-colors"
            >
              SIGN IN
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* STEP INDICATOR */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {currentStep > 0 && currentStep < 6 && (
        <motion.div
          className="relative z-10 py-6 flex-shrink-0 border-b border-white/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-white/30 tracking-[0.3em] uppercase font-mono">STEP</span>
              <span className="text-[#FF6B00] font-bold text-lg tabular-nums">0{currentStep}</span>
              <span className="text-white/20">/</span>
              <span className="text-white/40 text-lg tabular-nums">05</span>
            </div>
            <StepIndicator totalSteps={6} currentStep={currentStep} />
            <div className="text-[11px] text-white/30 tracking-[0.3em] uppercase font-mono">
              {currentStep === 1 && 'LANGUAGES'}
              {currentStep === 2 && 'SKILLS'}
              {currentStep === 3 && 'ISSUE TYPES'}
              {currentStep === 4 && 'PROJECTS'}
              {currentStep === 5 && 'SUMMARY'}
            </div>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        {/* ASCII Decorations - Left */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.8 }}
          className="fixed left-8 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/30 hidden lg:block"
        >
          <div className="space-y-1">
            <div>].....[</div>
            <div>]..<span className="text-[#FF6B00]/60">*</span>..[</div>
            <div>].....[</div>
            <div className="h-4" />
            <div>┌──┐</div>
            <div>│<span className="text-[#FF6B00]/60">✶</span>│</div>
            <div>└──┘</div>
          </div>
        </motion.div>

        {/* ASCII Decorations - Right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 1 }}
          className="fixed right-8 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/30 hidden lg:block text-right"
        >
          <div className="space-y-1">
            <div>. ✶ . ✶ .</div>
            <div>✶ . ✶ . ✶</div>
            <div>. ✶ . ✶ .</div>
            <div className="h-4" />
            <div>──────</div>
            <div className="text-[#FF6B00]/40">ONBOARD</div>
            <div>──────</div>
          </div>
        </motion.div>

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

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <span className="text-white/20 text-xs tracking-[0.3em]">✶✶✶</span>
          <span className="text-white/30 text-[11px] tracking-widest">© 2024 OPENQUEST</span>
          <span className="text-white/20 text-xs tracking-[0.3em]">✶✶✶</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
