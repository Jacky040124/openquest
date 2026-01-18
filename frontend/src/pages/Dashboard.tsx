import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Search, RefreshCw, Code2, Target, Folder, Edit2, ArrowUpDown, Loader2, Wrench, Trophy, Github, CheckCircle2, Link, Terminal, Star, GitFork, Zap, ChevronRight, Command, Box } from 'lucide-react';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';
import { useLogout, useUserPreferences, useVerifyAuth } from '@/hooks/useAuth';
import { useRecommendations } from '@/hooks/useRepos';
import { useGitHubStatus, useGitHubAuthorize, useDisconnectGitHub } from '@/hooks/useGitHubOAuth';
import { useState, useMemo, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import RepoCard from '@/components/dashboard/RepoCard';
import EditPreferencesDialog from '@/components/dashboard/EditPreferencesDialog';
import SignOutDialog from '@/components/dashboard/SignOutDialog';
import XPProgressBar from '@/components/dashboard/XPProgressBar';
import ProfileLevelSection from '@/components/dashboard/ProfileLevelSection';
import LeaderboardDialog from '@/components/dashboard/LeaderboardDialog';
import RanksDialog from '@/components/dashboard/RanksDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import logo from "@/assets/logo.png";

// Format large numbers like E2B (e.g., 1.2M, 45K)
const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M+';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
  }
  return num.toString();
};

// Display labels for issue interests
const issueInterestLabels: Record<string, string> = {
  bug_fix: 'Bug Fixes',
  feature: 'Features',
  enhancement: 'Enhancements',
  optimization: 'Optimization',
  refactor: 'Refactoring',
  testing: 'Testing',
  documentation: 'Docs',
  accessibility: 'A11y',
  security: 'Security',
  ui_ux: 'UI/UX',
  dependency: 'Deps',
  ci_cd: 'CI/CD',
  cleanup: 'Cleanup',
};

