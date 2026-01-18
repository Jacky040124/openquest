import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Award, Lock, Check } from 'lucide-react';
import { BADGES, getCurrentBadge } from '@/store/levelingStore';
import { useLevelingStore } from '@/store/levelingStore';

interface RanksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RanksDialog = ({ open, onOpenChange }: RanksDialogProps) => {
  const { level } = useLevelingStore();
  const currentBadge = getCurrentBadge(level);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b-0 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            All Ranks
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {BADGES.map((badge) => {
            const isUnlocked = level >= badge.level;
            const isCurrent = currentBadge.name === badge.name;

            return (
              <div
                key={badge.name}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-primary/20 border-2 border-primary'
                    : isUnlocked
                    ? 'bg-muted/50 hover:bg-muted'
                    : 'bg-muted/30 opacity-60'
                }`}
              >
                {/* Badge Image */}
                <div className={`w-12 h-12 flex items-center justify-center flex-shrink-0 ${
                  badge.name === 'Oracle' && isUnlocked ? 'relative' : ''
                }`}>
                  {badge.name === 'Oracle' && isUnlocked && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-300/40 via-purple-300/40 to-cyan-300/40 blur-md animate-pulse" />
                  )}
                  <img
                    src={badge.image}
                    alt={`${badge.name} badge`}
                    className={`w-12 h-12 object-contain relative z-10 ${!isUnlocked ? 'grayscale opacity-50' : ''} ${
                      badge.name === 'Oracle' && isUnlocked ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''
                    }`}
                  />
                </div>

                {/* Badge Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${badge.color}`}>{badge.name}</span>
                    {isCurrent && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Unlocks at Level {badge.level}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  {isUnlocked ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border">
          Earn XP by contributing to open source projects!
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RanksDialog;
