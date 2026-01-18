import { create } from 'zustand';

// Badge images
import ironBadge from '@/assets/badges/iron.png';
import bronzeBadge from '@/assets/badges/bronze.png';
import silverBadge from '@/assets/badges/silver.png';
import goldBadge from '@/assets/badges/gold.png';
import platinumBadge from '@/assets/badges/platinum.png';
import diamondBadge from '@/assets/badges/diamond.png';
import grandmasterBadge from '@/assets/badges/grandmaster.png';
import championBadge from '@/assets/badges/champion.png';
import cipherBadge from '@/assets/badges/cipher.png';
import quantumBadge from '@/assets/badges/quantum.png';
import oracleBadge from '@/assets/badges/oracle.png';

export interface Badge {
  name: string;
  level: number;
  color: string;
  bgColor: string;
  image: string;
}

export const BADGES: Badge[] = [
  { name: 'Iron', level: 0, color: 'text-gray-400', bgColor: 'bg-gray-400/20', image: ironBadge },
  { name: 'Bronze', level: 5, color: 'text-amber-600', bgColor: 'bg-amber-600/20', image: bronzeBadge },
  { name: 'Silver', level: 10, color: 'text-gray-300', bgColor: 'bg-gray-300/20', image: silverBadge },
  { name: 'Gold', level: 15, color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', image: goldBadge },
  { name: 'Platinum', level: 20, color: 'text-cyan-300', bgColor: 'bg-cyan-300/20', image: platinumBadge },
  { name: 'Diamond', level: 25, color: 'text-blue-400', bgColor: 'bg-blue-400/20', image: diamondBadge },
  { name: 'Grandmaster', level: 30, color: 'text-purple-400', bgColor: 'bg-purple-400/20', image: grandmasterBadge },
  { name: 'Champion', level: 35, color: 'text-red-400', bgColor: 'bg-red-400/20', image: championBadge },
  { name: 'Cipher', level: 40, color: 'text-emerald-400', bgColor: 'bg-emerald-400/20', image: cipherBadge },
  { name: 'Quantum', level: 45, color: 'text-indigo-400', bgColor: 'bg-indigo-400/20', image: quantumBadge },
  { name: 'Oracle', level: 50, color: 'text-amber-300', bgColor: 'bg-gradient-to-r from-amber-400/20 to-orange-400/20', image: oracleBadge },
];

// XP required for each level (exponential growth)
export const getXPForLevel = (level: number): number => {
  if (level <= 0) return 0;
  // Base XP is 100, grows by 15% each level
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

// Get total XP needed to reach a specific level
export const getTotalXPForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXPForLevel(i);
  }
  return total;
};

// Calculate XP for a repo based on its characteristics
export const calculateRepoXP = (repo: {
  stars: number;
  forks: number;
  issueCount: number;
  goodFirstIssues?: number;
}): number => {
  // Base XP
  let xp = 50;
  
  // Size/popularity factor (more stars = harder = more XP)
  if (repo.stars > 100000) xp += 150;
  else if (repo.stars > 50000) xp += 100;
  else if (repo.stars > 10000) xp += 50;
  else if (repo.stars > 1000) xp += 25;
  
  // Contributor factor (more forks = larger community = more complex)
  if (repo.forks > 10000) xp += 100;
  else if (repo.forks > 5000) xp += 50;
  else if (repo.forks > 1000) xp += 25;
  
  // Issue complexity (more issues = more complex codebase)
  if (repo.issueCount > 1000) xp += 75;
  else if (repo.issueCount > 500) xp += 50;
  else if (repo.issueCount > 100) xp += 25;
  
  return xp;
};

// Get current badge based on level
export const getCurrentBadge = (level: number): Badge => {
  let currentBadge = BADGES[0];
  for (const badge of BADGES) {
    if (level >= badge.level) {
      currentBadge = badge;
    }
  }
  return currentBadge;
};

// Get next badge
export const getNextBadge = (level: number): Badge | null => {
  for (const badge of BADGES) {
    if (badge.level > level) {
      return badge;
    }
  }
  return null;
};

interface LevelingState {
  currentXP: number;
  level: number;
  addXP: (amount: number) => void;
  resetProgress: () => void;
}

export const useLevelingStore = create<LevelingState>((set, get) => ({
  currentXP: 850, // XP towards next level
  level: 22, // Platinum rank (20-24)
  
  addXP: (amount: number) => {
    const { currentXP, level } = get();
    let newXP = currentXP + amount;
    let newLevel = level;
    
    // Level up while there's enough XP
    while (newXP >= getXPForLevel(newLevel + 1)) {
      newXP -= getXPForLevel(newLevel + 1);
      newLevel++;
    }
    
    set({ currentXP: newXP, level: newLevel });
  },
  
  resetProgress: () => set({ currentXP: 0, level: 0 }),
}));
