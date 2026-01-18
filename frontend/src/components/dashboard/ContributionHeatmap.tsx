import { TrendingDown, Users } from 'lucide-react';
import type { ContributionAnalysisDTO } from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ContributionHeatmapProps {
  repoUrl: string;
  repoName: string;
}

// Mock data for demo - hardcoded as requested (no API call to avoid 401 errors)
const getMockAnalysis = (): ContributionAnalysisDTO => ({
  heatmap: {
    matrix: [
      [45.2, 12.5, 8.3, 38.7, 5.1, 2.4],
      [28.9, 52.1, 15.6, 18.3, 48.5, 9.2],
      [12.3, 8.7, 42.8, 6.5, 11.2, 35.4],
      [5.1, 3.2, 18.9, 2.1, 4.3, 8.7],
    ],
    contributors: ['alice-dev', 'bob-contributor', 'charlie-maintainer', 'diana-newcomer'],
    modules: ['src', 'tests', 'docs', 'api', 'frontend', 'backend'],
    effort_scores: [],
  },
  neglected_modules: [
    { module: 'docs', days_since_last_activity: 45, total_contributions: 5 },
    { module: 'config', days_since_last_activity: 32, total_contributions: 2 },
  ],
  specializations: {
    'alice-dev': [
      { module: 'src', effort_share: 65.5, commits: 42, lines_changed: 1200 },
      { module: 'api', effort_share: 25.3, commits: 18, lines_changed: 450 },
    ],
    'bob-contributor': [
      { module: 'frontend', effort_share: 58.2, commits: 35, lines_changed: 980 },
      { module: 'src', effort_share: 28.7, commits: 20, lines_changed: 520 },
    ],
    'charlie-maintainer': [
      { module: 'tests', effort_share: 45.8, commits: 28, lines_changed: 650 },
      { module: 'docs', effort_share: 32.1, commits: 15, lines_changed: 420 },
    ],
    'diana-newcomer': [
      { module: 'docs', effort_share: 72.3, commits: 15, lines_changed: 280 },
    ],
  },
  summary: {
    total_contributions: 250,
    unique_contributors: 4,
    unique_modules: 6,
    analysis_period_days: 90,
  },
});

const ContributionHeatmap = ({ repoUrl, repoName }: ContributionHeatmapProps) => {
  // Use mock data directly - no API call to prevent 401 errors
  // This is hardcoded for demo purposes as requested
  const analysis = getMockAnalysis();
  const { heatmap, neglected_modules, specializations, summary } = analysis;

  // Normalize matrix values for visualization (0-100 scale)
  const normalizeMatrix = (matrix: number[][]): number[][] => {
    const flat = matrix.flat();
    const max = Math.max(...flat, 1);
    return matrix.map(row => row.map(val => (val / max) * 100));
  };

  const normalizedMatrix = normalizeMatrix(heatmap.matrix);

  // Get color intensity based on value
  const getColorIntensity = (value: number): string => {
    if (value === 0) return 'bg-muted';
    if (value < 20) return 'bg-blue-500/20';
    if (value < 40) return 'bg-blue-500/40';
    if (value < 60) return 'bg-blue-500/60';
    if (value < 80) return 'bg-blue-500/80';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Contribution Analysis</CardTitle>
          <CardDescription>
            Repository observability insights for {repoName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Contributors</p>
              <p className="text-2xl font-bold">{summary.unique_contributors}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modules</p>
              <p className="text-2xl font-bold">{summary.unique_modules}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Analysis Period</p>
              <p className="text-2xl font-bold">{summary.analysis_period_days} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Effort Heatmap</CardTitle>
          <CardDescription>
            Rows = Contributors, Columns = Modules. Cell intensity = weighted effort score
            (commits × log(lines_changed)). Darker cells indicate more concentrated effort.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Header row with module names */}
              <div className="flex mb-2">
                <div className="w-32 flex-shrink-0 font-medium text-sm text-muted-foreground">
                  Contributor
                </div>
                <div className="flex gap-1">
                  {heatmap.modules.map((module) => (
                    <div
                      key={module}
                      className="w-20 text-xs text-center font-medium text-muted-foreground truncate"
                      title={module}
                    >
                      {module}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap rows */}
              <div className="space-y-1">
                {heatmap.contributors.map((contributor, rowIdx) => (
                  <div key={contributor} className="flex items-center gap-1">
                    <div className="w-32 flex-shrink-0 text-sm truncate" title={contributor}>
                      {contributor}
                    </div>
                    <div className="flex gap-1">
                      {normalizedMatrix[rowIdx].map((value, colIdx) => (
                        <div
                          key={`${rowIdx}-${colIdx}`}
                          className={`w-20 h-8 rounded border border-border ${getColorIntensity(value)}`}
                          title={`${contributor} → ${heatmap.modules[colIdx]}: ${value.toFixed(1)}% effort`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Effort intensity:</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <span>None</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500/20 rounded" />
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500/60 rounded" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                  <span>High</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Neglected Modules */}
      {neglected_modules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-500" />
              Neglected Modules
            </CardTitle>
            <CardDescription>
              Modules with no activity in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {neglected_modules.map((module) => (
                <div
                  key={module.module}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{module.module}</p>
                    <p className="text-sm text-muted-foreground">
                      {module.total_contributions} total contributions
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    {module.days_since_last_activity} days inactive
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contributor Specializations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Contributor Specializations
          </CardTitle>
          <CardDescription>
            Top modules each contributor focuses on (by relative effort share)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(specializations).map(([contributor, modules]) => (
              <div key={contributor} className="border border-border rounded-lg p-4">
                <p className="font-medium mb-3">{contributor}</p>
                <div className="space-y-2">
                  {modules.map((spec, idx) => (
                    <div key={spec.module} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{idx + 1}</Badge>
                        <span className="text-sm">{spec.module}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{spec.effort_share.toFixed(1)}% effort</span>
                        <span>{spec.commits} commits</span>
                        <span>{spec.lines_changed} lines</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContributionHeatmap;

