import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import SelectionChip from '@/components/SelectionChip';
import { Plus } from 'lucide-react';

const frameworks = [
  { id: 'React', label: 'React' },
  { id: 'Vue', label: 'Vue' },
  { id: 'Angular', label: 'Angular' },
  { id: 'Svelte', label: 'Svelte' },
  { id: 'Next.js', label: 'Next.js' },
  { id: 'Nuxt', label: 'Nuxt' },
  { id: 'Express', label: 'Express' },
  { id: 'FastAPI', label: 'FastAPI' },
  { id: 'Django', label: 'Django' },
  { id: 'Flask', label: 'Flask' },
  { id: 'Rails', label: 'Rails' },
  { id: 'Spring', label: 'Spring' },
  { id: 'NestJS', label: 'NestJS' },
  { id: 'Laravel', label: 'Laravel' },
  { id: '.NET', label: '.NET' },
  { id: 'Node.js', label: 'Node.js' },
  { id: 'Tailwind CSS', label: 'Tailwind CSS' },
  { id: 'GraphQL', label: 'GraphQL' },
];

const FrameworksStep = () => {
  const { preferences, toggleFramework, nextStep, prevStep } = usePreferencesStore();
  const [otherInput, setOtherInput] = useState('');
  const [customFrameworks, setCustomFrameworks] = useState<string[]>([]);

  const handleAddCustom = () => {
    const trimmed = otherInput.trim();
    if (trimmed && !customFrameworks.includes(trimmed)) {
      setCustomFrameworks([...customFrameworks, trimmed]);
      toggleFramework(trimmed);
      setOtherInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const totalSelected = preferences.frameworks.length;

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">What frameworks do you use?</h2>
        <p className="text-muted-foreground">
          Select frameworks and libraries you're familiar with
        </p>
      </div>

      <motion.div
        className="flex flex-wrap gap-3 justify-center"
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
        {frameworks.map((framework) => (
          <SelectionChip
            key={framework.id}
            label={framework.label}
            selected={preferences.frameworks.includes(framework.id)}
            onClick={() => toggleFramework(framework.id)}
          />
        ))}
        {customFrameworks.map((custom) => (
          <SelectionChip
            key={custom}
            label={custom}
            selected={preferences.frameworks.includes(custom)}
            onClick={() => toggleFramework(custom)}
          />
        ))}
      </motion.div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <input
          type="text"
          value={otherInput}
          onChange={(e) => setOtherInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Other framework..."
          className="px-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
          maxLength={50}
        />
        <button
          onClick={handleAddCustom}
          disabled={!otherInput.trim()}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center mt-6 text-sm text-muted-foreground">
        {totalSelected} framework{totalSelected !== 1 ? 's' : ''} selected
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="btn-secondary">
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={totalSelected === 0}
          className={`btn-primary ${
            totalSelected === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
};

export default FrameworksStep;
