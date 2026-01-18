import { useLevelingStore, getXPForLevel, getCurrentBadge, getNextBadge, getTotalXPForLevel } from '@/store/levelingStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap } from 'lucide-react';

interface XPProgressBarProps {
  onOpenRanks?: () => void;
}

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
            className="flex items-center gap-3 px-4 py-2 border border-dashed border-border hover:border-primary/60 cursor-pointer transition-all duration-200 bg-card/50"
            onClick={onOpenRanks}
          >
            {/* Badge Icon */}
            <div className="flex items-center gap-1.5">
              <img src={currentBadge.image} alt={currentBadge.name} className="w-5 h-5 object-contain" />
              <span className="text-xs font-mono font-medium text-primary">{currentBadge.name}</span>
            </div>

            {/* Divider */}
            <span className="text-muted-foreground font-mono text-xs">|</span>

            {/* Level */}
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-muted-foreground">Lvl</span>
              <span className="font-bold text-foreground">{level}</span>
            </div>

            {/* Progress Bar - Terminal style */}
            <div className="w-24 h-1.5 bg-muted relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* XP Display */}
            <div className="flex items-center gap-1 text-xs font-mono">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-foreground font-medium">{totalXP.toLocaleString()}</span>
              <span className="text-muted-foreground">XP</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3 max-w-xs font-mono">
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-dashed border-border">
              <img src={currentBadge.image} alt={currentBadge.name} className="w-6 h-6 object-contain" />
              <div>
                <p className="font-semibold text-primary">{currentBadge.name}</p>
                <p className="text-xs text-muted-foreground">Level {level}</p>
              </div>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">total_xp:</span>
                <span className="font-medium">{totalXP.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">progress:</span>
                <span>{currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">next_level:</span>
                <span className="text-primary">{(xpForNextLevel - currentXP).toLocaleString()} xp</span>
              </div>
            </div>
            {nextBadge && (
              <div className="text-xs text-muted-foreground pt-2 border-t border-dashed border-border">
                <span className="text-primary">{nextBadge.name}</span> unlocks at lvl {nextBadge.level}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default XPProgressBar;
