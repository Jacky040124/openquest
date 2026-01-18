import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  FileCode,
  GitBranch,
  Terminal,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useGitHubStatus, useGitHubAuthorize } from '@/hooks/useGitHubOAuth';
import { api } from '@/lib/api';
import { connectAgentSSE, isTerminalEvent } from '@/lib/sse';
import logo from '@/assets/logo.png';
import type {
  AgentEvent,
  AgentAnalyzeRequest,
  AgentImplementRequest,
  AgentSolutionData,
  AgentStep,
} from '@/types/api';

type AnalysisPhase = 'idle' | 'analyzing' | 'analyzed' | 'implementing' | 'completed' | 'error';

interface LogEntry {
  id: number;
  type: 'status' | 'thinking' | 'tool' | 'error';
  message: string;
  timestamp: Date;
}

const IssueAnalysis = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { githubConnected: localGithubConnected, githubUsername, setGitHubConnected } = useAuthStore();

  // URL params
  const repoUrl = searchParams.get('repo_url') || '';
  const repoName = searchParams.get('repo_name') || '';
  const issueTitle = searchParams.get('title') || '';
  const issueNumber = parseInt(searchParams.get('number') || '0', 10);
  const issueUrl = searchParams.get('url') || '';

  // Parse owner/repo
  const [owner, repo] = repoName.includes('/') ? repoName.split('/') : ['', repoName];

  // State
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const [currentStep, setCurrentStep] = useState<AgentStep>('cloning');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [solution, setSolution] = useState<AgentSolutionData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [implementResult, setImplementResult] = useState<{
    branch: string;
    branch_url: string;
    pr_url: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState<string | null>(null);

  const logIdRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch GitHub connection status from backend (source of truth)
  const { data: githubStatus, isLoading: isLoadingStatus } = useGitHubStatus();
  const githubAuthorize = useGitHubAuthorize();

  // Sync backend status with authStore
  const githubConnected = githubStatus?.connected ?? localGithubConnected;
  useEffect(() => {
    if (githubStatus) {
      setGitHubConnected(githubStatus.connected, githubStatus.username ?? null);
    }
  }, [githubStatus, setGitHubConnected]);

  // Fetch GitHub token
  const { isLoading: isLoadingToken } = useQuery({
    queryKey: ['github-token'],
    queryFn: async () => {
      const response = await api.get<{ github_token: string }>('/auth/me/github/token');
      setGithubToken(response.github_token);
      return response;
    },
    enabled: githubConnected,
    retry: false,
  });

  // Fetch issue body from GitHub API
  const { data: issueDetails, isLoading: isLoadingIssue } = useQuery({
    queryKey: ['issue-details', owner, repo, issueNumber],
    queryFn: async () => {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch issue details');
      }
      return response.json() as Promise<{ body: string | null }>;
    },
    enabled: !!owner && !!repo && issueNumber > 0,
  });

  // Add log entry
  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const id = ++logIdRef.current;
    setLogs((prev) => [...prev, { id, type, message, timestamp: new Date() }]);
  }, []);

  // Scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Calculate progress based on step
  useEffect(() => {
    const stepProgress: Record<AgentStep, number> = {
      cloning: 10,
      analyzing: 40,
      proposing: 70,
      implementing: 85,
      pushing: 95,
      done: 100,
      error: 0,
    };
    setProgress(stepProgress[currentStep] || 0);
  }, [currentStep]);

  // Handle SSE events
  const handleEvent = useCallback(
    (event: AgentEvent) => {
      switch (event.type) {
        case 'status':
          setCurrentStep(event.step);
          addLog('status', event.message);
          break;
        case 'thinking':
          addLog('thinking', event.content);
          break;
        case 'tool':
          if (event.tool_result) {
            addLog('tool', `${event.tool_name}: ${event.tool_result.slice(0, 200)}...`);
          } else {
            addLog('tool', `Calling ${event.tool_name}(${JSON.stringify(event.tool_input)})`);
          }
          break;
        case 'solution':
          setSolution(event.data);
          setSessionId(event.session_id);
          setPhase('analyzed');
          addLog('status', 'Analysis complete!');
          break;
        case 'result':
          setImplementResult({
            branch: event.branch,
            branch_url: event.branch_url,
            pr_url: event.pr_url,
          });
          setPhase('completed');
          addLog('status', 'Implementation complete!');
          break;
        case 'error':
          setError(event.message);
          setPhase('error');
          addLog('error', event.message);
          break;
        case 'done':
          // Terminal event
          break;
      }

      if (isTerminalEvent(event)) {
        cleanupRef.current = null;
      }
    },
    [addLog]
  );

  // Start analysis
  const startAnalysis = useCallback(() => {
    if (!repoUrl || !issueTitle || !issueNumber) {
      toast({
        title: 'Missing Information',
        description: 'Issue information is incomplete',
        variant: 'destructive',
      });
      return;
    }

    setPhase('analyzing');
    setLogs([]);
    setError(null);
    setSolution(null);
    setSessionId(null);

    const request: AgentAnalyzeRequest = {
      repo_url: repoUrl,
      issue_title: issueTitle,
      issue_body: issueDetails?.body || 'No description provided.',
      issue_number: issueNumber,
    };

    addLog('status', `Starting analysis for issue #${issueNumber}...`);

    const cleanup = connectAgentSSE(
      '/agent/analyze',
      request,
      handleEvent,
      (err) => {
        setError(err.message);
        setPhase('error');
        addLog('error', err.message);
      }
    );

    cleanupRef.current = cleanup;
  }, [repoUrl, issueTitle, issueNumber, issueDetails, handleEvent, addLog, toast]);

  // Start implementation
  const startImplementation = useCallback(() => {
    if (!sessionId || !githubToken) {
      toast({
        title: 'Cannot Implement',
        description: 'Missing session or GitHub token',
        variant: 'destructive',
      });
      return;
    }

    setPhase('implementing');
    addLog('status', 'Starting implementation...');

    const branchName = `fix/issue-${issueNumber}`;

    const request: AgentImplementRequest = {
      session_id: sessionId,
      branch_name: branchName,
      github_token: githubToken,
      commit_message: solution?.commit_message,
    };

    const cleanup = connectAgentSSE(
      '/agent/implement',
      request,
      handleEvent,
      (err) => {
        setError(err.message);
        setPhase('error');
        addLog('error', err.message);
      }
    );

    cleanupRef.current = cleanup;
  }, [sessionId, githubToken, issueNumber, solution, handleEvent, addLog, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Copy commands to clipboard
  const copyCommands = useCallback(() => {
    if (!implementResult || !githubUsername || !repo) return;

    const commands = `# Clone your fork
git clone https://github.com/${githubUsername}/${repo}.git
cd ${repo}

# Checkout the branch
git checkout ${implementResult.branch}

# View analysis
cat ANALYSIS.md`;

    navigator.clipboard.writeText(commands);
    toast({
      title: 'Copied!',
      description: 'Commands copied to clipboard',
    });
  }, [implementResult, githubUsername, repo, toast]);

  // Check GitHub connection
  if (!githubConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              GitHub Connection Required
            </CardTitle>
            <CardDescription>
              You need to connect your GitHub account to use the Agent analysis feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button
              onClick={() => githubAuthorize.mutate()}
              disabled={githubAuthorize.isPending}
            >
              {githubAuthorize.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect GitHub'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = isLoadingStatus || isLoadingToken || isLoadingIssue;

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
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  Issue #{issueNumber}
                  <Badge variant="outline">{owner}/{repo}</Badge>
                </h1>
                <p className="text-sm text-muted-foreground truncate max-w-xl">{issueTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href={issueUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on GitHub
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate(`/issues?repo_url=${encodeURIComponent(repoUrl)}&repo_name=${encodeURIComponent(repoName)}`)
                }
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Issues
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Phase: Idle - Start Analysis */}
        {phase === 'idle' && (
          <Card>
            <CardHeader>
              <CardTitle>Agent Analysis</CardTitle>
              <CardDescription>
                The AI agent will analyze this issue, explore the codebase, and propose a solution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">What will happen:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Clone the repository into a secure sandbox</li>
                    <li>Explore the codebase structure</li>
                    <li>Search for relevant code related to the issue</li>
                    <li>Analyze the root cause</li>
                    <li>Propose a solution with detailed documentation</li>
                  </ol>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={startAnalysis}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase: Analyzing or Implementing */}
        {(phase === 'analyzing' || phase === 'implementing') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {phase === 'analyzing' ? 'Analyzing Issue...' : 'Implementing Solution...'}
              </CardTitle>
              <CardDescription>
                {phase === 'analyzing'
                  ? 'The agent is exploring the codebase and analyzing the issue.'
                  : 'The agent is creating a branch and pushing changes to your fork.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>

              <div className="space-y-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Agent Log
                </h3>
                <ScrollArea className="h-64 w-full rounded-md border p-4 bg-muted/50">
                  <div className="space-y-2 font-mono text-sm">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`flex gap-2 ${
                          log.type === 'error' ? 'text-destructive' : ''
                        }`}
                      >
                        <span className="text-muted-foreground text-xs">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span
                          className={`text-xs px-1 rounded ${
                            log.type === 'status'
                              ? 'bg-blue-500/20 text-blue-500'
                              : log.type === 'thinking'
                              ? 'bg-purple-500/20 text-purple-500'
                              : log.type === 'tool'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {log.type}
                        </span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase: Analyzed - Show Results */}
        {phase === 'analyzed' && solution && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Analysis Complete
                </CardTitle>
                <CardDescription>
                  Review the analysis below and click "Implement" to create a branch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="font-medium mb-2">Summary</h3>
                  <p className="text-muted-foreground">{solution.summary}</p>
                </div>

                <Separator />

                {/* Root Cause */}
                <div>
                  <h3 className="font-medium mb-2">Root Cause Analysis</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {solution.root_cause_analysis}
                  </p>
                </div>

                <Separator />

                {/* Affected Files */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Affected Files
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {solution.affected_files.map((file) => (
                      <Badge key={file} variant="secondary">
                        {file}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Suggested Fix */}
                <div>
                  <h3 className="font-medium mb-2">Suggested Fix</h3>
                  <p className="text-muted-foreground">{solution.suggested_fix}</p>
                </div>

                {/* Key Insights */}
                {solution.key_insights.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2">Key Insights</h3>
                      <div className="space-y-4">
                        {solution.key_insights.map((insight, idx) => (
                          <div key={idx} className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{insight.file}</Badge>
                              {insight.line_range && (
                                <span className="text-xs text-muted-foreground">
                                  Lines {insight.line_range}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {insight.explanation}
                            </p>
                            {insight.code_snippet && (
                              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                                {insight.code_snippet}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/issues?repo_url=${encodeURIComponent(repoUrl)}&repo_name=${encodeURIComponent(repoName)}`)}
              >
                Cancel
              </Button>
              <Button size="lg" className="flex-1" onClick={startImplementation}>
                <GitBranch className="w-4 h-4 mr-2" />
                Implement Solution
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Completed */}
        {phase === 'completed' && implementResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Implementation Complete!
              </CardTitle>
              <CardDescription>
                A branch has been created and pushed to your fork. Follow the steps below to continue locally.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Branch Info */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Branch Created</span>
                  <Badge variant="secondary">{implementResult.branch}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={implementResult.branch_url} target="_blank" rel="noopener noreferrer">
                      <GitBranch className="w-4 h-4 mr-2" />
                      View Branch
                    </a>
                  </Button>
                  <Button size="sm" asChild>
                    <a href={implementResult.pr_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Create Pull Request
                    </a>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Local Commands */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Work Locally
                  </h3>
                  <Button variant="ghost" size="sm" onClick={copyCommands}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Commands
                  </Button>
                </div>
                <div className="bg-zinc-950 text-zinc-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`# Clone your fork
git clone https://github.com/${githubUsername}/${repo}.git
cd ${repo}

# Checkout the branch
git checkout ${implementResult.branch}

# View analysis
cat ANALYSIS.md`}</pre>
                </div>
              </div>

              <Separator />

              {/* Next Steps */}
              <div>
                <h3 className="font-medium mb-2">Next Steps</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Clone the repository and checkout the branch</li>
                  <li>Review the ANALYSIS.md file for detailed instructions</li>
                  <li>Make any necessary code changes</li>
                  <li>Commit and push your changes</li>
                  <li>Create a Pull Request to the original repository</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase: Error */}
        {phase === 'error' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Analysis Failed
              </CardTitle>
              <CardDescription>An error occurred during the analysis process.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {error || 'Unknown error occurred'}
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/issues?repo_url=${encodeURIComponent(repoUrl)}&repo_name=${encodeURIComponent(repoName)}`)}
                >
                  Back to Issues
                </Button>
                <Button onClick={() => setPhase('idle')}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IssueAnalysis;
