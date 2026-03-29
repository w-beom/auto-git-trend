import { describe, expect, it } from 'vitest';
import { fetchReadme } from '@/lib/github/fetch-readme';

describe('fetchReadme', () => {
  it('decodes a base64 GitHub README response', async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          content: Buffer.from('# Hello\n\nWorld').toString('base64'),
          encoding: 'base64',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );

    const result = await fetchReadme('anthropic', 'claude-code', fetchImpl);

    expect(result).toBe('# Hello\n\nWorld');
  });
});
