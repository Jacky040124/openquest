import { useNavigate } from 'react-router-dom';
import { Star, GitFork, Circle, ExternalLink, AlertCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateRepoXP } from '@/store/levelingStore';
import type { RepoDTO } from '@/types/api';

interface RepoCardProps {
  repo: RepoDTO;
}

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    JavaScript: 'hsl(50, 80%, 50%)',
    TypeScript: 'hsl(210, 80%, 55%)',
    Python: 'hsl(210, 50%, 50%)',
    CSS: 'hsl(280, 70%, 60%)',
    HTML: 'hsl(15, 80%, 55%)',
    Go: 'hsl(190, 80%, 50%)',
    Rust: 'hsl(25, 80%, 55%)',
    Java: 'hsl(25, 60%, 50%)',
    Ruby: 'hsl(0, 70%, 55%)',
    PHP: 'hsl(240, 40%, 60%)',
    Swift: 'hsl(20, 90%, 55%)',
    Kotlin: 'hsl(270, 70%, 60%)',
  };
  return colors[language] || 'hsl(var(--muted-foreground))';
};

const getMatchScoreColor = (score: number): string => {
  if (score >= 85) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (score >= 70) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
};

const RepoCard = ({ repo }: RepoCardProps) => {
  const navigate = useNavigate();
  // Parse owner from full_name (format: "owner/repo")
  const [owner] = repo.full_name.split('/');
  const xpReward = calculateRepoXP({
    stars: repo.stars,
    forks: 0, // RepoDTO doesn't have forks, using 0
    issueCount: repo.open_issues_count,
    goodFirstIssues: repo.good_first_issue_count,
  });

  const handleViewIssues = () => {
    navigate(`/issues?repo_url=${encodeURIComponent(repo.url)}&repo_name=${encodeURIComponent(repo.full_name)}`);
  };

  return (
    <div className="card-interactive p-5 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <span className="text-muted-foreground text-sm">{owner}/</span>
              <span className="font-semibold text-lg">{repo.name}</span>
              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* Description */}
          {repo.description && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {repo.description}
            </p>
          )}

          {/* Topics */}
          {repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {repo.topics.slice(0, 4).map((topic) => (
                <Badge
                  key={topic}
                  variant="secondary"
                  className="text-xs bg-secondary/50 hover:bg-secondary"
                >
                  {topic}
                </Badge>
              ))}
              {repo.topics.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{repo.topics.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {repo.language && (
              <div className="flex items-center gap-1">
                <Circle
                  className="w-3 h-3 fill-current"
                  style={{ color: getLanguageColor(repo.language) }}
                />
                <span>{repo.language}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{formatNumber(repo.stars)}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>{formatNumber(repo.open_issues_count)} open issues</span>
            </div>
            {repo.good_first_issue_count > 0 && (
              <div className="flex items-center gap-1 text-primary">
                <AlertCircle className="w-4 h-4" />
                <span>{repo.good_first_issue_count} good first issues</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-3">
          <Button 
            size="sm" 
            className="btn-primary text-sm"
            onClick={handleViewIssues}
          >
            View Issues
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RepoCard;
