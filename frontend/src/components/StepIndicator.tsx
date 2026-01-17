import { motion } from 'framer-motion';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

const StepIndicator = ({ totalSteps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          className={`step-indicator ${
            index === currentStep
              ? 'step-indicator-active'
              : index < currentStep
              ? 'step-indicator-complete'
              : ''
          }`}
          initial={false}
          animate={{
            width: index === currentStep ? 32 : 10,
            opacity: index <= currentStep ? 1 : 0.4,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
};

export default StepIndicator;
