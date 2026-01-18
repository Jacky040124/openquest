import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Medal, Crown } from 'lucide-react';
import { getCurrentBadge } from '@/store/levelingStore';

interface LeaderboardUser {
  rank: number;
  username: string;
  level: number;
  xp: number;
}

// Mock leaderboard data
const mockLeaderboard: LeaderboardUser[] = [
  { rank: 1, username: 'quantumdev', level: 52, xp: 128450 },
  { rank: 2, username: 'ciphermaster', level: 50, xp: 115200 },
  { rank: 3, username: 'starforge', level: 47, xp: 98700 },
  { rank: 4, username: 'bytecrusher', level: 43, xp: 82100 },
  { rank: 5, username: 'codeweaver', level: 38, xp: 64500 },
  { rank: 6, username: 'syntaxlord', level: 33, xp: 48800 },
  { rank: 7, username: 'devninja', level: 28, xp: 35200 },
  { rank: 8, username: 'gitguru', level: 22, xp: 24500 },
  { rank: 9, username: 'pullrequest', level: 17, xp: 16800 },
  { rank: 10, username: 'commitking', level: 12, xp: 10200 },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-300" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
  }
};

interface LeaderboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeaderboardDialog = ({ open, onOpenChange }: LeaderboardDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Top Contributors
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {mockLeaderboard.map((user) => {
            const badge = getCurrentBadge(user.level);
            return (
              <div
                key={user.rank}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  user.rank <= 3 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center">
                  {getRankIcon(user.rank)}
                </div>
                
                {/* Badge Image */}
                <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                  badge.name === 'Oracle' ? 'relative' : ''
                }`}>
                  {badge.name === 'Oracle' && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-300/40 via-purple-300/40 to-cyan-300/40 blur-md animate-pulse" />
                  )}
                  <img 
                    src={badge.image} 
                    alt={`${badge.name} badge`}
                    className={`w-10 h-10 object-contain relative z-10 ${
                      badge.name === 'Oracle' ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''
                    }`}
                  />
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{user.username}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${badge.bgColor} ${badge.color}`}>
                      {badge.name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Level {user.level}
                  </div>
                </div>
                
                {/* XP */}
                <div className="text-right">
                  <div className="text-sm font-semibold text-primary">{user.xp.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">XP</div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardDialog;
