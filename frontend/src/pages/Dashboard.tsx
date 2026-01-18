import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Search, Filter, RefreshCw, Code2, Layers, Target, Folder, Edit2, ArrowUpDown, Loader2, Wrench } from 'lucide-react';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';
import { useLogout, useUserPreferences } from '@/hooks/useAuth';
import { useRecommendations } from '@/hooks/useRepos';
import { useState, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import logo from "@/assets/logo.png";

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
  const { data: repos, isLoading, error, refetch } = useRecommendations({ limit: 10 });
  const { data: userPrefs } = useUserPreferences();

  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showEditPreferences, setShowEditPreferences] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [sortBy, setSortBy] = useState<'stars' | 'issues' | 'forks'>('stars');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-30"
          style={{ background: 'radial-gradient(circle, hsl(220 70% 45% / 0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-30"
          style={{ background: 'radial-gradient(circle, hsl(45 95% 55% / 0.08) 0%, transparent 70%)' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-border bg-background sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleLogoClick}
          >
            <img src={logo} alt="OpenQuest" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-lg text-foreground">OpenQuest</span>
          </motion.div>

          {/* XP Progress Bar - Center */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <XPProgressBar />
          </motion.div>

          <div className="flex items-center gap-2">
            <Popover open={showProfile} onOpenChange={setShowProfile}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <User className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-4">
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{user?.email || 'Developer'}</h3>
                      <p className="text-muted-foreground text-sm">
                        Open source contributor
                      </p>
                    </div>
                  </div>

                  {/* Level & Badge Section */}
                  <ProfileLevelSection />

                  <Separator className="my-4" />

                  {/* Preferences Summary */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {/* Languages */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Code2 className="w-3 h-3" />
                        <span>Languages</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {userPrefs?.languages && userPrefs.languages.length > 0 ? (
                          userPrefs.languages.slice(0, 4).map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {userPrefs?.languages && userPrefs.languages.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{userPrefs.languages.length - 4}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Wrench className="w-3 h-3" />
                        <span>Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {userPrefs?.skills && userPrefs.skills.length > 0 ? (
                          userPrefs.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill.name} variant="secondary" className="text-xs capitalize">
                              {skill.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {userPrefs?.skills && userPrefs.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{userPrefs.skills.length - 4}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Issue Interests */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Target className="w-3 h-3" />
                        <span>Issue Types</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {userPrefs?.issue_interests && userPrefs.issue_interests.length > 0 ? (
                          userPrefs.issue_interests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                              {issueInterestLabels[interest] || interest}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {userPrefs?.issue_interests && userPrefs.issue_interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{userPrefs.issue_interests.length - 3}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Project Interests */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Folder className="w-3 h-3" />
                        <span>Project Types</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {userPrefs?.project_interests && userPrefs.project_interests.length > 0 ? (
                          userPrefs.project_interests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                              {projectInterestLabels[interest] || interest}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {userPrefs?.project_interests && userPrefs.project_interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{userPrefs.project_interests.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Edit Preferences Button */}
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleEditPreferences}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Preferences
                  </Button>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-primary">{repos?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Matches</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-accent">
                        {repos?.reduce((sum, r) => sum + r.good_first_issue_count, 0) || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Good First Issues</div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOutClick}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Main Content */}
        <main>
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, <span className="gradient-text">{user?.email?.split('@')[0] || 'Developer'}</span>
            </h1>
            <p className="text-muted-foreground">
              Here are some open source projects that match your preferences
            </p>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Sort: {sortBy === 'stars' ? 'Stars' : sortBy === 'issues' ? 'Issues' : 'Forks'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('stars')}>
                  Stars {sortBy === 'stars' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('issues')}>
                  Good First Issues {sortBy === 'issues' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('forks')}>
                  Forks {sortBy === 'forks' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
                  {sortOrder === 'desc' ? '↓ Descending' : '↑ Ascending'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading recommendations...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">Failed to load recommendations.</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Repo Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4"
          >
            {filteredAndSortedRepos.map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <RepoCard repo={repo} />
              </motion.div>
            ))}
          </motion.div>

          {filteredAndSortedRepos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No repositories found matching your search.'
                  : 'No recommendations available. Try updating your preferences.'}
              </p>
            </div>
          )}
        </main>
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
    </div>
  );
};

export default Dashboard;
