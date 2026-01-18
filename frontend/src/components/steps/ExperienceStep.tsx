import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import SelectionCard from '@/components/SelectionCard';
import { Baby, GraduationCap, Briefcase, Trophy } from 'lucide-react';

const experienceLevels = [
  {
    id: 'beginner',
    title: 'Beginner',
    description: 'New to coding or open source. Looking for well-documented, beginner-friendly issues.',
    icon: <Baby className="w-6 h-6" />,
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Comfortable with coding. Ready for moderate challenges and learning new concepts.',
    icon: <GraduationCap className="w-6 h-6" />,
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Experienced developer. Can tackle complex issues and architectural decisions.',
    icon: <Briefcase className="w-6 h-6" />,
  },
  {
    id: 'expert',
    title: 'Expert',
    description: 'Deep expertise in specific domains. Looking for challenging, impactful contributions.',
    icon: <Trophy className="w-6 h-6" />,
  },
];

const ExperienceStep = () => {
  const { preferences, setExperienceLevel, nextStep, prevStep } = usePreferencesStore();

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">What's your experience level?</h2>
        <p className="text-muted-foreground">
          This helps us find issues that match your skill level
        </p>
      </div>

      <div className="grid gap-4">
        {experienceLevels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SelectionCard
              title={level.title}
              description={level.description}
              icon={level.icon}
              selected={preferences.experienceLevel === level.id}
              onClick={() => setExperienceLevel(level.id)}
              size="lg"
            />
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="btn-secondary">
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={!preferences.experienceLevel}
          className={`btn-primary ${
            !preferences.experienceLevel ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
};

export default ExperienceStep;
