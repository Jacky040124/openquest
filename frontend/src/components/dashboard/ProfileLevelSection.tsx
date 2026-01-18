import { useLevelingStore, getXPForLevel, getCurrentBadge, getNextBadge, BADGES } from '@/store/levelingStore';
import { Progress } from '@/components/ui/progress';
import { Award, Zap, TrendingUp } from 'lucide-react';

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
          <div className={`p-2 rounded-lg ${currentBadge.bgColor}`}>
            <Award className={`w-5 h-5 ${currentBadge.color}`} />
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
          <p className="text-xs text-muted-foreground">
            Next badge: <span className={nextBadge.color}>{nextBadge.name}</span> at level {nextBadge.level}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileLevelSection;
