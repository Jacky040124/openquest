import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import SelectionCard from '@/components/SelectionCard';
import { Gamepad2, Wrench, Brain, Globe, Database, Smartphone, BarChart3, Lock, Plus } from 'lucide-react';

const projectTypes = [
  {
    id: 'Game Development',
    title: 'Game Development',
    description: 'Game development, engines, and related tooling',
    icon: <Gamepad2 className="w-6 h-6" />,
  },
  {
    id: 'CLI Tools',
    title: 'CLI Tools',
    description: 'CLI tools, IDEs, build systems, and utilities',
    icon: <Wrench className="w-6 h-6" />,
  },
  {
    id: 'Machine Learning',
    title: 'Machine Learning',
    description: 'ML frameworks, AI applications, and data science',
    icon: <Brain className="w-6 h-6" />,
  },
  {
    id: 'Web Applications',
    title: 'Web Applications',
    description: 'Web frameworks, CMS, and web-based tools',
    icon: <Globe className="w-6 h-6" />,
  },
  {
    id: 'DevOps',
    title: 'DevOps',
    description: 'Cloud, containers, CI/CD, and deployment',
    icon: <Database className="w-6 h-6" />,
  },
  {
    id: 'Mobile Apps',
    title: 'Mobile Apps',
    description: 'iOS, Android, and cross-platform development',
    icon: <Smartphone className="w-6 h-6" />,
  },
  {
    id: 'Libraries',
    title: 'Libraries',
    description: 'Data processing, visualization, and analytics',
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    id: 'Blockchain',
    title: 'Blockchain',
    description: 'Security tools, encryption, and privacy-focused apps',
    icon: <Lock className="w-6 h-6" />,
  },
];

const ProjectTypesStep = () => {
  const { preferences, toggleProjectType, nextStep, prevStep } = usePreferencesStore();
  const [otherInput, setOtherInput] = useState('');
  const [customTypes, setCustomTypes] = useState<{ id: string; title: string }[]>([]);

  const handleAddCustom = () => {
    if (otherInput.trim() && !customTypes.find(t => t.title.toLowerCase() === otherInput.trim().toLowerCase())) {
      const customValue = otherInput.trim();
      setCustomTypes([...customTypes, { id: customValue, title: customValue }]);
      toggleProjectType(customValue);
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
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">What types of projects interest you?</h2>
        <p className="text-muted-foreground">
          Select the domains you'd like to contribute to
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projectTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <SelectionCard
              title={type.title}
              description={type.description}
              icon={type.icon}
              selected={preferences.projectTypes.includes(type.id)}
              onClick={() => toggleProjectType(type.id)}
            />
          </motion.div>
        ))}
        {customTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (projectTypes.length + index) * 0.06 }}
          >
            <SelectionCard
              title={type.title}
              description="Custom project type"
              selected={preferences.projectTypes.includes(type.id)}
              onClick={() => toggleProjectType(type.id)}
            />
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Other:</span>
          <input
            type="text"
            value={otherInput}
            onChange={(e) => setOtherInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter project type..."
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-44"
          />
          <button
            onClick={handleAddCustom}
            disabled={!otherInput.trim()}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-center mt-4 text-sm text-muted-foreground">
        {preferences.projectTypes.length} project type{preferences.projectTypes.length !== 1 ? 's' : ''} selected
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="btn-secondary">
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={preferences.projectTypes.length === 0}
          className={`btn-primary ${
            preferences.projectTypes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          View Summary
        </button>
      </div>
    </motion.div>
  );
};

export default ProjectTypesStep;
