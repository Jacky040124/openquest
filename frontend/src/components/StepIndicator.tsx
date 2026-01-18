import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// STEP INDICATOR - E2B INDUSTRIAL AESTHETIC
// Terminal-style progress with dashes and markers
// ═══════════════════════════════════════════════════════════════════════════════

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

const StepIndicator = ({ totalSteps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <div key={index} className="flex items-center">
            {/* Step marker */}
            <motion.div
              className={`
                relative flex items-center justify-center
                ${isActive
                  ? 'text-[#FF6B00]'
                  : isComplete
                    ? 'text-[#FF6B00]/60'
                    : 'text-white/20'
                }
              `}
              initial={false}
              animate={{
                scale: isActive ? 1.2 : 1,
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {isComplete ? (
                <span className="text-xs font-mono">✓</span>
              ) : isActive ? (
                <motion.span
                  className="text-sm font-mono"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ◆
                </motion.span>
              ) : (
                <span className="text-xs font-mono">○</span>
              )}
            </motion.div>

            {/* Connector line */}
            {index < totalSteps - 1 && (
              <div className="flex items-center px-1">
                <motion.div
                  className={`h-px w-4 ${
                    index < currentStep
                      ? 'bg-[#FF6B00]/60'
                      : 'bg-white/10'
                  }`}
                  initial={false}
                  animate={{
                    backgroundColor: index < currentStep
                      ? 'rgba(255, 107, 0, 0.6)'
                      : 'rgba(255, 255, 255, 0.1)',
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
