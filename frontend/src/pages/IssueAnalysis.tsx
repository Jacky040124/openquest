import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useGitHubStatus, useGitHubAuthorize } from '@/hooks/useGitHubOAuth';
import { api } from '@/lib/api';
import { connectAgentSSE, isTerminalEvent } from '@/lib/sse';
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

// Blinking cursor component
const Cursor = ({ className = '' }: { className?: string }) => (
  <span className={`inline-block w-2 h-4 bg-orange-500 animate-blink ${className}`} />
);

// Terminal window component with authentic chrome
const TerminalWindow = ({
  title = 'terminal',
  children,
  className = '',
  variant = 'default'
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'error';
}) => {
  const borderColors = {
    default: 'border-neutral-700',
    success: 'border-green-600',
    error: 'border-red-600',
  };

  const titleColors = {
    default: 'text-neutral-400',
    success: 'text-green-500',
    error: 'text-red-500',
  };

  return (
    <div className={`${borderColors[variant]} border rounded-sm overflow-hidden ${className}`}>
      {/* Terminal title bar */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Traffic light buttons */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
          </div>
          <span className={`font-mono text-xs ml-2 ${titleColors[variant]}`}>
            {title}
          </span>
        </div>
        <div className="font-mono text-xs text-neutral-600">
          bash
        </div>
      </div>
      {/* Terminal content */}
      <div className="bg-black p-4 font-mono text-sm">
        {children}
      </div>
    </div>
  );
};

// Command line component
const CommandLine = ({
  command,
  output,
  isRunning = false,
  showPrompt = true,
  user = 'agent',
  host = 'sandbox'
}: {
  command: string;
  output?: React.ReactNode;
  isRunning?: boolean;
  showPrompt?: boolean;
  user?: string;
  host?: string;
}) => (
  <div className="space-y-1">
    {showPrompt && (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-green-500">{user}@{host}</span>
        <span className="text-neutral-500">:</span>
        <span className="text-blue-400">~</span>
        <span className="text-neutral-500">$</span>
        <span className="text-neutral-200">{command}</span>
        {isRunning && <Cursor />}
      </div>
    )}
    {output && (
      <div className="text-neutral-400 pl-0 whitespace-pre-wrap">
        {output}
      </div>
    )}
  </div>
);

// ASCII spinner frames
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Spinner component
const Spinner = ({ className = '' }: { className?: string }) => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(f => (f + 1) % spinnerFrames.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return <span className={`text-orange-500 ${className}`}>{spinnerFrames[frame]}</span>;
};

// Progress bar component - more terminal style
const TerminalProgress = ({ value, label }: { value: number; label: string }) => {
  const width = 40;
  const filled = Math.floor((value / 100) * width);
  const empty = width - filled;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-500">{label}</span>
        <span className="text-orange-500">{value}%</span>
      </div>
      <div className="text-xs">
        <span className="text-neutral-600">[</span>
        <span className="text-orange-500">{'#'.repeat(filled)}</span>
        <span className="text-neutral-800">{'-'.repeat(empty)}</span>
        <span className="text-neutral-600">]</span>
      </div>
    </div>
  );
};

// Boot sequence text
const BootSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [lines, setLines] = useState<string[]>([]);
  const bootLines = [
    '[    0.000000] OpenQuest Agent v2.1.0',
    '[    0.000012] Initializing secure sandbox...',
    '[    0.000045] Loading AI modules...',
    '[    0.000089] Connecting to GitHub API...',
    '[    0.000123] System ready.',
    '',
  ];

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < bootLines.length) {
        setLines(prev => [...prev, bootLines[i]]);
        i++;
      } else {
        clearInterval(timer);
        setTimeout(onComplete, 300);
      }
    }, 150);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-xs text-neutral-500 space-y-0.5">
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
};

