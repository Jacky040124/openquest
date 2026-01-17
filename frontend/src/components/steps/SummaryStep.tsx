import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle, RotateCcw, Search, Code, Layers, Bug, Folder } from 'lucide-react';

const SummaryStep = () => {
  const navigate = useNavigate();
  const { preferences, resetPreferences, prevStep, nextStep } = usePreferencesStore();
  const { isLoggedIn } = useAuthStore();

  const experienceLabels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert',
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <motion.div
          className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <CheckCircle className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-3">Your Preferences Summary</h2>
        <p className="text-muted-foreground">
          Here's what we'll use to find your perfect projects
        </p>
      </div>

      <motion.div
        className="space-y-6"
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
        {/* Experience Level */}
        <motion.div
          className="card-interactive p-5"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Code className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Experience Level</h3>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-md inline-block font-medium">
            {experienceLabels[preferences.experienceLevel || ''] || 'Not selected'}
          </div>
        </motion.div>

        {/* Languages */}
        <motion.div
          className="card-interactive p-5"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Languages ({preferences.languages.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.languages.map((lang) => (
              <span
                key={lang}
                className="bg-secondary px-3 py-1 rounded-md text-sm capitalize"
              >
                {lang}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Frameworks */}
        <motion.div
          className="card-interactive p-5"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Layers className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Frameworks ({preferences.frameworks.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.frameworks.map((framework) => (
              <span
                key={framework}
                className="bg-secondary px-3 py-1 rounded-md text-sm capitalize"
              >
                {framework}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Issue Types */}
        <motion.div
          className="card-interactive p-5"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Bug className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Issue Types ({preferences.issueTypes.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.issueTypes.map((type) => (
              <span
                key={type}
                className="bg-secondary px-3 py-1 rounded-md text-sm capitalize"
              >
                {type === 'bug' ? 'Bug Fixes' : type}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Project Types */}
        <motion.div
          className="card-interactive p-5"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Folder className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Project Types ({preferences.projectTypes.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.projectTypes.map((type) => (
              <span
                key={type}
                className="bg-secondary px-3 py-1 rounded-md text-sm capitalize"
              >
                {type.replace('-', ' / ')}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="flex justify-between mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button onClick={prevStep} className="btn-secondary">
          Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={resetPreferences}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </button>
          <button 
            onClick={() => {
              if (isLoggedIn) {
                navigate('/dashboard');
              } else {
                nextStep();
              }
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {isLoggedIn ? 'Find Projects' : 'Create Account'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SummaryStep;
