import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import SelectionCard from '@/components/SelectionCard';
import {
  Bug, Sparkles, FileText, Wrench, Shield, Zap,
  TestTube, Accessibility, Package, GitBranch, Trash2, Palette
} from 'lucide-react';
import type { IssueInterest } from '@/types/api';

// Issue interests matching backend IssueInterest enum
const issueInterests: {
  id: IssueInterest;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'bug_fix',
    title: 'Bug Fixes',
    description: 'Fix existing issues and improve stability',
    icon: <Bug className="w-6 h-6" />,
  },
  {
    id: 'feature',
    title: 'New Features',
    description: 'Build new functionality from scratch',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: 'enhancement',
    title: 'Enhancements',
    description: 'Improve existing features and capabilities',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Improve docs, tutorials, and examples',
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: 'refactor',
    title: 'Refactoring',
    description: 'Improve code quality and maintainability',
    icon: <Wrench className="w-6 h-6" />,
  },
  {
    id: 'testing',
    title: 'Testing',
    description: 'Add or improve test coverage',
    icon: <TestTube className="w-6 h-6" />,
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Fix vulnerabilities and improve security',
    icon: <Shield className="w-6 h-6" />,
  },
  {
    id: 'optimization',
    title: 'Optimization',
    description: 'Improve performance and efficiency',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    description: 'Make apps more accessible to everyone',
    icon: <Accessibility className="w-6 h-6" />,
  },
  {
    id: 'ui_ux',
    title: 'UI/UX',
    description: 'Improve user interface and experience',
    icon: <Palette className="w-6 h-6" />,
  },
  {
    id: 'dependency',
    title: 'Dependencies',
    description: 'Update and manage dependencies',
    icon: <Package className="w-6 h-6" />,
  },
  {
    id: 'ci_cd',
    title: 'CI/CD',
    description: 'Improve build and deployment pipelines',
    icon: <GitBranch className="w-6 h-6" />,
  },
  {
    id: 'cleanup',
    title: 'Cleanup',
    description: 'Remove dead code and technical debt',
    icon: <Trash2 className="w-6 h-6" />,
  },
];

const IssueTypesStep = () => {
  const { preferences, toggleIssueInterest, nextStep, prevStep } = usePreferencesStore();

  return (
    <motion.div
      className="max-w-3xl mx-auto"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {issueInterests.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <SelectionCard
              title={type.title}
              description={type.description}
              icon={type.icon}
              selected={preferences.issue_interests.includes(type.id)}
              onClick={() => toggleIssueInterest(type.id)}
            />
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-6 text-sm text-muted-foreground">
        {preferences.issue_interests.length} type{preferences.issue_interests.length !== 1 ? 's' : ''} selected
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="btn-secondary">
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={preferences.issue_interests.length === 0}
          className={`btn-primary ${
            preferences.issue_interests.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
};

export default IssueTypesStep;
