import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Search, Filter, RefreshCw, Code2, Layers, Target, Folder, Edit2 } from 'lucide-react';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import RepoCard from '@/components/dashboard/RepoCard';
import EditPreferencesDialog from '@/components/dashboard/EditPreferencesDialog';
import SignOutDialog from '@/components/dashboard/SignOutDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import logo from "@/assets/logo.png";

// Mock recommended repos based on user preferences
const mockRepos = [
  {
    id: 1,
    name: 'react',
    owner: 'facebook',
    description: 'The library for web and native user interfaces.',
    stars: 220000,
    forks: 45000,
    language: 'JavaScript',
    topics: ['javascript', 'frontend', 'ui', 'library'],
    issueCount: 892,
    matchScore: 95,
    goodFirstIssues: 24,
  },
  {
    id: 2,
    name: 'vscode',
    owner: 'microsoft',
    description: 'Visual Studio Code - Open Source IDE',
    stars: 156000,
    forks: 27000,
    language: 'TypeScript',
    topics: ['typescript', 'editor', 'ide', 'developer-tools'],
    issueCount: 5432,
    matchScore: 88,
    goodFirstIssues: 156,
  },
  {
    id: 3,
    name: 'next.js',
    owner: 'vercel',
    description: 'The React Framework for the Web',
    stars: 118000,
    forks: 25000,
    language: 'TypeScript',
    topics: ['react', 'nextjs', 'framework', 'ssr'],
    issueCount: 2341,
    matchScore: 92,
    goodFirstIssues: 45,
  },
  {
    id: 4,
    name: 'tailwindcss',
    owner: 'tailwindlabs',
    description: 'A utility-first CSS framework for rapid UI development.',
    stars: 78000,
    forks: 3900,
    language: 'CSS',
    topics: ['css', 'framework', 'utility-first', 'styling'],
    issueCount: 234,
    matchScore: 85,
    goodFirstIssues: 12,
  },
  {
    id: 5,
    name: 'supabase',
    owner: 'supabase',
    description: 'The open source Firebase alternative.',
    stars: 64000,
    forks: 5800,
    language: 'TypeScript',
    topics: ['database', 'backend', 'postgres', 'auth'],
    issueCount: 678,
    matchScore: 79,
    goodFirstIssues: 89,
  },
  {
    id: 6,
    name: 'prisma',
    owner: 'prisma',
    description: 'Next-generation ORM for Node.js & TypeScript',
    stars: 37000,
    forks: 1400,
    language: 'TypeScript',
    topics: ['orm', 'database', 'typescript', 'nodejs'],
    issueCount: 456,
    matchScore: 76,
    goodFirstIssues: 34,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { preferences, resetPreferences } = usePreferencesStore();
  const { isLoggedIn, logout, user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showEditPreferences, setShowEditPreferences] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const filteredRepos = mockRepos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleLogoClick = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleLogout = () => {
    setShowSignOutDialog(false);
    logout();
    resetPreferences();
    navigate("/");
  };

  const handleSignOutClick = () => {
    setShowSignOutDialog(true);
  };

  const handleEditPreferences = () => {
    setShowProfile(false);
    setShowEditPreferences(true);
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
      <header className="relative z-10 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0">
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
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{user?.username || 'Developer'}</h3>
                      <p className="text-muted-foreground text-sm capitalize">
                        {preferences.experienceLevel || 'New'} contributor
                      </p>
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  {/* Preferences Summary */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {/* Languages */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Code2 className="w-3 h-3" />
                        <span>Languages</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {preferences.languages.length > 0 ? (
                          preferences.languages.slice(0, 4).map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {preferences.languages.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{preferences.languages.length - 4}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Frameworks */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Layers className="w-3 h-3" />
                        <span>Frameworks</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {preferences.frameworks.length > 0 ? (
                          preferences.frameworks.slice(0, 4).map((framework) => (
                            <Badge key={framework} variant="secondary" className="text-xs">
                              {framework}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {preferences.frameworks.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{preferences.frameworks.length - 4}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Issue Types */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Target className="w-3 h-3" />
                        <span>Issue Types</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {preferences.issueTypes.length > 0 ? (
                          preferences.issueTypes.slice(0, 3).map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {preferences.issueTypes.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{preferences.issueTypes.length - 3}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Project Types */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium mb-1.5 text-muted-foreground">
                        <Folder className="w-3 h-3" />
                        <span>Project Types</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {preferences.projectTypes.length > 0 ? (
                          preferences.projectTypes.slice(0, 3).map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None selected</span>
                        )}
                        {preferences.projectTypes.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{preferences.projectTypes.length - 3}</Badge>
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
                      <div className="text-lg font-bold text-primary">6</div>
                      <div className="text-xs text-muted-foreground">Matches</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-accent">360</div>
                      <div className="text-xs text-muted-foreground">Open Issues</div>
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
              Welcome back, <span className="gradient-text">{user?.username || 'Developer'}</span>
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
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </motion.div>

          {/* Repo Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4"
          >
            {filteredRepos.map((repo, index) => (
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

          {filteredRepos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No repositories found matching your search.</p>
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