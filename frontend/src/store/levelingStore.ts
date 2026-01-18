import { create } from 'zustand';

export interface Badge {
  name: string;
  level: number;
  color: string;
  bgColor: string;
}

export const BADGES: Badge[] = [
  { name: 'Iron', level: 0, color: 'text-gray-400', bgColor: 'bg-gray-400/20' },
  { name: 'Bronze', level: 5, color: 'text-amber-600', bgColor: 'bg-amber-600/20' },
  { name: 'Silver', level: 10, color: 'text-gray-300', bgColor: 'bg-gray-300/20' },
  { name: 'Gold', level: 15, color: 'text-yellow-400', bgColor: 'bg-yellow-400/20' },
  { name: 'Platinum', level: 20, color: 'text-cyan-300', bgColor: 'bg-cyan-300/20' },
  { name: 'Diamond', level: 25, color: 'text-blue-400', bgColor: 'bg-blue-400/20' },
  { name: 'Grandmaster', level: 30, color: 'text-purple-400', bgColor: 'bg-purple-400/20' },
  { name: 'Champion', level: 35, color: 'text-red-400', bgColor: 'bg-red-400/20' },
  { name: 'Cipher', level: 40, color: 'text-emerald-400', bgColor: 'bg-emerald-400/20' },
  { name: 'Quantum', level: 45, color: 'text-indigo-400', bgColor: 'bg-indigo-400/20' },
  { name: 'Oracle', level: 50, color: 'text-amber-300', bgColor: 'bg-gradient-to-r from-amber-400/20 to-orange-400/20' },
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
  currentXP: 150, // Start with some XP for demo
  level: 2, // Start at level 2 for demo
  
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
