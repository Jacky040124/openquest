import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import { Plus, ArrowLeft, ArrowRight } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// LANGUAGES STEP - E2B INDUSTRIAL AESTHETIC
// Terminal windows, ASCII art, orange accents, monospace typography
// ═══════════════════════════════════════════════════════════════════════════════

// Common languages that map well to GitHub's language detection
const languages = [
  { id: 'JavaScript', label: 'JAVASCRIPT' },
  { id: 'TypeScript', label: 'TYPESCRIPT' },
  { id: 'Python', label: 'PYTHON' },
  { id: 'Rust', label: 'RUST' },
  { id: 'Go', label: 'GO' },
  { id: 'Java', label: 'JAVA' },
  { id: 'C#', label: 'C#' },
  { id: 'C++', label: 'C++' },
  { id: 'Ruby', label: 'RUBY' },
  { id: 'PHP', label: 'PHP' },
  { id: 'Swift', label: 'SWIFT' },
  { id: 'Kotlin', label: 'KOTLIN' },
  { id: 'Scala', label: 'SCALA' },
  { id: 'Elixir', label: 'ELIXIR' },
  { id: 'Haskell', label: 'HASKELL' },
  { id: 'Clojure', label: 'CLOJURE' },
];

const LanguagesStep = () => {
  const { preferences, toggleLanguage, nextStep, prevStep } = usePreferencesStore();
  const [otherInput, setOtherInput] = useState('');
  const [customLanguages, setCustomLanguages] = useState<string[]>([]);

  const handleAddCustom = () => {
    if (otherInput.trim() && !customLanguages.includes(otherInput.trim())) {
      setCustomLanguages([...customLanguages, otherInput.trim()]);
      toggleLanguage(otherInput.trim());
      setOtherInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  return (
    <motion.div
      className="max-w-3xl mx-auto"
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
          <span className="text-[11px] text-[#FF6B00] tracking-[0.3em] uppercase">SELECT LANGUAGES</span>
          <span className="text-white/20 tracking-[0.3em] text-xs">━━━</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold tracking-tight mb-3"
          style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, monospace" }}
        >
          WHAT LANGUAGES DO YOU <span className="text-[#FF6B00]">KNOW</span>?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 text-sm"
        >
          Select all programming languages you're comfortable with
        </motion.p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* LANGUAGE GRID */}
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
        {languages.map((lang) => {
          const isSelected = preferences.languages.includes(lang.id);
          return (
            <motion.button
              key={lang.id}
              onClick={() => toggleLanguage(lang.id)}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              className={`
                relative p-4 border font-mono text-xs tracking-widest transition-all duration-200
                ${isSelected
                  ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                  : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/30 hover:bg-white/[0.04]'
                }
              `}
            >
              {isSelected && (
                <span className="absolute top-1 right-1 text-[8px] text-[#FF6B00]">✓</span>
              )}
              {lang.label}
            </motion.button>
          );
        })}
        {customLanguages.map((lang) => {
          const isSelected = preferences.languages.includes(lang);
          return (
            <motion.button
              key={lang}
              onClick={() => toggleLanguage(lang)}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              className={`
                relative p-4 border font-mono text-xs tracking-widest transition-all duration-200
                ${isSelected
                  ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                  : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/30 hover:bg-white/[0.04]'
                }
              `}
            >
              {isSelected && (
                <span className="absolute top-1 right-1 text-[8px] text-[#FF6B00]">✓</span>
              )}
              {lang.toUpperCase()}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* CUSTOM INPUT */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-3 mb-6"
      >
        <span className="text-[11px] text-white/40 tracking-widest uppercase">OTHER:</span>
        <input
          type="text"
          value={otherInput}
          onChange={(e) => setOtherInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter language..."
          className="bg-white/[0.02] border border-white/10 px-4 py-2 text-white placeholder-white/30
                     focus:outline-none focus:border-[#FF6B00]/50 focus:bg-[#FF6B00]/5
                     transition-all duration-200 font-mono text-sm tracking-wide w-40"
        />
        <button
          onClick={handleAddCustom}
          disabled={!otherInput.trim()}
          className="p-2 border border-white/10 text-white/60 hover:border-[#FF6B00] hover:text-[#FF6B00]
                     disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
        </button>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* COUNTER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center mb-8"
      >
        <span className="font-mono text-lg text-[#FF6B00] tabular-nums">{preferences.languages.length}</span>
        <span className="text-white/40 text-sm ml-2">
          language{preferences.languages.length !== 1 ? 's' : ''} selected
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
          disabled={preferences.languages.length === 0}
          className={`
            flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-black
            text-sm tracking-widest uppercase font-bold
            hover:bg-[#FF8533] transition-all duration-200
            ${preferences.languages.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}
          `}
        >
          CONTINUE
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default LanguagesStep;
