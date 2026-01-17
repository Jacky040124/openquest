import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import SelectionCard from '@/components/SelectionCard';
import {
  Globe, Smartphone, Monitor, Terminal, Server,
  Package, Brain, Database, Wrench, Gamepad2,
  Blocks, Cpu, Shield, Cog, Cloud
} from 'lucide-react';
import type { ProjectInterest } from '@/types/api';

// Project interests matching backend ProjectInterest enum
const projectInterests: {
  id: ProjectInterest;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'webapp',
    title: 'Web Applications',
    description: 'Web frameworks, CMS, and web-based tools',
    icon: <Globe className="w-6 h-6" />,
  },
  {
    id: 'mobile',
    title: 'Mobile Apps',
    description: 'iOS, Android, and cross-platform development',
    icon: <Smartphone className="w-6 h-6" />,
  },
  {
    id: 'desktop',
    title: 'Desktop Apps',
    description: 'Native desktop applications',
    icon: <Monitor className="w-6 h-6" />,
  },
  {
    id: 'cli',
    title: 'CLI Tools',
    description: 'Command-line tools and utilities',
    icon: <Terminal className="w-6 h-6" />,
  },
  {
    id: 'api',
    title: 'APIs & Backend',
    description: 'REST APIs, GraphQL, and backend services',
    icon: <Server className="w-6 h-6" />,
  },
  {
    id: 'library',
    title: 'Libraries',
    description: 'Reusable libraries and packages',
    icon: <Package className="w-6 h-6" />,
  },
  {
    id: 'llm',
    title: 'LLM & AI',
    description: 'Large language models and AI applications',
    icon: <Brain className="w-6 h-6" />,
  },
  {
    id: 'ml',
    title: 'Machine Learning',
    description: 'ML frameworks and data science',
    icon: <Brain className="w-6 h-6" />,
  },
  {
    id: 'data',
    title: 'Data & Analytics',
    description: 'Data processing and visualization',
    icon: <Database className="w-6 h-6" />,
  },
  {
    id: 'devtools',
    title: 'Developer Tools',
    description: 'IDEs, build systems, and dev utilities',
    icon: <Wrench className="w-6 h-6" />,
  },
  {
    id: 'game',
    title: 'Game Development',
    description: 'Game engines and game-related tools',
    icon: <Gamepad2 className="w-6 h-6" />,
  },
  {
    id: 'blockchain',
    title: 'Blockchain',
    description: 'Cryptocurrency and decentralized apps',
    icon: <Blocks className="w-6 h-6" />,
  },
  {
    id: 'iot',
    title: 'IoT & Embedded',
    description: 'Internet of Things and embedded systems',
    icon: <Cpu className="w-6 h-6" />,
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Security tools and privacy-focused apps',
    icon: <Shield className="w-6 h-6" />,
  },
  {
    id: 'automation',
    title: 'Automation',
    description: 'Automation scripts and workflows',
    icon: <Cog className="w-6 h-6" />,
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    description: 'Cloud, containers, and DevOps tools',
    icon: <Cloud className="w-6 h-6" />,
  },
];

const ProjectTypesStep = () => {
  const { preferences, toggleProjectInterest, nextStep, prevStep } = usePreferencesStore();

  return (
    <motion.div
      className="max-w-4xl mx-auto"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectInterests.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <SelectionCard
              title={type.title}
              description={type.description}
              icon={type.icon}
              selected={preferences.project_interests.includes(type.id)}
              onClick={() => toggleProjectInterest(type.id)}
            />
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-6 text-sm text-muted-foreground">
        {preferences.project_interests.length} project type{preferences.project_interests.length !== 1 ? 's' : ''} selected
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="btn-secondary">
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={preferences.project_interests.length === 0}
          className={`btn-primary ${
            preferences.project_interests.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          View Summary
        </button>
      </div>
    </motion.div>
  );
};

export default ProjectTypesStep;
