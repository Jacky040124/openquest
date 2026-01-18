import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY STEP - E2B INDUSTRIAL AESTHETIC
// Terminal windows, ASCII art, orange accents, monospace typography
// ═══════════════════════════════════════════════════════════════════════════════

// Display labels for issue interests
const issueInterestLabels: Record<string, string> = {
  bug_fix: 'Bug Fixes',
  feature: 'Features',
  enhancement: 'Enhancements',
  optimization: 'Optimization',
  refactor: 'Refactoring',
  testing: 'Testing',
  documentation: 'Documentation',
  accessibility: 'Accessibility',
  security: 'Security',
  ui_ux: 'UI/UX',
  dependency: 'Dependencies',
  ci_cd: 'CI/CD',
  cleanup: 'Cleanup',
};

// Display labels for project interests
const projectInterestLabels: Record<string, string> = {
  webapp: 'Web Apps',
  mobile: 'Mobile',
  desktop: 'Desktop',
  cli: 'CLI Tools',
  api: 'API/Backend',
  library: 'Libraries',
  llm: 'LLM & AI',
  ml: 'ML',
  data: 'Data',
  devtools: 'Dev Tools',
  game: 'Games',
  blockchain: 'Blockchain',
  iot: 'IoT',
  security: 'Security',
  automation: 'Automation',
  infrastructure: 'Infrastructure',
};

// Display labels for familiarity
const familiarityLabels: Record<string, string> = {
  beginner: 'BEG',
  intermediate: 'INT',
  advanced: 'ADV',
  expert: 'EXP',
};

const SummaryStep = () => {
  const navigate = useNavigate();
  const { preferences, resetPreferences, prevStep, nextStep } = usePreferencesStore();
  const { isLoggedIn } = useAuthStore();

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-3 mb-6"
        >
          <span className="text-white/30 tracking-[0.3em] text-xs">✶✶✶</span>
          <span className="text-[11px] text-[#FF6B00] tracking-[0.3em] uppercase">REVIEW</span>
          <span className="text-white/30 tracking-[0.3em] text-xs">✶✶✶</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold tracking-tight mb-3"
          style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, monospace" }}
        >
          YOUR <span className="text-[#FF6B00]">PREFERENCES</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 text-sm"
        >
          Here's what we'll use to find your perfect projects
        </motion.p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* SUMMARY CARDS */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {/* Languages */}
        <motion.div
          className="border border-white/10 bg-white/[0.02]"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF6B00]/60" />
              <div className="w-2 h-2 rounded-full bg-white/10" />
            </div>
            <span className="text-[10px] text-white/60 tracking-widest font-mono uppercase">
              LANGUAGES ({preferences.languages.length})
            </span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {preferences.languages.length > 0 ? (
                preferences.languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1.5 border border-white/20 text-white/70 font-mono text-xs tracking-wide"
                  >
                    {lang}
                  </span>
                ))
              ) : (
                <span className="text-white/30 text-sm font-mono">No languages selected</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div
          className="border border-white/10 bg-white/[0.02]"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF6B00]/60" />
              <div className="w-2 h-2 rounded-full bg-white/10" />
            </div>
            <span className="text-[10px] text-white/60 tracking-widest font-mono uppercase">
              SKILLS ({preferences.skills.length})
            </span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {preferences.skills.length > 0 ? (
                preferences.skills.map((skill) => (
                  <span
                    key={skill.name}
                    className="px-3 py-1.5 border border-white/20 text-white/70 font-mono text-xs tracking-wide flex items-center gap-2"
                  >
                    <span className="capitalize">{skill.name}</span>
                    <span className="text-[#FF6B00] text-[10px]">
                      [{familiarityLabels[skill.familiarity] || skill.familiarity}]
                    </span>
                  </span>
                ))
              ) : (
                <span className="text-white/30 text-sm font-mono">No skills selected</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Issue Types */}
        <motion.div
          className="border border-white/10 bg-white/[0.02]"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF6B00]/60" />
              <div className="w-2 h-2 rounded-full bg-white/10" />
            </div>
            <span className="text-[10px] text-white/60 tracking-widest font-mono uppercase">
              ISSUE TYPES ({preferences.issue_interests.length})
            </span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {preferences.issue_interests.length > 0 ? (
                preferences.issue_interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1.5 border border-white/20 text-white/70 font-mono text-xs tracking-wide"
                  >
                    {issueInterestLabels[interest] || interest}
                  </span>
                ))
              ) : (
                <span className="text-white/30 text-sm font-mono">No issue types selected</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Project Types */}
        <motion.div
          className="border border-white/10 bg-white/[0.02]"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF6B00]/60" />
              <div className="w-2 h-2 rounded-full bg-white/10" />
            </div>
            <span className="text-[10px] text-white/60 tracking-widest font-mono uppercase">
              PROJECT TYPES ({preferences.project_interests.length})
            </span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {preferences.project_interests.length > 0 ? (
                preferences.project_interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1.5 border border-white/20 text-white/70 font-mono text-xs tracking-wide"
                  >
                    {projectInterestLabels[interest] || interest}
                  </span>
                ))
              ) : (
                <span className="text-white/30 text-sm font-mono">No project types selected</span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* NAVIGATION */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="flex justify-between mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={prevStep}
          className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white/60
                     hover:border-white/30 hover:text-white transition-all duration-200
                     text-sm tracking-widest uppercase font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </button>
        <div className="flex gap-3">
          <button
            onClick={resetPreferences}
            className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white/60
                       hover:border-white/30 hover:text-white transition-all duration-200
                       text-sm tracking-widest uppercase font-mono"
          >
            <RotateCcw className="w-4 h-4" />
            RESET
          </button>
          <button
            onClick={() => {
              if (isLoggedIn) {
                navigate('/dashboard');
              } else {
                nextStep();
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-black
                       text-sm tracking-widest uppercase font-bold
                       hover:bg-[#FF8533] transition-all duration-200"
          >
            {isLoggedIn ? 'FIND PROJECTS' : 'CREATE ACCOUNT'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ASCII DECORATION */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center font-mono text-[10px] text-white/20"
      >
        ┌────────────────────────────────────┐<br />
        │&nbsp;&nbsp;PREFERENCES READY FOR MATCHING&nbsp;&nbsp;│<br />
        └────────────────────────────────────┘
      </motion.div>
    </motion.div>
  );
};

export default SummaryStep;
