import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePreferencesStore, SkillWithFamiliarity } from '@/store/preferencesStore';
import { X } from 'lucide-react';
import type { SkillName, Familiarity } from '@/types/api';

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

const familiarityLevels: { id: Familiarity; label: string; color: string }[] = [
  { id: 'beginner', label: 'Beginner', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'intermediate', label: 'Intermediate', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'advanced', label: 'Advanced', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'expert', label: 'Expert', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
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
      // Default to beginner when first selected
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
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">What tools and frameworks do you use?</h2>
        <p className="text-muted-foreground">
          Select your skills and set your proficiency level for each
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {skillOptions.map((category) => (
          <button
            key={category.category}
            onClick={() => setSelectedCategory(category.category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.category
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-card/80 text-muted-foreground'
            }`}
          >
            {category.category}
          </button>
        ))}
      </div>

      {/* Skills grid */}
      <motion.div
        key={selectedCategory}
        className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6"
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
              className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
                selected
                  ? 'bg-primary/10 border-primary/50'
                  : 'bg-card/50 border-border/50 hover:border-border'
              }`}
              onClick={() => handleSkillClick(skill.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{skill.label}</span>
                {selected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSkill(skill.id);
                    }}
                    className="p-1 hover:bg-destructive/20 rounded"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {selected && (
                <div
                  className="flex flex-wrap gap-1 mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {familiarityLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => handleFamiliarityChange(skill.id, level.id)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${
                        familiarity === level.id
                          ? level.color
                          : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary'
                      }`}
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

      {/* Selected skills summary */}
      {preferences.skills.length > 0 && (
        <div className="bg-card/30 rounded-xl p-4 mb-6">
          <div className="text-sm text-muted-foreground mb-2">
            Selected skills ({preferences.skills.length}):
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
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border ${familiarityInfo?.color || ''}`}
                >
                  <span>{skillInfo?.label || skill.name}</span>
                  <button
                    onClick={() => removeSkill(skill.name)}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground mb-6">
        {preferences.skills.length} skill{preferences.skills.length !== 1 ? 's' : ''} selected
      </div>

      <div className="flex justify-between">
        <button onClick={prevStep} className="btn-secondary">
          Back
        </button>
        <button
          onClick={nextStep}
          className="btn-primary"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
};

export default SkillsStep;
