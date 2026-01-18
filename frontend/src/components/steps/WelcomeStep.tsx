import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import { ArrowRight } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// WELCOME STEP - E2B INDUSTRIAL AESTHETIC
// Terminal windows, ASCII art, orange accents, monospace typography
// ═══════════════════════════════════════════════════════════════════════════════

const WelcomeStep = () => {
  const { nextStep } = usePreferencesStore();

  // Stats for display
  const stats = [
    { value: "5K+", label: "PROJECTS" },
    { value: "50+", label: "LANGUAGES" },
    { value: "100K+", label: "ISSUES" },
  ];

  // Feature cards
  const features = [
    {
      icon: "◈",
      title: "Skill Matching",
      description: "AI matches your skills to perfect repos"
    },
    {
      icon: "◇",
      title: "Issue Discovery",
      description: "Find beginner-friendly first issues"
    },
    {
      icon: "◆",
      title: "Progress Tracking",
      description: "Earn XP and level up your contributions"
    }
  ];

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
    >
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <div className="text-center mb-12">
        {/* NEW Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-3 mb-8"
        >
          <span className="bg-[#FF6B00] text-black text-[10px] font-black px-2.5 py-1 tracking-widest">
            NEW
          </span>
          <span className="text-white/60 text-sm tracking-wide">
            AI-POWERED REPOSITORY MATCHING
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
          style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, monospace" }}
        >
          FIND YOUR PERFECT
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-8"
          style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, monospace" }}
        >
          <span className="relative">
            <span className="absolute -inset-1 bg-gradient-to-r from-[#FF6B00]/20 to-transparent blur-xl" />
            <span className="relative text-[#FF6B00]">OPEN SOURCE</span>
          </span>{' '}
          MATCH
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/50 text-lg max-w-xl mx-auto mb-10"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          Tell us about your skills and interests, and we'll match you with
          open source projects that are perfect for your first contribution.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          onClick={nextStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative bg-[#FF6B00] text-black px-10 py-4 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[#FF8533] transition-all duration-300 inline-flex items-center gap-3"
        >
          <span>GET STARTED</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </motion.button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* STATS BAR */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="border border-white/10 bg-white/[0.02] mb-8"
      >
        <div className="grid grid-cols-3 divide-x divide-white/10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="py-6 px-4 text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-white mb-1 tabular-nums"
                   style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {stat.value}
              </div>
              <div className="text-[10px] text-white/40 tracking-[0.3em] uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* FEATURE CARDS */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mb-4"
      >
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="text-white/20 tracking-[0.3em] text-xs">━━━━</span>
          <span className="text-[11px] text-white/40 tracking-[0.4em] uppercase">USE CASES</span>
          <span className="text-white/20 tracking-[0.3em] text-xs">━━━━</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              className="group p-6 border border-white/10 bg-white/[0.01] hover:border-[#FF6B00]/40 hover:bg-[#FF6B00]/5 transition-all duration-300"
            >
              {/* Terminal Window Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-[#FF6B00]/60 transition-colors" />
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Icon */}
              <div className="text-2xl text-[#FF6B00]/60 mb-4">{feature.icon}</div>

              {/* Content */}
              <h3 className="text-sm font-bold tracking-widest mb-2 text-white/90 uppercase">
                {feature.title}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ASCII DECORATION */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 1.2 }}
        className="text-center font-mono text-[10px] text-white/20 mt-8"
      >
        ┌──────────────────────────────────────────┐<br />
        │&nbsp;&nbsp;READY TO START YOUR OSS JOURNEY&nbsp;&nbsp;│<br />
        └──────────────────────────────────────────┘
      </motion.div>
    </motion.div>
  );
};

export default WelcomeStep;
