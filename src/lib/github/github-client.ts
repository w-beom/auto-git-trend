const GITHUB_API_VERSION = '2022-11-28';
const GITHUB_DEFAULT_ACCEPT = 'application/vnd.github+json';

export interface GitHubClientOptions {
  accept?: string;
  token?: string;
}

function resolveToken(token?: string): string | undefined {
  return token ?? process.env.GITHUB_TOKEN;
}

function buildHeaders(initHeaders: HeadersInit | undefined, options?: GitHubClientOptions): Headers {
  const headers = new Headers(initHeaders);
  headers.set('Accept', options?.accept ?? headers.get('Accept') ?? GITHUB_DEFAULT_ACCEPT);
  headers.set('X-GitHub-Api-Version', GITHUB_API_VERSION);

  const token = resolveToken(options?.token);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

export async function githubFetch(
  url: string,
  init: RequestInit = {},
  fetchImpl: typeof fetch = fetch,
  options?: GitHubClientOptions,
): Promise<Response> {
  return fetchImpl(url, {
    ...init,
    cache: 'no-store',
    headers: buildHeaders(init.headers, options),
  });
}

export function buildGitHubHeaders(
  initHeaders?: HeadersInit,
  options?: GitHubClientOptions,
): Headers {
  return buildHeaders(initHeaders, options);
}
