import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTrendingRepositories } from '@/lib/github/parse-trending';

describe('parseTrendingRepositories', () => {
  it('extracts rank, owner/name/fullName, repositoryPath, and starsToday from the fixture', () => {
    const html = readFileSync(resolve('tests/fixtures/github-trending.html'), 'utf8');

    const result = parseTrendingRepositories(html);

    expect(result[0]).toMatchObject({
      rank: 1,
      owner: 'anthropic',
      name: 'claude-code',
      fullName: 'anthropic/claude-code',
      repositoryPath: 'anthropic/claude-code',
      starsToday: 2340,
    });
  });
});
