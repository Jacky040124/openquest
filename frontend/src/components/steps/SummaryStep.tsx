import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle, RotateCcw, Search, Layers, Bug, Folder, Wrench } from 'lucide-react';

// Display labels for issue interests
const issueInterestLabels: Record<string, string> = {
  bug_fix: 'Bug Fixes',
  feature: 'New Features',
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
  webapp: 'Web Applications',
  mobile: 'Mobile Apps',
  desktop: 'Desktop Apps',
  cli: 'CLI Tools',
  api: 'APIs & Backend',
  library: 'Libraries',
  llm: 'LLM & AI',
  ml: 'Machine Learning',
  data: 'Data & Analytics',
  devtools: 'Developer Tools',
  game: 'Game Development',
  blockchain: 'Blockchain',
  iot: 'IoT & Embedded',
  security: 'Security',
  automation: 'Automation',
  infrastructure: 'Infrastructure',
};

// Display labels for familiarity
const familiarityLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
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
            {preferences.languages.length > 0 ? (
              preferences.languages.map((lang) => (
                <span
                  key={lang}
                  className="bg-secondary px-3 py-1 rounded-md text-sm"
                >
                  {lang}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No languages selected</span>
            )}
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div
          className="card-interactive p-5"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Wrench className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Skills ({preferences.skills.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.skills.length > 0 ? (
              preferences.skills.map((skill) => (
                <span
                  key={skill.name}
                  className="bg-secondary px-3 py-1 rounded-md text-sm flex items-center gap-2"
                >
                  <span className="capitalize">{skill.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({familiarityLabels[skill.familiarity] || skill.familiarity})
                  </span>
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No skills selected</span>
            )}
          </div>
        </motion.div>

        {/* Issue Interests */}
        <motion.div
          className="card-interactive p-5"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Bug className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Issue Types ({preferences.issue_interests.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.issue_interests.length > 0 ? (
              preferences.issue_interests.map((interest) => (
                <span
                  key={interest}
                  className="bg-secondary px-3 py-1 rounded-md text-sm"
                >
                  {issueInterestLabels[interest] || interest}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No issue types selected</span>
            )}
          </div>
        </motion.div>

        {/* Project Interests */}
        <motion.div
          className="card-interactive p-5"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Folder className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Project Types ({preferences.project_interests.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferences.project_interests.length > 0 ? (
              preferences.project_interests.map((interest) => (
                <span
                  key={interest}
                  className="bg-secondary px-3 py-1 rounded-md text-sm"
                >
                  {projectInterestLabels[interest] || interest}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No project types selected</span>
            )}
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
