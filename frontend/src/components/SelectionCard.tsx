import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SelectionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  selected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const SelectionCard = ({
  title,
  description,
  icon,
  selected,
  onClick,
  size = 'md',
}: SelectionCardProps) => {
  const sizeClasses = {
    sm: 'p-3 min-h-[80px]',
    md: 'p-4 min-h-[100px]',
    lg: 'p-6 min-h-[120px]',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`card-interactive ${sizeClasses[size]} ${
        selected ? 'card-selected' : ''
      } text-left w-full`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`flex-shrink-0 ${
              selected ? 'text-primary' : 'text-muted-foreground'
            } transition-colors duration-200`}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold ${
              selected ? 'text-primary' : 'text-foreground'
            } transition-colors duration-200`}
          >
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 w-5 h-5">
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
            >
              <svg
                className="w-3 h-3 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default SelectionCard;
