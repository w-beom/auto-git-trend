import { githubFetch } from '@/lib/github/github-client';

export async function fetchTrendingHtml(
  fetchImpl: typeof fetch = fetch,
  token?: string,
): Promise<string | null> {
  const response = await githubFetch(
    'https://github.com/trending',
    {
      method: 'GET',
    },
    fetchImpl,
    {
      accept: 'text/html',
      token,
    },
  );

  if (!response.ok) {
    return null;
  }

  return response.text();
}
