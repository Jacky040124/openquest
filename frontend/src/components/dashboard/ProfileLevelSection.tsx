import { useLevelingStore, getXPForLevel, getCurrentBadge, getNextBadge } from '@/store/levelingStore';
import { Progress } from '@/components/ui/progress';
import { Zap, TrendingUp } from 'lucide-react';

const ProfileLevelSection = () => {
  const { currentXP, level } = useLevelingStore();
  const xpForNextLevel = getXPForLevel(level + 1);
  const progressPercent = (currentXP / xpForNextLevel) * 100;
  const currentBadge = getCurrentBadge(level);
  const nextBadge = getNextBadge(level);
  
  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-3">
      {/* Current Badge Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-12 h-12 flex items-center justify-center ${
            currentBadge.name === 'Oracle' ? 'relative' : ''
          }`}>
            {currentBadge.name === 'Oracle' && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-300/40 via-purple-300/40 to-cyan-300/40 blur-md animate-pulse" />
            )}
            <img 
              src={currentBadge.image} 
              alt={`${currentBadge.name} badge`}
              className={`w-12 h-12 object-contain relative z-10 ${
                currentBadge.name === 'Oracle' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''
              }`}
            />
          </div>
          <div>
            <p className={`font-semibold text-sm ${currentBadge.color}`}>
              {currentBadge.name}
            </p>
            <p className="text-xs text-muted-foreground">Current Badge</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-foreground">{level}</p>
          <p className="text-xs text-muted-foreground">Level</p>
        </div>
      </div>
      
      {/* XP Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>XP Progress</span>
          </div>
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{currentXP}</span> / {xpForNextLevel} XP
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          {xpForNextLevel - currentXP} XP to level {level + 1}
        </p>
      </div>
      
      {/* Next Badge Info */}
      {nextBadge && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <TrendingUp className="w-3 h-3 text-muted-foreground" />
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">Next badge:</p>
            <img 
              src={nextBadge.image} 
              alt={`${nextBadge.name} badge`}
              className="w-5 h-5 object-contain"
            />
            <span className={`text-xs ${nextBadge.color}`}>{nextBadge.name}</span>
            <span className="text-xs text-muted-foreground">at level {nextBadge.level}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileLevelSection;
