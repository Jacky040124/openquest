import { motion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';
import { Sparkles } from 'lucide-react';
import logo from '@/assets/logo.png';

const WelcomeStep = () => {
  const { nextStep } = usePreferencesStore();

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-24 h-24 flex items-center justify-center mb-8"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <img src={logo} alt="OpenQuest" className="w-24 h-24 object-contain" />
      </motion.div>

      <motion.h1
        className="text-4xl md:text-5xl font-bold mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Find Your Perfect{' '}
        <span className="gradient-text">Open Source</span> Match
      </motion.h1>

      <motion.p
        className="text-lg text-muted-foreground mb-8 max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Tell us about your skills and interests, and we'll match you with open
        source projects that are perfect for you.
      </motion.p>

      <motion.button
        onClick={nextStep}
        className="btn-primary flex items-center gap-2 text-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-5 h-5" />
        Get Started
      </motion.button>

      <motion.div
        className="mt-12 flex items-center gap-8 text-muted-foreground text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>5,000+ Projects</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span>All Skill Levels</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>50+ Languages</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeStep;
