import { useNavigate } from 'react-router-dom';
import { Star, ExternalLink, ChevronRight } from 'lucide-react';
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

// Remove emojis from text
const stripEmojis = (text: string): string => {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, Hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Various symbols
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // Various symbols
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play button
    .replace(/[\u{25C0}]/gu, '')            // Reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // Squares
    .replace(/[\u{2614}-\u{2615}]/gu, '')   // Umbrella, Hot beverage
    .replace(/[\u{2648}-\u{2653}]/gu, '')   // Zodiac
    .replace(/[\u{267F}]/gu, '')            // Wheelchair
    .replace(/[\u{2693}]/gu, '')            // Anchor
    .replace(/[\u{26A1}]/gu, '')            // High voltage
    .replace(/[\u{26AA}-\u{26AB}]/gu, '')   // Circles
    .replace(/[\u{26BD}-\u{26BE}]/gu, '')   // Sports balls
    .replace(/[\u{26C4}-\u{26C5}]/gu, '')   // Snowman, Sun
    .replace(/[\u{26CE}]/gu, '')            // Ophiuchus
    .replace(/[\u{26D4}]/gu, '')            // No entry
    .replace(/[\u{26EA}]/gu, '')            // Church
    .replace(/[\u{26F2}-\u{26F3}]/gu, '')   // Fountain, Golf
    .replace(/[\u{26F5}]/gu, '')            // Sailboat
    .replace(/[\u{26FA}]/gu, '')            // Tent
    .replace(/[\u{26FD}]/gu, '')            // Fuel pump
    .replace(/[\u{2702}]/gu, '')            // Scissors
    .replace(/[\u{2705}]/gu, '')            // Check mark
    .replace(/[\u{2708}-\u{270D}]/gu, '')   // Various
    .replace(/[\u{270F}]/gu, '')            // Pencil
    .replace(/[\u{2712}]/gu, '')            // Black nib
    .replace(/[\u{2714}]/gu, '')            // Check mark
    .replace(/[\u{2716}]/gu, '')            // X mark
    .replace(/[\u{271D}]/gu, '')            // Latin cross
    .replace(/[\u{2721}]/gu, '')            // Star of David
    .replace(/[\u{2728}]/gu, '')            // Sparkles
    .replace(/[\u{2733}-\u{2734}]/gu, '')   // Eight spoked asterisk
    .replace(/[\u{2744}]/gu, '')            // Snowflake
    .replace(/[\u{2747}]/gu, '')            // Sparkle
    .replace(/[\u{274C}]/gu, '')            // Cross mark
    .replace(/[\u{274E}]/gu, '')            // Cross mark
    .replace(/[\u{2753}-\u{2755}]/gu, '')   // Question marks
    .replace(/[\u{2757}]/gu, '')            // Exclamation
    .replace(/[\u{2763}-\u{2764}]/gu, '')   // Hearts
    .replace(/[\u{2795}-\u{2797}]/gu, '')   // Math symbols
    .replace(/[\u{27A1}]/gu, '')            // Arrow
    .replace(/[\u{27B0}]/gu, '')            // Curly loop
    .replace(/[\u{27BF}]/gu, '')            // Double curly loop
    .replace(/[\u{2934}-\u{2935}]/gu, '')   // Arrows
    .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // Arrows
    .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // Squares
    .replace(/[\u{2B50}]/gu, '')            // Star
    .replace(/[\u{2B55}]/gu, '')            // Circle
    .replace(/[\u{3030}]/gu, '')            // Wavy dash
    .replace(/[\u{303D}]/gu, '')            // Part alternation mark
    .replace(/[\u{3297}]/gu, '')            // Circled Ideograph Congratulation
    .replace(/[\u{3299}]/gu, '')            // Circled Ideograph Secret
    .replace(/\s+/g, ' ')                   // Collapse multiple spaces
    .trim();
};

// ASCII-style icons for languages (no emoji)
const getLanguageIcon = (language: string): string => {
  const icons: Record<string, string> = {
    JavaScript: '{ }',
    TypeScript: '<T>',
    Python: '>>>',
    Go: 'go>',
    Rust: 'rs>',
    Java: 'jav',
    Ruby: 'rb>',
    PHP: '<?',
    Swift: 'swf',
    Kotlin: 'kt>',
    'C++': 'C++',
    C: '.c',
    'C#': 'C#',
    Shell: '$_',
    Bash: '$_',
    HTML: '</>',
    CSS: '#{}',
    Scala: 'sc>',
    Elixir: 'ex>',
    Haskell: 'hs>',
    Lua: 'lua',
    Perl: 'pl>',
    R: 'R>>',
    Dart: 'drt',
    Vue: 'vue',
    Jupyter: 'jup',
  };
  return icons[language] || '//>';
};

const RepoCard = ({ repo }: RepoCardProps) => {
  const navigate = useNavigate();
  const [owner] = repo.full_name.split('/');

  const handleViewIssues = () => {
    navigate(`/issues?repo_url=${encodeURIComponent(repo.url)}&repo_name=${encodeURIComponent(repo.full_name)}`);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a[href]') || target.closest('button')) {
      return;
    }
    handleViewIssues();
  };

  return (
    <div
      className="group cursor-pointer border border-dashed border-border hover:border-primary/60 bg-card transition-all duration-300 h-[220px] flex flex-col"
      onClick={handleCardClick}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-dashed border-border bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-primary">{getLanguageIcon(repo.language)}</span>
          <span className="font-mono text-xs text-muted-foreground uppercase">{repo.language || 'unknown'}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {formatNumber(repo.stars)}
          </span>
          {repo.good_first_issue_count > 0 && (
            <span className="text-primary">{repo.good_first_issue_count} gfi</span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Repo name */}
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 group/link hover:text-primary transition-colors mb-2"
        >
          <span className="font-mono text-sm text-muted-foreground">{owner}/</span>
          <span className="font-mono font-bold text-foreground group-hover/link:text-primary">{repo.name}</span>
          <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
        </a>

        {/* Description */}
        <p className="text-muted-foreground text-xs font-mono line-clamp-2 mb-3">
          {repo.description ? stripEmojis(repo.description) : 'No description available'}
        </p>

        {/* Topics - single row only */}
        {repo.topics.length > 0 && (
          <div className="flex gap-1.5 mb-3 flex-wrap max-h-6 overflow-hidden">
            {repo.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 text-xs font-mono text-muted-foreground border border-dashed border-border truncate max-w-[120px]"
                title={topic}
              >
                #{topic}
              </span>
            ))}
            {repo.topics.length > 3 && (
              <span className="px-2 py-0.5 text-xs font-mono text-muted-foreground">
                +{repo.topics.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-dashed border-border">
          <span className="text-xs font-mono text-muted-foreground">
            {repo.open_issues_count} issues
          </span>
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-foreground border border-border hover:bg-foreground hover:text-background transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              handleViewIssues();
            }}
          >
            explore
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepoCard;
