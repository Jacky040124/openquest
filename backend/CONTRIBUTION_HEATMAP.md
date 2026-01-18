# Contribution Heatmap Feature

## Overview

This feature provides repository observability insights by analyzing GitHub contribution patterns. It visualizes where developer effort is concentrated, identifies neglected modules, and shows contributor specializations.

## Architecture

### Data Flow

1. **Data Collection** (`contribution_service.py`)
   - Fetches contribution data (currently uses mock data for demo)
   - Each contribution record contains:
     - `author`: Contributor name
     - `file_path`: File path in repository
     - `lines_added`: Lines added in commit
     - `lines_deleted`: Lines deleted in commit
     - `commit_count`: Number of commits
     - `last_modified_timestamp`: When last modified

2. **Data Processing**
   - **Module Extraction**: Extracts top-level directories from file paths
   - **Aggregation**: Groups contributions by contributor and module
   - **Effort Scoring**: Calculates weighted effort score = `commits × log(lines_changed + 1)`
     - Uses logarithm to prevent large files from dominating
     - Balances commit frequency with code volume

3. **Analysis Generation**
   - **Heatmap Matrix**: Contributors (rows) × Modules (columns)
   - **Neglected Modules**: Modules with no activity in last 30 days
   - **Specializations**: Top 3 modules per contributor by relative effort share

### API Endpoint

**POST** `/api/v1/contributions/analyze`

**Request:**
```json
{
  "repo_url": "https://github.com/owner/repo",
  "days_back": 90
}
```

**Response:**
```json
{
  "heatmap": {
    "matrix": [[...], [...]],
    "contributors": ["contributor1", "contributor2"],
    "modules": ["src", "tests", "docs"],
    "effort_scores": [[...], [...]]
  },
  "neglected_modules": [
    {
      "module": "docs",
      "days_since_last_activity": 45,
      "total_contributions": 5
    }
  ],
  "specializations": {
    "contributor1": [
      {
        "module": "src",
        "effort_share": 65.5,
        "commits": 42,
        "lines_changed": 1200
      }
    ]
  },
  "summary": {
    "total_contributions": 150,
    "unique_contributors": 5,
    "unique_modules": 8,
    "analysis_period_days": 90
  }
}
```

## Data Transformation Steps

1. **Parse file paths** → Extract top-level module/directory
2. **Group by module and contributor** → Aggregate commits and lines changed
3. **Calculate effort scores** → `commits × log(lines_changed + 1)`
4. **Normalize matrix** → Scale to 0-100 for visualization
5. **Identify neglected modules** → Filter by last activity timestamp
6. **Calculate specializations** → Sort by relative effort share per contributor

## Frontend Visualization

The heatmap is displayed in the Issues page under a "Contribution Heatmap" tab:

- **Heatmap Matrix**: Color-coded cells showing effort intensity
- **Neglected Modules**: List of modules needing attention
- **Specializations**: Breakdown of each contributor's focus areas

## Production Integration

To use real GitHub data instead of mock data:

1. Replace `_generate_mock_contributions()` with actual GitHub API calls:
   - `GET /repos/{owner}/{repo}/commits`
   - `GET /repos/{owner}/{repo}/stats/contributors`
   - `GET /repos/{owner}/{repo}/pulls` (for PR contributions)

2. Parse commit diffs to extract file-level changes
3. Aggregate by author and file path
4. Cache results to reduce API rate limit usage

## Key Design Decisions

- **Logarithmic scaling**: Prevents large refactors from skewing results
- **Top-level modules**: Focuses on architectural patterns, not individual files
- **Relative effort share**: Shows specialization patterns, not raw counts
- **30-day threshold**: Configurable for neglected module detection

