// ============================================
// Authentication DTOs
// ============================================

export interface RegisterDTO {
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface TokenDTO {
  access_token: string;
  token_type: 'bearer';
  refresh_token?: string;
  expires_in?: number;
}

export interface UserResponseDTO {
  id: string;
  email: string;
  created_at?: string;
}

// ============================================
// User Preference DTOs
// ============================================

// Enum types matching backend
export type SkillCategory =
  | 'programming_language'
  | 'framework'
  | 'tool'
  | 'database'
  | 'cloud'
  | 'devops'
  | 'other';

export type Familiarity = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type SkillName =
  // Programming Languages
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'go'
  | 'rust'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin'
  // Frameworks
  | 'react'
  | 'vue'
  | 'angular'
  | 'nextjs'
  | 'django'
  | 'fastapi'
  | 'spring'
  | 'express'
  | 'flask'
  // Tools
  | 'docker'
  | 'kubernetes'
  | 'git'
  | 'nginx'
  | 'graphql'
  // Databases
  | 'postgres'
  | 'mongodb'
  | 'redis'
  | 'mysql'
  | 'sqlite'
  // Cloud
  | 'aws'
  | 'gcp'
  | 'azure';

export type ProjectInterest =
  | 'webapp'
  | 'mobile'
  | 'desktop'
  | 'cli'
  | 'api'
  | 'library'
  | 'llm'
  | 'ml'
  | 'data'
  | 'devtools'
  | 'game'
  | 'blockchain'
  | 'iot'
  | 'security'
  | 'automation'
  | 'infrastructure';

export type IssueInterest =
  | 'bug_fix'
  | 'feature'
  | 'enhancement'
  | 'optimization'
  | 'refactor'
  | 'testing'
  | 'documentation'
  | 'accessibility'
  | 'security'
  | 'ui_ux'
  | 'dependency'
  | 'ci_cd'
  | 'cleanup';

export interface SkillInputDTO {
  name: SkillName;
  familiarity: Familiarity;
  category?: SkillCategory;
}

export interface SkillDTO {
  name: string;
  category: string;
  familiarity: string;
}

export interface UserPreferenceCreateDTO {
  languages: string[];
  skills: SkillInputDTO[];
  project_interests: ProjectInterest[];
  issue_interests: IssueInterest[];
  github_token?: string;
  github_username?: string;
}

export interface UserPreferenceUpdateDTO {
  languages?: string[];
  skills?: SkillInputDTO[];
  project_interests?: ProjectInterest[];
  issue_interests?: IssueInterest[];
}

export interface UserPreferenceDTO {
  id: string;
  user_id: string;
  languages: string[];
  skills: SkillDTO[];
  project_interests: string[];
  issue_interests: string[];
  github_username?: string;
  github_connected: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Repository DTOs
// ============================================

export interface RepoDTO {
  id: number;
  name: string;
  full_name: string;
  url: string;
  description?: string;
  language: string;
  stars: number;
  open_issues_count: number;
  topics: string[];
  good_first_issue_count: number;
}

export interface RepoRecommendQueryDTO {
  limit?: number;
  min_stars?: number;
  max_stars?: number;
}

// ============================================
// Issue DTOs
// ============================================

export interface IssueDTO {
  id: number;
  title: string;
  url: string;
  labels: string[];
  language?: string;
  created_at: string;
  is_assigned: boolean;
  comments_count: number;
}

export interface IssueFilterDTO {
  repo_url: string;
  tags?: string[];
  languages?: string[];
  exclude_assigned?: boolean;
  limit?: number;
}

// ============================================
// Contribution Analysis DTOs
// ============================================

export interface ContributionAnalysisQueryDTO {
  repo_url: string;
  days_back?: number;
}

export interface HeatmapDataDTO {
  matrix: number[][];
  contributors: string[];
  modules: string[];
  effort_scores: Array<Array<{
    commits: number;
    lines_changed: number;
    effort_score: number;
  }>>;
}

export interface NeglectedModuleDTO {
  module: string;
  days_since_last_activity: number;
  total_contributions: number;
}

export interface ContributorSpecializationDTO {
  module: string;
  effort_share: number;
  commits: number;
  lines_changed: number;
}

export interface ContributionAnalysisDTO {
  heatmap: HeatmapDataDTO;
  neglected_modules: NeglectedModuleDTO[];
  specializations: Record<string, ContributorSpecializationDTO[]>;
  summary: {
    total_contributions: number;
    unique_contributors: number;
    unique_modules: number;
    analysis_period_days: number;
  };
}

// ============================================
// GitHub OAuth DTOs
// ============================================

export interface GitHubAuthorizeResponse {
  authorize_url: string;
  state: string;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubCallbackRequest {
  code: string;
  state: string;
}

export interface GitHubUserResponse {
  id: number;
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface GitHubConnectDTO {
  access_token: string;
  username: string;
}

export interface GitHubStatusDTO {
  connected: boolean;
  username?: string;
}