// Display labels for project interests
const projectInterestLabels: Record<string, string> = {
  webapp: 'Web Apps',
  mobile: 'Mobile',
  desktop: 'Desktop',
  cli: 'CLI',
  api: 'APIs',
  library: 'Libraries',
  llm: 'LLM/AI',
  ml: 'ML',
  data: 'Data',
  devtools: 'DevTools',
  game: 'Games',
  blockchain: 'Blockchain',
  iot: 'IoT',
  security: 'Security',
  automation: 'Automation',
  infrastructure: 'Infra',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { preferences, resetPreferences } = usePreferencesStore();
  const { isLoggedIn, user } = useAuthStore();
  const { mutate: logout } = useLogout();

  // Verify auth token on mount - will redirect to login if invalid
  // Also fetches user preferences together with auth verification
  const { isVerifying, isAuthenticated, preferences: verifiedPrefs } = useVerifyAuth();

  const { data: repos, isLoading, error, refetch } = useRecommendations({ limit: 10 });
  // Use preferences from useVerifyAuth, fallback to useUserPreferences for updates
  const { data: queryPrefs } = useUserPreferences();
  const userPrefs = queryPrefs || verifiedPrefs;
  const { data: githubStatus, isLoading: isLoadingGithub } = useGitHubStatus();
  const githubAuthorize = useGitHubAuthorize();
  const disconnectGitHub = useDisconnectGitHub();

  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showEditPreferences, setShowEditPreferences] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [sortBy, setSortBy] = useState<'stars' | 'issues' | 'forks'>('stars');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRanks, setShowRanks] = useState(false);

  const filteredAndSortedRepos = useMemo(() => {
    if (!repos) return [];

    const filtered = repos.filter(repo =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      repo.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'stars':
          comparison = a.stars - b.stars;
          break;
        case 'issues':
          comparison = a.open_issues_count - b.open_issues_count;
          break;
        case 'forks':
          // RepoDTO doesn't have forks, use stars as fallback
          comparison = a.stars - b.stars;
          break;
        default:
          // Default sort by stars
          comparison = a.stars - b.stars;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [repos, searchQuery, sortBy, sortOrder]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // Show loading while verifying auth token
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-mono text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isLoggedIn || !isAuthenticated) {
    return null;
  }


  const handleLogoClick = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleLogout = () => {
    setShowSignOutDialog(false);
    resetPreferences();
    logout();
  };

  const handleSignOutClick = () => {
    setShowSignOutDialog(true);
  };

  const handleEditPreferences = () => {
    setShowProfile(false);
    setShowEditPreferences(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Calculate stats (show 0 during loading, only show real data after loaded)
  const totalStars = repos?.reduce((sum, r) => sum + r.stars, 0) || 0;
  const totalIssues = repos?.reduce((sum, r) => sum + r.open_issues_count, 0) || 0;
  const totalGoodFirst = repos?.reduce((sum, r) => sum + r.good_first_issue_count, 0) || 0;

  return (
    <div className="min-h-screen bg-background terminal-grid">
      {/* Subtle grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(90deg, hsl(0 0% 20% / 0.1) 1px, transparent 1px),
            linear-gradient(hsl(0 0% 20% / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Header - E2B style minimal */}
      <header className="relative z-50 border-b border-dashed border-border bg-background/95 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 cursor-pointer group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleLogoClick}
          >
            <img src={logo} alt="OpenQuest" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              OpenQuest
            </span>
            <span className="font-mono text-xs text-muted-foreground hidden sm:inline">/EXPLORE</span>
          </motion.div>

          {/* Center - XP Progress */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex items-center gap-3"
          >
            <XPProgressBar onOpenRanks={() => setShowRanks(true)} />
            <button
              onClick={() => setShowLeaderboard(true)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors border border-dashed border-border rounded hover:border-primary"
            >
              <Trophy className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Right - Actions */}
          <div className="flex items-center gap-1">
            <Popover open={showProfile} onOpenChange={setShowProfile}>
              <PopoverTrigger asChild>
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-dashed hover:border-border rounded">
                  <User className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 bg-card border-dashed border-border">
                <div className="p-4 font-mono">
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded border border-dashed border-primary bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{userPrefs?.user_name || 'Developer'}</h3>
                      <p className="text-muted-foreground text-xs">
                        <span className="text-primary">$</span> open_source_contributor
                      </p>
                    </div>
                  </div>

                  {/* Level & Badge Section */}
                  <ProfileLevelSection />

                  <Separator className="my-4 border-dashed" />

                  {/* Preferences Summary */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {/* Languages */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Code2 className="w-3 h-3" />
                        <span className="uppercase tracking-wider">Languages</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {userPrefs?.languages && userPrefs.languages.length > 0 ? (
                          userPrefs.languages.slice(0, 4).map((lang) => (
                            <Badge key={lang} variant="outline" className="text-xs font-mono border-dashed">
                              {lang}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {userPrefs?.languages && userPrefs.languages.length > 4 && (
                          <Badge variant="outline" className="text-xs font-mono border-dashed">+{userPrefs.languages.length - 4}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Wrench className="w-3 h-3" />
                        <span className="uppercase tracking-wider">Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {userPrefs?.skills && userPrefs.skills.length > 0 ? (
                          userPrefs.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill.name} variant="outline" className="text-xs font-mono border-dashed">
                              {skill.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {userPrefs?.skills && userPrefs.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs font-mono border-dashed">+{userPrefs.skills.length - 4}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Issue Interests */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Target className="w-3 h-3" />
                        <span className="uppercase tracking-wider">Issue Types</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {userPrefs?.issue_interests && userPrefs.issue_interests.length > 0 ? (
                          userPrefs.issue_interests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="outline" className="text-xs font-mono border-dashed">
                              {issueInterestLabels[interest] || interest}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {userPrefs?.issue_interests && userPrefs.issue_interests.length > 3 && (
                          <Badge variant="outline" className="text-xs font-mono border-dashed">+{userPrefs.issue_interests.length - 3}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Project Interests */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Folder className="w-3 h-3" />
                        <span className="uppercase tracking-wider">Project Types</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {userPrefs?.project_interests && userPrefs.project_interests.length > 0 ? (
                          userPrefs.project_interests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="outline" className="text-xs font-mono border-dashed">
                              {projectInterestLabels[interest] || interest}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {userPrefs?.project_interests && userPrefs.project_interests.length > 3 && (
                          <Badge variant="outline" className="text-xs font-mono border-dashed">+{userPrefs.project_interests.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4 border-dashed" />

                  {/* Edit Preferences Button */}
                  <Button
                    variant="outline"
                    className="w-full gap-2 font-mono text-xs uppercase tracking-wider border-dashed hover:border-primary hover:text-primary"
                    onClick={handleEditPreferences}
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit Preferences
                  </Button>

                  <Separator className="my-4 border-dashed" />

                  {/* GitHub Connection */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                      <Github className="w-3 h-3" />
                      <span>GitHub Connection</span>
                    </div>
                    {isLoadingGithub ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="font-mono text-xs">checking...</span>
                      </div>
                    ) : githubStatus?.connected ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-400 font-mono">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs">@{githubStatus.username}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground hover:text-destructive font-mono text-xs"
                          onClick={() => disconnectGitHub.mutate()}
                          disabled={disconnectGitHub.isPending}
                        >
                          {disconnectGitHub.isPending ? 'disconnecting...' : 'disconnect'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full gap-2 font-mono text-xs border-dashed"
                        onClick={() => githubAuthorize.mutate()}
                        disabled={githubAuthorize.isPending}
                      >
                        {githubAuthorize.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            connecting...
                          </>
                        ) : (
                          <>
                            <Link className="w-4 h-4" />
                            connect github
                          </>
                        )}
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      <span className="text-primary">#</span> required for agent push
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <button
              onClick={handleSignOutClick}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors border border-transparent hover:border-dashed hover:border-destructive rounded"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Stats Section - E2B style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-dashed border-border mb-8"
        >
          <div className="grid grid-cols-3 divide-x divide-dashed divide-border">
            <div className="stat-display">
              <div className="stat-value text-primary">{repos?.length || 0}</div>
              <div className="stat-label">matched repos</div>
            </div>
            <div className="stat-display">
              <div className="stat-value">{formatLargeNumber(totalIssues)}</div>
              <div className="stat-label">total issues</div>
            </div>
            <div className="stat-display">
              <div className="stat-value">{formatLargeNumber(totalStars)}</div>
              <div className="stat-label">total stars</div>
            </div>
          </div>
        </motion.div>

        {/* Use Cases Section Label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="hover-tag mb-2">hover (↓↓)</div>
          <h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight">
            <span className="text-muted-foreground">[</span> RECOMMENDED FOR{' '}
            <span className="text-primary">{userPrefs?.user_name?.toUpperCase() || 'YOU'}</span>{' '}
            <span className="text-muted-foreground">]</span>
          </h1>
        </motion.div>

        {/* Main Content */}
        <main>
          {/* Search and Filter - Terminal style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <div className="relative flex-1">
              <Command className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <Input
                placeholder="search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-dashed border-border font-mono text-sm placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 font-mono text-xs uppercase tracking-wider border-dashed hover:border-primary">
                    <ArrowUpDown className="w-3 h-3" />
                    {sortBy}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-dashed font-mono">
                  <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator className="border-dashed" />
                  <DropdownMenuItem onClick={() => setSortBy('stars')} className="text-xs">
                    <Star className="w-3 h-3 mr-2" /> Stars {sortBy === 'stars' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('issues')} className="text-xs">
                    <Box className="w-3 h-3 mr-2" /> Issues {sortBy === 'issues' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('forks')} className="text-xs">
                    <GitFork className="w-3 h-3 mr-2" /> Forks {sortBy === 'forks' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-dashed" />
                  <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} className="text-xs">
                    {sortOrder === 'desc' ? '↓ desc' : '↑ asc'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                className="gap-2 font-mono text-xs uppercase tracking-wider border-dashed hover:border-primary"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 border border-dashed border-border"
            >
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <span className="mt-4 font-mono text-sm text-muted-foreground">
                <span className="text-primary">$</span> loading recommendations...
              </span>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 border border-dashed border-destructive"
            >
              <p className="text-destructive mb-4 font-mono text-sm">
                <span className="text-muted-foreground">[ERROR]</span> Failed to load recommendations
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="font-mono text-xs uppercase tracking-wider border-dashed"
              >
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Repo Grid - E2B card style */}
          {!isLoading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredAndSortedRepos.map((repo, index) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <RepoCard repo={repo} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!isLoading && !error && filteredAndSortedRepos.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 border border-dashed border-border"
            >
              <Terminal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-mono text-sm">
                {searchQuery ? (
                  <>
                    <span className="text-primary">$</span> no results for "{searchQuery}"
                  </>
                ) : (
                  <>
                    <span className="text-primary">$</span> no recommendations available
                  </>
                )}
              </p>
              <p className="text-muted-foreground font-mono text-xs mt-2">
                try updating your preferences
              </p>
            </motion.div>
          )}
        </main>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-primary">&gt;</span> click any card to explore issues
          </p>
        </motion.div>
      </div>

      {/* Edit Preferences Dialog */}
      <EditPreferencesDialog
        open={showEditPreferences}
        onOpenChange={setShowEditPreferences}
      />

      {/* Sign Out Confirmation Dialog */}
      <SignOutDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={handleLogout}
      />

      {/* Leaderboard Dialog */}
      <LeaderboardDialog
        open={showLeaderboard}
        onOpenChange={setShowLeaderboard}
      />

      {/* Ranks Dialog */}
      <RanksDialog
        open={showRanks}
        onOpenChange={setShowRanks}
      />
    </div>
  );
};

export default Dashboard;
