import { Star, GitFork, Circle, ExternalLink, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Repo {
  id: number;
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  issueCount: number;
  matchScore: number;
  goodFirstIssues: number;
}

interface RepoCardProps {
  repo: Repo;
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
  };
  return colors[language] || 'hsl(var(--muted-foreground))';
};

const getMatchScoreColor = (score: number): string => {
  if (score >= 90) return 'bg-primary/20 text-primary border-primary/30';
  if (score >= 80) return 'bg-accent/20 text-accent border-accent/30';
  return 'bg-secondary text-muted-foreground border-border';
};

const RepoCard = ({ repo }: RepoCardProps) => {
  return (
    <div className="card-interactive p-5 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <a
              href={`https://github.com/${repo.owner}/${repo.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <span className="text-muted-foreground text-sm">{repo.owner}/</span>
              <span className="font-semibold text-lg">{repo.name}</span>
              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {repo.description}
          </p>

          {/* Topics */}
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
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Circle
                className="w-3 h-3 fill-current"
                style={{ color: getLanguageColor(repo.language) }}
              />
              <span>{repo.language}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{formatNumber(repo.stars)}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="w-4 h-4" />
              <span>{formatNumber(repo.forks)}</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <AlertCircle className="w-4 h-4" />
              <span>{repo.goodFirstIssues} good first issues</span>
            </div>
          </div>
        </div>

        {/* Match Score */}
        <div className="flex flex-col items-end gap-3">
          <Badge
            className={`text-sm font-semibold px-3 py-1 ${getMatchScoreColor(repo.matchScore)}`}
          >
            {repo.matchScore}% match
          </Badge>
          <Button size="sm" className="btn-primary text-sm">
            View Issues
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RepoCard;
