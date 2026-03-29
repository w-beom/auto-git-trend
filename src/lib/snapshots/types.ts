export interface TrendingRepositorySeed {
  rank: number;
  owner: string;
  name: string;
  fullName: string;
  repositoryPath: string;
  starsToday: number | null;
}

export interface RepositoryMetadata {
  githubRepoId: number;
  description: string | null;
  primaryLanguage: string | null;
  starsTotal: number | null;
  forksTotal: number | null;
  defaultBranch: string | null;
  avatarUrl: string | null;
  githubUrl: string | null;
}
