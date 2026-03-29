import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTrendingRepositories } from '@/lib/github/parse-trending';

describe('parseTrendingRepositories', () => {
  it('extracts canonical repository paths and ignores noisy links in the fixture', () => {
    const html = readFileSync(resolve('tests/fixtures/github-trending.html'), 'utf8');

    const result = parseTrendingRepositories(html);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      rank: 1,
      owner: 'anthropic',
      name: 'claude-code',
      fullName: 'anthropic/claude-code',
      repositoryPath: 'anthropic/claude-code',
      starsToday: 2340,
    });
    expect(result[1]).toMatchObject({
      rank: 2,
      owner: 'vercel',
      name: 'next.js',
      fullName: 'vercel/next.js',
      repositoryPath: 'vercel/next.js',
      starsToday: 521,
    });
    expect(result.map((entry) => entry.fullName)).not.toContain('vercel/next.js/issues');
  });
});
