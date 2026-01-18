import { useLevelingStore, getXPForLevel, getCurrentBadge, getNextBadge } from '@/store/levelingStore';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, Award } from 'lucide-react';

const XPProgressBar = () => {
  const { currentXP, level } = useLevelingStore();
  const xpForNextLevel = getXPForLevel(level + 1);
  const progressPercent = (currentXP / xpForNextLevel) * 100;
  const currentBadge = getCurrentBadge(level);
  const nextBadge = getNextBadge(level);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full border border-border cursor-pointer hover:bg-muted/80 transition-colors">
            {/* Badge Icon */}
            <div className={`flex items-center gap-1.5 ${currentBadge.color}`}>
              <Award className="w-4 h-4" />
              <span className="text-xs font-semibold">{currentBadge.name}</span>
            </div>
            
            {/* Level */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Lvl</span>
              <span className="font-bold text-foreground">{level}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-32 relative">
              <Progress value={progressPercent} className="h-2" />
            </div>
            
            {/* XP Display */}
            <div className="flex items-center gap-1 text-xs">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-muted-foreground">
                <span className="text-foreground font-medium">{currentXP}</span>
                <span className="text-muted-foreground">/{xpForNextLevel}</span>
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3 max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className={`w-5 h-5 ${currentBadge.color}`} />
              <div>
                <p className="font-semibold">{currentBadge.name} Badge</p>
                <p className="text-xs text-muted-foreground">Level {level}</p>
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
              <span className="text-muted-foreground">{xpForNextLevel - currentXP} XP</span> to level {level + 1}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default XPProgressBar;
