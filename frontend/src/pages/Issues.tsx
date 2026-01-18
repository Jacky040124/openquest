import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, AlertCircle, MessageSquare, Calendar, Tag, BarChart3 } from 'lucide-react';
import type { IssueDTO, IssueFilterDTO } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContributionHeatmap from '@/components/dashboard/ContributionHeatmap';
import { useIssues } from '@/hooks/useIssues';
import logo from "@/assets/logo.png";

const Issues = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repoUrl = searchParams.get('repo_url') || '';
  const repoName = searchParams.get('repo_name') || 'Repository';

  // Parse repo info from URL
  const [owner, repo] = repoName.includes('/') 
    ? repoName.split('/') 
    : ['', repoName];

  // Fetch issues with localStorage caching
  const filter: IssueFilterDTO = {
    repo_url: repoUrl,
    tags: ['good first issue'], // Match the count which only counts "good first issue"
    exclude_assigned: true, // Match the count which excludes assigned issues
    limit: 20,
  };
  const { data: issues, isLoading, error } = useIssues(filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={logo} 
                alt="OpenQuest" 
                className="h-8 w-8 cursor-pointer"
                onClick={() => navigate('/dashboard')}
              />
              <div>
                <h1 className="text-xl font-semibold">Issues</h1>
                <p className="text-sm text-muted-foreground">
                  {owner && repo ? `${owner}/${repo}` : repoName}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Issues {issues && `(${issues.length})`}
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Contribution Heatmap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issues">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="card-interactive p-5">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="card-interactive p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <h2 className="text-xl font-semibold mb-2">Failed to load issues</h2>
                <p className="text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : issues && issues.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">
                    {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'} Found
                  </h2>
                </div>
            {issues.map((issue) => {
              const handleCardClick = (e: React.MouseEvent) => {
                // Don't navigate if clicking on the link or the button
                const target = e.target as HTMLElement;
                if (target.closest('a[href]') || target.closest('button')) {
                  return;
                }
                window.open(issue.url, '_blank');
              };

              return (
                <div 
                  key={issue.id} 
                  className="card-interactive p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={handleCardClick}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="block group"
                      >
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                          {issue.title}
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                      </a>
                    
                    {/* Labels */}
                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {issue.labels.map((label) => (
                          <Badge
                            key={label}
                            variant="secondary"
                            className="text-xs"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {issue.language && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span>{issue.language}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{issue.comments_count} comments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(issue.created_at)}</span>
                      </div>
                      {issue.is_assigned && (
                        <Badge variant="outline" className="text-xs">
                          Assigned
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(issue.url, '_blank');
                    }}
                  >
                    View on GitHub
                  </Button>
                </div>
              </div>
              );
            })}
              </div>
            ) : (
              <div className="card-interactive p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">No issues found</h2>
                <p className="text-muted-foreground">
                  This repository doesn't have any matching issues at the moment.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="heatmap">
            <ContributionHeatmap repoUrl={repoUrl} repoName={repoName} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Issues;

