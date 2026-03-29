import { githubFetch } from '@/lib/github/github-client';

type GitHubReadmeResponse = {
  content?: string | null;
  encoding?: string | null;
};

export async function fetchReadme(
  owner: string,
  repo: string,
  fetchImpl: typeof fetch = fetch,
  token?: string,
): Promise<string | null> {
  const response = await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
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

  const payload = (await response.json()) as GitHubReadmeResponse;
  if (payload.encoding !== 'base64' || typeof payload.content !== 'string') {
    return null;
  }

  return Buffer.from(payload.content.replace(/\s+/g, ''), 'base64').toString('utf8');
}
