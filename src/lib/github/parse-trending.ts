import { load } from 'cheerio';
import type { TrendingRepositorySeed } from '@/lib/snapshots/types';

function extractStarsToday(text: string): number | null {
  const match = text.match(/([\d,]+)\s+stars today/i);
  if (!match) {
    return null;
  }

  return Number(match[1].replace(/,/g, ''));
}

export function parseTrendingRepositories(html: string): TrendingRepositorySeed[] {
  const $ = load(html);
  const repositories: TrendingRepositorySeed[] = [];

  $('article').toArray().forEach((element) => {
    const link = $(element).find('h2 a[href]').first();
    const href = link.attr('href')?.trim();

    if (!href) {
      return;
    }

    const repositoryPath = href.split(/[?#]/, 1)[0].replace(/^\/+/, '').replace(/\/+$/, '');
    const pathParts = repositoryPath.split('/').filter(Boolean);

    if (pathParts.length !== 2) {
      return;
    }

    const owner = pathParts[0];
    const name = pathParts[1];
    const articleText = $(element).text();

    repositories.push({
      rank: repositories.length + 1,
      owner,
      name,
      fullName: `${owner}/${name}`,
      repositoryPath,
      starsToday: extractStarsToday(articleText),
    });
  });

  return repositories;
}
