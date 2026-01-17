import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import SelectionChip from '@/components/SelectionChip';
import { Plus } from 'lucide-react';

// Common languages that map well to GitHub's language detection
const languages = [
  { id: 'JavaScript', label: 'JavaScript' },
  { id: 'TypeScript', label: 'TypeScript' },
  { id: 'Python', label: 'Python' },
  { id: 'Rust', label: 'Rust' },
  { id: 'Go', label: 'Go' },
  { id: 'Java', label: 'Java' },
  { id: 'C#', label: 'C#' },
  { id: 'C++', label: 'C++' },
  { id: 'Ruby', label: 'Ruby' },
  { id: 'PHP', label: 'PHP' },
  { id: 'Swift', label: 'Swift' },
  { id: 'Kotlin', label: 'Kotlin' },
  { id: 'Scala', label: 'Scala' },
  { id: 'Elixir', label: 'Elixir' },
  { id: 'Haskell', label: 'Haskell' },
  { id: 'Clojure', label: 'Clojure' },
];

const LanguagesStep = () => {
  const { preferences, toggleLanguage, nextStep, prevStep } = usePreferencesStore();
  const [otherInput, setOtherInput] = useState('');
  const [customLanguages, setCustomLanguages] = useState<string[]>([]);

  const handleAddCustom = () => {
    if (otherInput.trim() && !customLanguages.includes(otherInput.trim())) {
      setCustomLanguages([...customLanguages, otherInput.trim()]);
      toggleLanguage(otherInput.trim());
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
        <h2 className="text-3xl font-bold mb-3">What languages do you know?</h2>
        <p className="text-muted-foreground">
          Select all programming languages you're comfortable with
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
        {languages.map((lang) => (
          <SelectionChip
            key={lang.id}
            label={lang.label}
            selected={preferences.languages.includes(lang.id)}
            onClick={() => toggleLanguage(lang.id)}
          />
        ))}
        {customLanguages.map((lang) => (
          <SelectionChip
            key={lang}
            label={lang}
            selected={preferences.languages.includes(lang)}
            onClick={() => toggleLanguage(lang)}
          />
        ))}
      </motion.div>

      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Other:</span>
          <input
            type="text"
            value={otherInput}
            onChange={(e) => setOtherInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter language..."
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-40"
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
        {preferences.languages.length} language{preferences.languages.length !== 1 ? 's' : ''} selected
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="btn-secondary">
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={preferences.languages.length === 0}
          className={`btn-primary ${
            preferences.languages.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
};

export default LanguagesStep;
