import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePreferencesStore, SkillWithFamiliarity } from '@/store/preferencesStore';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import type { SkillName, Familiarity } from '@/types/api';

// ═══════════════════════════════════════════════════════════════════════════════
// SKILLS STEP - E2B INDUSTRIAL AESTHETIC
// Terminal windows, ASCII art, orange accents, monospace typography
// ═══════════════════════════════════════════════════════════════════════════════

// Available skills organized by category (matching backend SkillName enum)
const skillOptions: { category: string; skills: { id: SkillName; label: string }[] }[] = [
  {
    category: 'Frameworks',
    skills: [
      { id: 'react', label: 'React' },
      { id: 'vue', label: 'Vue' },
      { id: 'angular', label: 'Angular' },
      { id: 'nextjs', label: 'Next.js' },
      { id: 'django', label: 'Django' },
      { id: 'fastapi', label: 'FastAPI' },
      { id: 'spring', label: 'Spring' },
      { id: 'express', label: 'Express' },
      { id: 'flask', label: 'Flask' },
    ],
  },
  {
    category: 'Tools',
    skills: [
      { id: 'docker', label: 'Docker' },
      { id: 'kubernetes', label: 'Kubernetes' },
      { id: 'git', label: 'Git' },
      { id: 'nginx', label: 'Nginx' },
      { id: 'graphql', label: 'GraphQL' },
    ],
  },
  {
    category: 'Databases',
    skills: [
      { id: 'postgres', label: 'PostgreSQL' },
      { id: 'mongodb', label: 'MongoDB' },
      { id: 'redis', label: 'Redis' },
      { id: 'mysql', label: 'MySQL' },
      { id: 'sqlite', label: 'SQLite' },
    ],
  },
  {
    category: 'Cloud',
    skills: [
      { id: 'aws', label: 'AWS' },
      { id: 'gcp', label: 'GCP' },
      { id: 'azure', label: 'Azure' },
    ],
  },
];

const familiarityLevels: { id: Familiarity; label: string; activeClass: string }[] = [
  { id: 'beginner', label: 'BEG', activeClass: 'border-blue-500 bg-blue-500/10 text-blue-400' },
  { id: 'intermediate', label: 'INT', activeClass: 'border-green-500 bg-green-500/10 text-green-400' },
  { id: 'advanced', label: 'ADV', activeClass: 'border-orange-500 bg-orange-500/10 text-orange-400' },
  { id: 'expert', label: 'EXP', activeClass: 'border-purple-500 bg-purple-500/10 text-purple-400' },
];

const SkillsStep = () => {
  const { preferences, addSkill, removeSkill, updateSkillFamiliarity, nextStep, prevStep } = usePreferencesStore();
  const [selectedCategory, setSelectedCategory] = useState(skillOptions[0].category);

  const isSkillSelected = (skillName: SkillName) => {
    return preferences.skills.some((s) => s.name === skillName);
  };

  const getSkillFamiliarity = (skillName: SkillName): Familiarity | null => {
    const skill = preferences.skills.find((s) => s.name === skillName);
    return skill?.familiarity || null;
  };

  const handleSkillClick = (skillId: SkillName) => {
    if (isSkillSelected(skillId)) {
      removeSkill(skillId);
    } else {
      const newSkill: SkillWithFamiliarity = { name: skillId, familiarity: 'beginner' };
      addSkill(newSkill);
    }
  };

  const handleFamiliarityChange = (skillName: SkillName, familiarity: Familiarity) => {
    updateSkillFamiliarity(skillName, familiarity);
  };

  const currentCategorySkills = skillOptions.find((c) => c.category === selectedCategory)?.skills || [];

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
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-3 mb-6"
        >
          <span className="text-white/20 tracking-[0.3em] text-xs">━━━</span>
          <span className="text-[11px] text-[#FF6B00] tracking-[0.3em] uppercase">SELECT SKILLS</span>
          <span className="text-white/20 tracking-[0.3em] text-xs">━━━</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-bold tracking-tight mb-3"
          style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, monospace" }}
        >
          TOOLS & <span className="text-[#FF6B00]">FRAMEWORKS</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 text-sm"
        >
          Select your skills and set your proficiency level for each
        </motion.p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* CATEGORY TABS */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-2 mb-8"
      >
        {skillOptions.map((category) => (
          <button
            key={category.category}
            onClick={() => setSelectedCategory(category.category)}
            className={`
              px-4 py-2 font-mono text-xs tracking-widest uppercase transition-all duration-200 border
              ${selectedCategory === category.category
                ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]'
                : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/60'
              }
            `}
          >
            {category.category}
          </button>
        ))}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* SKILLS GRID */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        key={selectedCategory}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {currentCategorySkills.map((skill) => {
          const selected = isSkillSelected(skill.id);
          const familiarity = getSkillFamiliarity(skill.id);

          return (
            <div
              key={skill.id}
              className={`
                relative p-4 border transition-all cursor-pointer
                ${selected
                  ? 'border-[#FF6B00]/50 bg-[#FF6B00]/5'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }
              `}
              onClick={() => handleSkillClick(skill.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm tracking-wide text-white/80">{skill.label}</span>
                {selected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSkill(skill.id);
                    }}
                    className="p-1 text-white/30 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {selected && (
                <div
                  className="flex gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {familiarityLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => handleFamiliarityChange(skill.id, level.id)}
                      className={`
                        px-2 py-1 text-[10px] font-mono tracking-wider border transition-all
                        ${familiarity === level.id
                          ? level.activeClass
                          : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/50'
                        }
                      `}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* SELECTED SKILLS SUMMARY */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {preferences.skills.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-white/10 bg-white/[0.02] p-4 mb-6"
        >
          <div className="text-[11px] text-white/40 tracking-widest uppercase mb-3">
            SELECTED ({preferences.skills.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.skills.map((skill) => {
              const skillInfo = skillOptions
                .flatMap((c) => c.skills)
                .find((s) => s.id === skill.name);
              const familiarityInfo = familiarityLevels.find((l) => l.id === skill.familiarity);

              return (
                <div
                  key={skill.name}
                  className={`
                    px-3 py-1.5 font-mono text-xs flex items-center gap-2 border
                    ${familiarityInfo?.activeClass || 'border-white/20 text-white/60'}
                  `}
                >
                  <span>{skillInfo?.label || skill.name}</span>
                  <button
                    onClick={() => removeSkill(skill.name)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* COUNTER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mb-8"
      >
        <span className="font-mono text-lg text-[#FF6B00] tabular-nums">{preferences.skills.length}</span>
        <span className="text-white/40 text-sm ml-2">
          skill{preferences.skills.length !== 1 ? 's' : ''} selected
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
          className="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-black
                     text-sm tracking-widest uppercase font-bold
                     hover:bg-[#FF8533] transition-all duration-200"
        >
          CONTINUE
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default SkillsStep;
