import { useLevelingStore, getXPForLevel, getCurrentBadge, getNextBadge, getTotalXPForLevel } from '@/store/levelingStore';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap } from 'lucide-react';

interface XPProgressBarProps {
  onOpenRanks?: () => void;
}

// Map badge names to Tailwind background colors
const getBadgeProgressColor = (badgeName: string): string => {
  const colorMap: Record<string, string> = {
    'Iron': 'bg-gray-400',
    'Bronze': 'bg-amber-600',
    'Silver': 'bg-gray-300',
    'Gold': 'bg-yellow-400',
    'Platinum': 'bg-cyan-300',
    'Diamond': 'bg-blue-400',
    'Grandmaster': 'bg-purple-400',
    'Champion': 'bg-red-400',
    'Cipher': 'bg-emerald-400',
    'Quantum': 'bg-indigo-400',
    'Oracle': 'bg-gradient-to-r from-amber-300 via-purple-300 to-cyan-300',
  };
  return colorMap[badgeName] || 'bg-primary';
};

const XPProgressBar = ({ onOpenRanks }: XPProgressBarProps) => {
  const { currentXP, level } = useLevelingStore();
  const xpForNextLevel = getXPForLevel(level + 1);
  const progressPercent = (currentXP / xpForNextLevel) * 100;
  const currentBadge = getCurrentBadge(level);
  const nextBadge = getNextBadge(level);
  
  // Calculate total XP (XP from all previous levels + current progress)
  const totalXP = getTotalXPForLevel(level) + currentXP;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full border border-border cursor-pointer hover:bg-muted/80 transition-colors"
            onClick={onOpenRanks}
          >
            {/* Badge Icon */}
            <div className={`flex items-center gap-1.5 ${currentBadge.color}`}>
              <img src={currentBadge.image} alt={currentBadge.name} className="w-5 h-5 object-contain" />
              <span className="text-xs font-semibold">{currentBadge.name}</span>
            </div>
            
            {/* Level */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Lvl</span>
              <span className="font-bold text-foreground">{level}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-32 relative">
              <Progress 
                value={progressPercent} 
                className="h-2" 
                indicatorClassName={getBadgeProgressColor(currentBadge.name)}
              />
            </div>
            
            {/* XP Display */}
            <div className="flex items-center gap-1 text-xs">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-foreground font-medium">{totalXP.toLocaleString()}</span>
              <span className="text-muted-foreground">XP</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3 max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <img src={currentBadge.image} alt={currentBadge.name} className="w-6 h-6 object-contain" />
              <div>
                <p className="font-semibold">{currentBadge.name} Badge</p>
                <p className="text-xs text-muted-foreground">Level {level}</p>
              </div>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total XP:</span>
                <span className="font-medium">{totalXP.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next level:</span>
                <span>{currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {nextBadge ? (
                <span>
                  <span className={nextBadge.color}>{nextBadge.name}</span> badge unlocks at level {nextBadge.level}
                </span>
              ) : (
                <span className="text-amber-300">Maximum badge achieved!</span>
              )}
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">{(xpForNextLevel - currentXP).toLocaleString()} XP</span> to level {level + 1}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default XPProgressBar;
