import { motion } from 'framer-motion';

interface SelectionChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const SelectionChip = ({ label, selected, onClick, icon }: SelectionChipProps) => {
  return (
    <motion.button
      onClick={onClick}
      className={`selection-chip ${selected ? 'selection-chip-active' : ''} flex items-center gap-2`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{label}</span>
    </motion.button>
  );
};

export default SelectionChip;
