import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import SelectionCard from '@/components/SelectionCard';
import { Bug, Sparkles, FileText, Wrench, Shield, Zap, Plus } from 'lucide-react';

const issueTypes = [
  {
    id: 'Bug Fixes',
    title: 'Bug Fixes',
    description: 'Fix existing issues and improve stability',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: 'Feature Development',
    title: 'Feature Development',
    description: 'Build new functionality and capabilities',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: 'Documentation',
    title: 'Documentation',
    description: 'Improve docs, tutorials, and examples',
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: 'Refactoring',
    title: 'Refactoring',
    description: 'Improve code quality and maintainability',
    icon: <Wrench className="w-6 h-6" />,
  },
  {
    id: 'Security',
    title: 'Security',
    description: 'Fix vulnerabilities and improve security',
    icon: <Shield className="w-6 h-6" />,
  },
  {
    id: 'Performance',
    title: 'Performance',
    description: 'Optimize speed and resource usage',
    icon: <Zap className="w-6 h-6" />,
  },
];

const IssueTypesStep = () => {
  const { preferences, toggleIssueType, nextStep, prevStep } = usePreferencesStore();
  const [otherInput, setOtherInput] = useState('');
  const [customTypes, setCustomTypes] = useState<{ id: string; title: string }[]>([]);

  const handleAddCustom = () => {
    if (otherInput.trim() && !customTypes.find(t => t.title.toLowerCase() === otherInput.trim().toLowerCase())) {
      const customValue = otherInput.trim();
      setCustomTypes([...customTypes, { id: customValue, title: customValue }]);
      toggleIssueType(customValue);
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
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">What type of issues interest you?</h2>
        <p className="text-muted-foreground">
          Select all types of contributions you'd like to make
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {issueTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <SelectionCard
              title={type.title}
              description={type.description}
              icon={type.icon}
              selected={preferences.issueTypes.includes(type.id)}
              onClick={() => toggleIssueType(type.id)}
            />
          </motion.div>
        ))}
        {customTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (issueTypes.length + index) * 0.08 }}
          >
            <SelectionCard
              title={type.title}
              description="Custom issue type"
              selected={preferences.issueTypes.includes(type.id)}
              onClick={() => toggleIssueType(type.id)}
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
            placeholder="Enter issue type..."
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
        {preferences.issueTypes.length} type{preferences.issueTypes.length !== 1 ? 's' : ''} selected
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="btn-secondary">
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={preferences.issueTypes.length === 0}
          className={`btn-primary ${
            preferences.issueTypes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
};

export default IssueTypesStep;
