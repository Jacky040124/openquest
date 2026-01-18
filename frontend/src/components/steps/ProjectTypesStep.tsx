import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ProjectInterest } from '@/types/api';

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT TYPES STEP - E2B INDUSTRIAL AESTHETIC
// Terminal windows, ASCII art, orange accents, monospace typography
// ═══════════════════════════════════════════════════════════════════════════════

// Project interests matching backend ProjectInterest enum
const projectInterests: {
  id: ProjectInterest;
  title: string;
  icon: string;
}[] = [
  { id: 'webapp', title: 'WEB APPS', icon: '◎' },
  { id: 'mobile', title: 'MOBILE', icon: '◇' },
  { id: 'desktop', title: 'DESKTOP', icon: '◆' },
  { id: 'cli', title: 'CLI TOOLS', icon: '▶' },
  { id: 'api', title: 'API/BACKEND', icon: '⟡' },
  { id: 'library', title: 'LIBRARIES', icon: '⧉' },
  { id: 'llm', title: 'LLM & AI', icon: '◈' },
  { id: 'ml', title: 'MACHINE LEARNING', icon: '⬡' },
  { id: 'data', title: 'DATA/ANALYTICS', icon: '▣' },
  { id: 'devtools', title: 'DEV TOOLS', icon: '⚙' },
  { id: 'game', title: 'GAME DEV', icon: '◉' },
  { id: 'blockchain', title: 'BLOCKCHAIN', icon: '⬢' },
  { id: 'iot', title: 'IOT/EMBEDDED', icon: '⊡' },
  { id: 'security', title: 'SECURITY', icon: '⛨' },
  { id: 'automation', title: 'AUTOMATION', icon: '⟳' },
  { id: 'infrastructure', title: 'INFRASTRUCTURE', icon: '☁' },
];

const ProjectTypesStep = () => {
  const { preferences, toggleProjectInterest, nextStep, prevStep } = usePreferencesStore();

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
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
          <span className="text-white/20 tracking-[0.3em] text-xs">━━━</span>
          <span className="text-[11px] text-[#FF6B00] tracking-[0.3em] uppercase">SELECT PROJECT TYPES</span>
          <span className="text-white/20 tracking-[0.3em] text-xs">━━━</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold tracking-tight mb-3"
          style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, monospace" }}
        >
          WHAT <span className="text-[#FF6B00]">PROJECTS</span> INTEREST YOU?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 text-sm"
        >
          Select the domains you'd like to contribute to
        </motion.p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* PROJECT TYPES GRID */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.03,
            },
          },
        }}
      >
        {projectInterests.map((type) => {
          const isSelected = preferences.project_interests.includes(type.id);
          return (
            <motion.button
              key={type.id}
              onClick={() => toggleProjectInterest(type.id)}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              className={`
                relative p-4 border font-mono text-xs transition-all duration-200 text-left
                ${isSelected
                  ? 'border-[#FF6B00] bg-[#FF6B00]/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
                }
              `}
            >
              {/* Icon */}
              <div className={`text-lg mb-2 ${isSelected ? 'text-[#FF6B00]' : 'text-white/40'}`}>
                {type.icon}
              </div>

              {/* Title */}
              <div className={`tracking-wider text-[10px] ${isSelected ? 'text-[#FF6B00]' : 'text-white/60'}`}>
                {type.title}
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <span className="absolute top-2 right-2 text-[8px] text-[#FF6B00]">✓</span>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* COUNTER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mb-8"
      >
        <span className="font-mono text-lg text-[#FF6B00] tabular-nums">{preferences.project_interests.length}</span>
        <span className="text-white/40 text-sm ml-2">
          project type{preferences.project_interests.length !== 1 ? 's' : ''} selected
        </span>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* NAVIGATION */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white/60
                     hover:border-white/30 hover:text-white transition-all duration-200
                     text-sm tracking-widest uppercase font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </button>
        <button
          onClick={nextStep}
          disabled={preferences.project_interests.length === 0}
          className={`
            flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-black
            text-sm tracking-widest uppercase font-bold
            hover:bg-[#FF8533] transition-all duration-200
            ${preferences.project_interests.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}
          `}
        >
          VIEW SUMMARY
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default ProjectTypesStep;
