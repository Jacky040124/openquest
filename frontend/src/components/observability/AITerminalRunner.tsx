import { useEffect, useRef, useState } from 'react';
import type { TerminalRun, TerminalLogLine } from '@/types/observability';
import { Button } from '@/components/ui/button';
import { Copy, X, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AITerminalRunnerProps {
  run: TerminalRun | null;
  onStop: () => void;
  onClear: () => void;
}

const AITerminalRunner = ({
  run,
  onStop,
  onClear,
}: AITerminalRunnerProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (terminalRef.current && run) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [run?.lines.length]);

  const handleCopy = async () => {
    if (!run) return;
    const text = run.lines
      .map(
        (line) =>
          `[${line.ts}] ${line.level}: ${line.message}`
      )
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'STEP':
        return 'text-blue-400';
      case 'WARN':
        return 'text-yellow-400';
      case 'ERROR':
        return 'text-red-400';
      default:
        return 'text-gray-300';
    }
  };

  const getLevelPrefix = (level: string) => {
    switch (level) {
      case 'STEP':
        return '→';
      case 'WARN':
        return '⚠';
      case 'ERROR':
        return '✗';
      default:
        return '•';
    }
  };

  if (!run) {
    return (
      <div className="h-full bg-[#1e1e1e] rounded-lg border border-border flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Select a module and click "Generate Tasks" to start AI analysis
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] rounded-lg border border-border overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-[#252526]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-mono text-muted-foreground">
              AI Runner
            </span>
          </div>
          {run.status === 'running' && (
            <Badge variant="secondary" className="text-xs">
              Running...
            </Badge>
          )}
          {run.status === 'complete' && (
            <Badge variant="default" className="text-xs bg-green-600">
              Complete
            </Badge>
          )}
          {run.status === 'error' && (
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {run.status === 'running' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStop}
              className="h-7 text-xs"
            >
              <Square className="w-3 h-3 mr-1" />
              Stop
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs"
          >
            {copied ? (
              <span className="text-green-400">Copied!</span>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
        style={{ fontFamily: 'Monaco, Menlo, "Courier New", monospace' }}
      >
        {run.lines.length === 0 ? (
          <div className="text-muted-foreground">
            Waiting for logs...
          </div>
        ) : (
          <div className="space-y-1">
            {run.lines.map((line, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-muted-foreground text-xs shrink-0">
                  {new Date(line.ts).toLocaleTimeString()}
                </span>
                <span
                  className={`shrink-0 ${getLevelColor(line.level)}`}
                >
                  {getLevelPrefix(line.level)}
                </span>
                <span className={`flex-1 ${getLevelColor(line.level)}`}>
                  {line.message}
                </span>
              </div>
            ))}
            {run.status === 'running' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="animate-pulse">▋</span>
                <span>Processing...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AITerminalRunner;