const IssueAnalysis = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showBoot, setShowBoot] = useState(true);

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

  // Fetch GitHub connection status from backend
  const { data: githubStatus, isLoading: isLoadingStatus } = useGitHubStatus();
  const githubAuthorize = useGitHubAuthorize();

  const githubConnected = githubStatus?.connected ?? false;
  const githubUsername = githubStatus?.username ?? null;

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

  // Calculate progress based on step and tool calls
  // During "analyzing" phase, we increment progress based on tool calls
  // Assuming max 5 turns with ~3 tool calls each = ~15 tool events
  const toolCallCountRef = useRef(0);

  useEffect(() => {
    if (currentStep === 'cloning') {
      setProgress(10);
    } else if (currentStep === 'analyzing') {
      // Progress during analysis: 20% to 85% based on tool calls
      // Each tool call adds ~4% (capped at 65% extra, so max 85%)
      const baseProgress = 20;
      const toolProgress = Math.min(toolCallCountRef.current * 4, 65);
      setProgress(baseProgress + toolProgress);
    } else if (currentStep === 'proposing') {
      setProgress(90);
    } else if (currentStep === 'implementing') {
      setProgress(92);
    } else if (currentStep === 'pushing') {
      setProgress(96);
    } else if (currentStep === 'done') {
      setProgress(100);
    } else if (currentStep === 'error') {
      // Keep current progress on error
    }
  }, [currentStep, logs.length]); // Re-run when logs change to update tool progress

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
            // Increment tool call counter for progress tracking
            toolCallCountRef.current++;
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
    toolCallCountRef.current = 0; // Reset tool call counter

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

  // Handle keyboard events for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && phase === 'idle' && !showBoot && !isLoadingStatus && !isLoadingToken && !isLoadingIssue) {
        e.preventDefault();
        startAnalysis();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, showBoot, isLoadingStatus, isLoadingToken, isLoadingIssue, startAnalysis]);

  // Copy commands to clipboard
  const copyCommands = useCallback(() => {
    if (!implementResult || !githubUsername || !repo) return;

    const commands = `git clone https://github.com/${githubUsername}/${repo}.git
cd ${repo}
git checkout ${implementResult.branch}
cat ANALYSIS.md`;

    navigator.clipboard.writeText(commands);
    toast({
      title: 'Copied!',
      description: 'Commands copied to clipboard',
    });
  }, [implementResult, githubUsername, repo, toast]);

  // Loading state
  if (isLoadingStatus) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <Spinner className="text-2xl" />
          <div className="text-neutral-500 text-sm">Initializing...</div>
        </div>
      </div>
    );
  }

  // GitHub connection required
  if (!githubConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono">
        <TerminalWindow title="auth-error" variant="error">
          <div className="space-y-4 max-w-lg">
            <div className="text-red-500">
              Error: GitHub authentication required
            </div>
            <div className="text-neutral-500 text-xs">
              You must connect your GitHub account to use the agent analysis feature.
            </div>
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs text-neutral-500 hover:text-white transition-colors"
              >
                [cancel]
              </button>
              <button
                onClick={() => githubAuthorize.mutate()}
                disabled={githubAuthorize.isPending}
                className="text-xs text-orange-500 hover:text-orange-400 transition-colors"
              >
                {githubAuthorize.isPending ? '[connecting...]' : '[connect github]'}
              </button>
            </div>
          </div>
        </TerminalWindow>
      </div>
    );
  }

  const isLoading = isLoadingStatus || isLoadingToken || isLoadingIssue;

  return (
    <div className="min-h-screen bg-black text-neutral-300 font-mono selection:bg-orange-500/30">
      {/* Scanline effect */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
        }}
      />

      {/* CRT flicker effect - removed to prevent flickering issues */}
      {/* <div className="pointer-events-none fixed inset-0 z-40 opacity-[0.02] animate-flicker bg-white" /> */}

      {/* Main container */}
      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8 space-y-4">

        {/* Header Terminal */}
        <TerminalWindow title={`issue-#${issueNumber}`}>
          <div className="space-y-2">
            <CommandLine
              command={`cat /issues/${issueNumber}/info`}
              output={
                <div className="space-y-1 mt-2">
                  <div><span className="text-neutral-600">repo:</span>    {owner}/{repo}</div>
                  <div><span className="text-neutral-600">issue:</span>   #{issueNumber}</div>
                  <div><span className="text-neutral-600">title:</span>   {issueTitle}</div>
                  <div><span className="text-neutral-600">url:</span>     <a href={issueUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{issueUrl}</a></div>
                </div>
              }
            />
          </div>
        </TerminalWindow>

        {/* Boot sequence on first load */}
        {showBoot && phase === 'idle' && (
          <TerminalWindow title="system">
            <BootSequence onComplete={() => setShowBoot(false)} />
          </TerminalWindow>
        )}

        {/* Phase: Idle */}
        {phase === 'idle' && !showBoot && (
          <TerminalWindow title="agent">
            <div className="space-y-4">
              <CommandLine
                command="openquest analyze --help"
                output={
                  <div className="mt-2 text-xs">
                    <div className="text-neutral-500 mb-2">OpenQuest Agent - AI-powered issue analysis</div>
                    <div className="space-y-1">
                      <div><span className="text-green-500">USAGE:</span> openquest analyze {'<issue>'}</div>
                      <div className="mt-2 text-neutral-500">The agent will:</div>
                      <div className="text-neutral-600 pl-2">1. Clone repository into secure sandbox</div>
                      <div className="text-neutral-600 pl-2">2. Explore codebase structure</div>
                      <div className="text-neutral-600 pl-2">3. Search relevant code</div>
                      <div className="text-neutral-600 pl-2">4. Analyze root cause</div>
                      <div className="text-neutral-600 pl-2">5. Propose solution</div>
                    </div>
                  </div>
                }
              />

              <div className="border-t border-neutral-800 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">agent@sandbox</span>
                  <span className="text-neutral-500">:</span>
                  <span className="text-blue-400">~</span>
                  <span className="text-neutral-500">$</span>
                  <button
                    onClick={startAnalysis}
                    disabled={isLoading}
                    className="text-neutral-200 hover:text-orange-500 transition-colors disabled:opacity-50"
                  >
                    openquest analyze --issue {issueNumber}
                  </button>
                  {isLoading ? <Spinner /> : <Cursor />}
                </div>
                <div className="text-xs text-neutral-600 mt-2 pl-4">
                  Press Enter or click the command to start analysis
                </div>
              </div>
            </div>
          </TerminalWindow>
        )}

        {/* Phase: Analyzing or Implementing */}
        {(phase === 'analyzing' || phase === 'implementing') && (
          <>
            <TerminalWindow title="agent-process">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Spinner />
                  <span className="text-orange-500">
                    {phase === 'analyzing' ? 'Analyzing issue...' : 'Implementing solution...'}
                  </span>
                  <span className="text-neutral-600 text-xs">
                    [{currentStep}]
                  </span>
                </div>

                <TerminalProgress
                  value={progress}
                  label={phase === 'analyzing' ? 'analysis' : 'implementation'}
                />

                <div className="text-xs text-neutral-600">
                  PID: {Math.floor(Math.random() * 9000) + 1000} |
                  MEM: {Math.floor(Math.random() * 500) + 100}MB |
                  CPU: {Math.floor(Math.random() * 80) + 10}%
                </div>
              </div>
            </TerminalWindow>

            {/* Log output */}
            <TerminalWindow title="stdout">
              <div className="h-72 overflow-y-auto scrollbar-thin text-xs space-y-0.5">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex gap-2 ${log.type === 'error' ? 'text-red-500' : ''}`}
                  >
                    <span className="text-neutral-700 shrink-0">
                      [{log.timestamp.toLocaleTimeString('en-US', { hour12: false })}]
                    </span>
                    <span
                      className={`shrink-0 w-10 ${
                        log.type === 'status'
                          ? 'text-blue-400'
                          : log.type === 'thinking'
                          ? 'text-purple-400'
                          : log.type === 'tool'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {log.type.toUpperCase().slice(0, 6)}
                    </span>
                    <span className="text-neutral-400 break-all">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
                {logs.length > 0 && <Cursor className="ml-2" />}
              </div>
            </TerminalWindow>
          </>
        )}

        {/* Phase: Analyzed - Show Results */}
        {phase === 'analyzed' && solution && (
          <>
            <TerminalWindow title="analysis-results" variant="success">
              <div className="space-y-4">
                <div className="text-green-500 flex items-center gap-2">
                  <span>✓</span>
                  <span>Analysis completed successfully</span>
                </div>

                <CommandLine
                  command="cat ./analysis/summary.txt"
                  output={
                    <div className="mt-2 text-neutral-300">
                      {solution.summary}
                    </div>
                  }
                />
              </div>
            </TerminalWindow>

            <TerminalWindow title="root-cause">
              <CommandLine
                command="cat ./analysis/root_cause.md"
                output={
                  <div className="mt-2 text-neutral-400 whitespace-pre-wrap text-xs">
                    {solution.root_cause_analysis}
                  </div>
                }
              />
            </TerminalWindow>

            <TerminalWindow title="affected-files">
              <CommandLine
                command="ls -la ./affected/"
                output={
                  <div className="mt-2 text-xs">
                    <div className="text-neutral-600 mb-1">total {solution.affected_files.length}</div>
                    {solution.affected_files.map((file, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="text-neutral-600">-rw-r--r--</span>
                        <span className="text-neutral-600">1</span>
                        <span className="text-neutral-600">agent</span>
                        <span className="text-neutral-600">agent</span>
                        <span className="text-neutral-600 w-8 text-right">{Math.floor(Math.random() * 9000) + 100}</span>
                        <span className="text-neutral-600">Jan 17</span>
                        <span className="text-blue-400">{file}</span>
                      </div>
                    ))}
                  </div>
                }
              />
            </TerminalWindow>

            <TerminalWindow title="suggested-fix">
              <CommandLine
                command="cat ./analysis/fix.md"
                output={
                  <div className="mt-2 text-neutral-300 text-xs">
                    {solution.suggested_fix}
                  </div>
                }
              />
            </TerminalWindow>

            {solution.key_insights.length > 0 && (
              <TerminalWindow title="insights">
                <CommandLine
                  command="cat ./analysis/insights.json | jq '.[]'"
                  output={
                    <div className="mt-2 space-y-3">
                      {solution.key_insights.map((insight, idx) => (
                        <div key={idx} className="text-xs border-l-2 border-neutral-800 pl-3">
                          <div className="text-blue-400">{insight.file}</div>
                          {insight.line_range && (
                            <div className="text-neutral-600">lines: {insight.line_range}</div>
                          )}
                          <div className="text-neutral-400 mt-1">{insight.explanation}</div>
                          {insight.code_snippet && (
                            <pre className="mt-2 p-2 bg-neutral-950 text-green-400 overflow-x-auto border border-neutral-800">
                              {insight.code_snippet}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  }
                />
              </TerminalWindow>
            )}

            {/* Action prompt */}
            <TerminalWindow title="action">
              <div className="space-y-4">
                <div className="text-neutral-500 text-xs">
                  Analysis complete. Choose an action:
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">agent@sandbox</span>
                    <span className="text-neutral-500">:</span>
                    <span className="text-blue-400">~</span>
                    <span className="text-neutral-500">$</span>
                    <button
                      onClick={startImplementation}
                      className="text-neutral-200 hover:text-orange-500 transition-colors"
                    >
                      openquest implement --branch fix/issue-{issueNumber}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">agent@sandbox</span>
                    <span className="text-neutral-500">:</span>
                    <span className="text-blue-400">~</span>
                    <span className="text-neutral-500">$</span>
                    <button
                      onClick={() => navigate(`/issues?repo_url=${encodeURIComponent(repoUrl)}&repo_name=${encodeURIComponent(repoName)}`)}
                      className="text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      exit
                    </button>
                  </div>
                </div>
              </div>
            </TerminalWindow>
          </>
        )}

        {/* Phase: Completed */}
        {phase === 'completed' && implementResult && (
          <>
            <TerminalWindow title="result" variant="success">
              <div className="space-y-4">
                <div className="text-green-500 flex items-center gap-2">
                  <span>✓</span>
                  <span>Implementation completed successfully</span>
                </div>

                <CommandLine
                  command="git branch -v"
                  output={
                    <div className="mt-2 text-xs">
                      <div className="text-green-400">* {implementResult.branch} {Math.random().toString(36).substring(2, 9)} Implementation for issue #{issueNumber}</div>
                      <div className="text-neutral-600">  main           {Math.random().toString(36).substring(2, 9)} Initial commit</div>
                    </div>
                  }
                />

                <CommandLine
                  command="git remote -v"
                  output={
                    <div className="mt-2 text-xs">
                      <div>origin  <span className="text-blue-400">{implementResult.branch_url.replace(`/tree/${implementResult.branch}`, '')}</span> (fetch)</div>
                      <div>origin  <span className="text-blue-400">{implementResult.branch_url.replace(`/tree/${implementResult.branch}`, '')}</span> (push)</div>
                    </div>
                  }
                />
              </div>
            </TerminalWindow>

            <TerminalWindow title="next-steps">
              <div className="space-y-4 text-xs">
                <div className="text-neutral-500"># Clone and work locally:</div>
                <div className="bg-neutral-950 p-3 border border-neutral-800 space-y-1">
                  <div><span className="text-neutral-500">$</span> git clone https://github.com/{githubUsername}/{repo}.git</div>
                  <div><span className="text-neutral-500">$</span> cd {repo}</div>
                  <div><span className="text-neutral-500">$</span> git checkout {implementResult.branch}</div>
                  <div><span className="text-neutral-500">$</span> cat ANALYSIS.md</div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={copyCommands}
                    className="text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    [copy commands]
                  </button>
                  <a
                    href={implementResult.branch_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    [view branch]
                  </a>
                  <a
                    href={implementResult.pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 transition-colors"
                  >
                    [create pr]
                  </a>
                </div>
              </div>
            </TerminalWindow>
          </>
        )}

        {/* Phase: Error */}
        {phase === 'error' && (
          <TerminalWindow title="error" variant="error">
            <div className="space-y-4">
              <div className="text-red-500">
                Error: Process terminated with exit code 1
              </div>
              <div className="text-xs bg-red-950/50 p-3 border border-red-900 text-red-400">
                {error || 'Unknown error occurred'}
              </div>
              <div className="flex gap-4 pt-2 text-xs">
                <button
                  onClick={() => navigate(`/issues?repo_url=${encodeURIComponent(repoUrl)}&repo_name=${encodeURIComponent(repoName)}`)}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  [back]
                </button>
                <button
                  onClick={() => setPhase('idle')}
                  className="text-orange-500 hover:text-orange-400 transition-colors"
                >
                  [retry]
                </button>
              </div>
            </div>
          </TerminalWindow>
        )}

        {/* Footer */}
        <div className="text-center text-neutral-700 text-xs py-4">
          OpenQuest Agent v2.1.0 | {new Date().toISOString().split('T')[0]} | Session: {Math.random().toString(36).substring(2, 10)}
        </div>
      </div>

      {/* Custom styles */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        @keyframes flicker {
          0% { opacity: 0.02; }
          5% { opacity: 0.03; }
          10% { opacity: 0.02; }
          15% { opacity: 0.04; }
          20% { opacity: 0.02; }
          25% { opacity: 0.03; }
          30% { opacity: 0.02; }
          35% { opacity: 0.01; }
          40% { opacity: 0.02; }
          45% { opacity: 0.03; }
          50% { opacity: 0.02; }
          55% { opacity: 0.04; }
          60% { opacity: 0.02; }
          65% { opacity: 0.03; }
          70% { opacity: 0.02; }
          75% { opacity: 0.01; }
          80% { opacity: 0.02; }
          85% { opacity: 0.03; }
          90% { opacity: 0.02; }
          95% { opacity: 0.04; }
          100% { opacity: 0.02; }
        }
        .animate-flicker {
          animation: flicker 0.15s infinite;
        }

        /* Custom scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #333;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
};

export default IssueAnalysis;
