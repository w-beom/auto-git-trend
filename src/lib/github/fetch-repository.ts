import { githubFetch } from '@/lib/github/github-client';
import type { RepositoryMetadata } from '@/lib/snapshots/types';

type GitHubRepositoryResponse = {
  id?: number;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number | null;
  forks_count?: number | null;
  default_branch?: string | null;
  owner?: {
    avatar_url?: string | null;
  };
  html_url?: string | null;
};

export async function fetchRepository(
  owner: string,
  repo: string,
  fetchImpl: typeof fetch = fetch,
  token?: string,
): Promise<RepositoryMetadata | null> {
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      method: 'GET',
    },
    fetchImpl,
    {
      token,
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as GitHubRepositoryResponse;

  if (typeof payload.id !== 'number') {
    return null;
  }

  return {
    githubRepoId: payload.id,
    description: payload.description ?? null,
    primaryLanguage: payload.language ?? null,
    starsTotal: typeof payload.stargazers_count === 'number' ? payload.stargazers_count : null,
    forksTotal: typeof payload.forks_count === 'number' ? payload.forks_count : null,
    defaultBranch: payload.default_branch ?? null,
    avatarUrl: payload.owner?.avatar_url ?? null,
    githubUrl: payload.html_url ?? null,
  };
}
