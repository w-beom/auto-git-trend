# Auto Git Trend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vercel-deployed Next.js site that ingests GitHub Trending once per day, stores dated Supabase snapshots, generates Korean summaries for each repository, and renders the results in a neo-brutalist interface.

**Architecture:** Use a single Next.js App Router app as both the public website and the Vercel Cron target. Keep ingestion, GitHub access, summary generation, and Supabase writes on the server, with immutable per-day snapshot rows feeding read-only public pages.

**Tech Stack:** Next.js App Router, TypeScript, React, Supabase Postgres, Vercel Cron, GitHub REST API, OpenAI-compatible summary adapter, Vitest, Testing Library, Cheerio, Zod

---

## Working Assumptions

- The current directory is not yet a Git repository, so bootstrap includes `git init`.
- The repo currently contains design docs, so scaffold the app in a temporary subdirectory and move the generated files into the root.
- Public pages will read snapshot data on the server using the Supabase service-role key. No browser-side Supabase client is needed for MVP.
- Summary generation will use an OpenAI-compatible provider behind a thin adapter. Start with `OPENAI_API_KEY` and a default model constant.
- The archive page is part of MVP and must ship with the first implementation.

## Planned File Structure

### Root and Tooling

- Create: `.gitignore`
- Create: `.env.example`
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `vercel.json`
- Modify: `README.md`

### App Routes

- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/archive/[date]/page.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/app/api/cron/trending/route.ts`
- Create: `src/app/globals.css`

### UI Components

- Create: `src/components/trending/site-shell.tsx`
- Create: `src/components/trending/snapshot-hero.tsx`
- Create: `src/components/trending/top-three-grid.tsx`
- Create: `src/components/trending/repository-card.tsx`
- Create: `src/components/trending/repository-list.tsx`
- Create: `src/components/trending/empty-state.tsx`

### Server Libraries

- Create: `src/lib/env.ts`
- Create: `src/lib/time.ts`
- Create: `src/lib/github/github-client.ts`
- Create: `src/lib/github/fetch-trending-html.ts`
- Create: `src/lib/github/parse-trending.ts`
- Create: `src/lib/github/fetch-repository.ts`
- Create: `src/lib/github/fetch-readme.ts`
- Create: `src/lib/summaries/summary-client.ts`
- Create: `src/lib/summaries/generate-korean-summary.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/snapshots/types.ts`
- Create: `src/lib/snapshots/serializers.ts`
- Create: `src/lib/snapshots/queries.ts`
- Create: `src/lib/snapshots/ingest-trending-snapshot.ts`

### Database

- Create: `supabase/migrations/20260329133000_initial_schema.sql`

### Tests and Fixtures

- Create: `tests/fixtures/github-trending.html`
- Create: `tests/config/env.test.ts`
- Create: `tests/github/parse-trending.test.ts`
- Create: `tests/github/fetch-readme.test.ts`
- Create: `tests/summaries/generate-korean-summary.test.ts`
- Create: `tests/snapshots/ingest-trending-snapshot.test.ts`
- Create: `tests/app/home-page.test.tsx`
- Create: `tests/app/archive-page.test.tsx`
- Create: `tests/app/cron-route.test.ts`

## Implementation Notes

- Use `npm`, not `pnpm`, so the bootstrap works on a default Windows/Vercel setup.
- Use Next.js App Router route handlers because current docs place route handlers inside `app/**/route.ts`.
- Secure the cron route by comparing the `Authorization` header with `CRON_SECRET`. Vercel sends `Bearer <CRON_SECRET>` automatically when the env var is configured.
- Put the cron schedule in `vercel.json` as `0 0 * * *` so production runs at `00:00 UTC` / `09:00 KST`.
- Use `cheerio` for Trending HTML parsing and `zod` for env validation.
- Use explicit dependency injection in ingestion code so the orchestration can be tested without real GitHub, OpenAI, or Supabase calls.

### Task 1: Bootstrap the repository and base Next.js app

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `eslint.config.mjs`
- Create: `README.md`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Initialize Git and scaffold a temporary App Router project**

Run:

```powershell
git init
npx create-next-app@latest bootstrap-app --yes --skip-install --ts --eslint --app --src-dir --use-npm --no-tailwind --import-alias "@/*"
```

Expected:
- `git init` creates `.git/`
- `bootstrap-app/` contains a runnable Next.js App Router project

- [ ] **Step 2: Move the scaffold into the repo root and preserve existing docs**

Run:

```powershell
Get-ChildItem .\bootstrap-app -Force | Where-Object { $_.Name -ne '.git' } | Move-Item -Destination .
Remove-Item -Recurse -Force .\bootstrap-app
```

Expected:
- The repo root contains the generated Next.js files
- Existing `docs/` remains untouched

- [ ] **Step 3: Replace the default app shell with an MVP placeholder and repo hygiene files**

Update the scaffolded files so they reflect the project instead of the stock template:

```tsx
// src/app/page.tsx
export default function HomePage() {
  return (
    <main>
      <h1>Auto Git Trend</h1>
      <p>Trending snapshots will render here after the data layer lands.</p>
    </main>
  );
}
```

```gitignore
.next
node_modules
.env*
.superpowers/
coverage
```

Also add the test runner wiring now so the first Vitest command will work:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```ts
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Install the runtime and test dependencies the plan needs**

Run:

```powershell
npm install
npm install @supabase/supabase-js cheerio openai zod
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/dom @types/node
```

Expected:
- `package.json` includes runtime deps for Supabase, GitHub parsing, and summary generation
- `package-lock.json` is created or updated

- [ ] **Step 5: Verify the scaffold builds cleanly**

Run:

```powershell
npm run lint
npm run build
```

Expected:
- Lint passes with no errors
- Build finishes successfully and creates `.next/`

- [ ] **Step 6: Commit the clean bootstrap**

Run:

```powershell
git add .
git commit -m "chore: bootstrap next app"
```

### Task 2: Add environment validation and Supabase schema

**Files:**
- Create: `.env.example`
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `supabase/migrations/20260329133000_initial_schema.sql`
- Test: `tests/config/env.test.ts`

- [ ] **Step 1: Write a failing env validation test**

```ts
// tests/config/env.test.ts
import { describe, expect, it } from 'vitest';
import { loadServerEnv } from '@/lib/env';

describe('loadServerEnv', () => {
  it('throws when a required server variable is missing', () => {
    expect(() =>
      loadServerEnv({
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: '',
        GITHUB_TOKEN: 'ghp_test',
        CRON_SECRET: 'secret',
        OPENAI_API_KEY: 'sk-test',
      }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
```

- [ ] **Step 2: Run the env test and confirm it fails because the loader does not exist yet**

Run:

```powershell
npx vitest run tests/config/env.test.ts
```

Expected:
- FAIL with module or symbol errors for `loadServerEnv`

- [ ] **Step 3: Implement env parsing and the Supabase admin client**

```ts
// src/lib/env.ts
import { z } from 'zod';

const schema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GITHUB_TOKEN: z.string().min(1),
  CRON_SECRET: z.string().min(16),
  OPENAI_API_KEY: z.string().min(1),
});

export function loadServerEnv(input: Record<string, string | undefined> = process.env) {
  return schema.parse(input);
}

export const env = loadServerEnv();
```

```ts
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
```

Also create `.env.example` with placeholder values for every required variable.

- [ ] **Step 4: Add the first SQL migration**

```sql
create extension if not exists pgcrypto;

create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  github_repo_id bigint not null unique,
  owner text not null,
  name text not null,
  full_name text not null unique,
  github_url text not null,
  description text,
  primary_language text,
  stars_total integer,
  forks_total integer,
  default_branch text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trending_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  captured_at timestamptz not null,
  status text not null check (status in ('running', 'success', 'failed')),
  item_count integer not null default 0,
  source text not null default 'github-trending',
  created_at timestamptz not null default now()
);

create table public.trending_snapshot_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.trending_snapshots(id) on delete cascade,
  repository_id uuid not null references public.repositories(id) on delete cascade,
  rank integer not null,
  stars_today integer,
  repo_description_snapshot text,
  readme_excerpt text,
  summary_ko text not null,
  created_at timestamptz not null default now(),
  unique (snapshot_id, rank),
  unique (snapshot_id, repository_id)
);
```

- [ ] **Step 5: Re-run the env test and sanity-check the schema files**

Run:

```powershell
npx vitest run tests/config/env.test.ts
```

Expected:
- PASS for env validation test
- Migration file exists with the three tables and uniqueness constraints

- [ ] **Step 6: Commit the configuration and schema layer**

Run:

```powershell
git add .env.example src/lib/env.ts src/lib/supabase/admin.ts supabase/migrations tests/config/env.test.ts
git commit -m "feat: add env validation and database schema"
```

### Task 3: Build and test the GitHub Trending parser and enrichment clients

**Files:**
- Create: `src/lib/github/github-client.ts`
- Create: `src/lib/github/fetch-trending-html.ts`
- Create: `src/lib/github/parse-trending.ts`
- Create: `src/lib/github/fetch-repository.ts`
- Create: `src/lib/github/fetch-readme.ts`
- Create: `src/lib/snapshots/types.ts`
- Create: `tests/fixtures/github-trending.html`
- Test: `tests/github/parse-trending.test.ts`
- Test: `tests/github/fetch-readme.test.ts`

- [ ] **Step 1: Save a real-ish Trending HTML fixture and write the failing parser test**

```ts
// tests/github/parse-trending.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseTrendingRepositories } from '@/lib/github/parse-trending';

describe('parseTrendingRepositories', () => {
  it('extracts rank, full name, and daily star count from the fixture', () => {
    const html = readFileSync(resolve('tests/fixtures/github-trending.html'), 'utf8');
    const result = parseTrendingRepositories(html);

    expect(result[0]).toMatchObject({
      rank: 1,
      owner: 'anthropic',
      name: 'claude-code',
      fullName: 'anthropic/claude-code',
      starsToday: 2340,
    });
  });
});
```

- [ ] **Step 2: Run the parser test to see it fail before the parser exists**

Run:

```powershell
npx vitest run tests/github/parse-trending.test.ts
```

Expected:
- FAIL because `parseTrendingRepositories` is not implemented

- [ ] **Step 3: Implement the parser and shared GitHub types**

```ts
// src/lib/snapshots/types.ts
export interface TrendingRepositorySeed {
  rank: number;
  owner: string;
  name: string;
  fullName: string;
  repositoryPath: string;
  starsToday: number | null;
}
```

```ts
// src/lib/github/parse-trending.ts
import { load } from 'cheerio';
import type { TrendingRepositorySeed } from '@/lib/snapshots/types';

export function parseTrendingRepositories(html: string): TrendingRepositorySeed[] {
  const $ = load(html);

  return $('article.Box-row')
    .map((index, element) => {
      const href = $('h2 a', element).attr('href')?.trim() ?? '';
      const repositoryPath = href.replace(/^\//, '');
      const [owner, name] = repositoryPath.split('/');
      const starsTodayText = $(element).text().match(/([\d,]+)\s+stars today/i)?.[1] ?? null;

      return {
        rank: index + 1,
        owner,
        name,
        fullName: `${owner}/${name}`,
        repositoryPath,
        starsToday: starsTodayText ? Number(starsTodayText.replace(/,/g, '')) : null,
      };
    })
    .get();
}
```

- [ ] **Step 4: Add GitHub fetch helpers and a README client test**

```ts
// tests/github/fetch-readme.test.ts
import { describe, expect, it, vi } from 'vitest';
import { fetchReadme } from '@/lib/github/fetch-readme';

describe('fetchReadme', () => {
  it('returns decoded README content when GitHub responds with base64 content', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: Buffer.from('# Hello\n\nWorld').toString('base64'),
        encoding: 'base64',
      }),
    });

    const result = await fetchReadme('anthropic', 'claude-code', mockFetch as typeof fetch);
    expect(result).toContain('Hello');
  });
});
```

Implement:

```ts
// src/lib/github/fetch-readme.ts
export async function fetchReadme(owner: string, repo: string, fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;
  const payload = await response.json();
  if (payload.encoding !== 'base64' || typeof payload.content !== 'string') return null;
  return Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8');
}
```

- [ ] **Step 5: Run the GitHub utility tests**

Run:

```powershell
npx vitest run tests/github/parse-trending.test.ts tests/github/fetch-readme.test.ts
```

Expected:
- PASS for parser extraction
- PASS for README base64 decoding

- [ ] **Step 6: Commit the GitHub data layer**

Run:

```powershell
git add src/lib/github src/lib/snapshots/types.ts tests/github tests/fixtures
git commit -m "feat: add github trending parser"
```

### Task 4: Build the Korean summary adapter

**Files:**
- Create: `src/lib/summaries/summary-client.ts`
- Create: `src/lib/summaries/generate-korean-summary.ts`
- Test: `tests/summaries/generate-korean-summary.test.ts`

- [ ] **Step 1: Write a failing summary generation test with a mocked provider**

```ts
// tests/summaries/generate-korean-summary.test.ts
import { describe, expect, it, vi } from 'vitest';
import { generateKoreanSummary } from '@/lib/summaries/generate-korean-summary';

describe('generateKoreanSummary', () => {
  it('uses the README excerpt and description to request a Korean explanation', async () => {
    const summarize = vi.fn().mockResolvedValue('이 프로젝트는 코드 작업을 자동화하는 개발 도구입니다.');

    const result = await generateKoreanSummary(
      {
        fullName: 'anthropic/claude-code',
        description: 'Agentic coding tool',
        readme: '# Claude Code\n\nAutomates repo work.',
      },
      { summarize },
    );

    expect(summarize).toHaveBeenCalledWith(expect.stringContaining('Agentic coding tool'));
    expect(result).toContain('개발 도구');
  });
});
```

- [ ] **Step 2: Run the summary test and confirm it fails**

Run:

```powershell
npx vitest run tests/summaries/generate-korean-summary.test.ts
```

Expected:
- FAIL because the summary module does not exist yet

- [ ] **Step 3: Implement the summary adapter boundary**

```ts
// src/lib/summaries/summary-client.ts
export interface SummaryClient {
  summarize(prompt: string): Promise<string>;
}
```

```ts
// src/lib/summaries/generate-korean-summary.ts
import type { SummaryClient } from '@/lib/summaries/summary-client';

export async function generateKoreanSummary(
  input: { fullName: string; description: string | null; readme: string | null },
  client: SummaryClient,
) {
  const readmeExcerpt = input.readme?.slice(0, 4000) ?? '';
  const prompt = [
    '다음 GitHub 저장소를 한국어로 자연스럽게 설명하세요.',
    `저장소: ${input.fullName}`,
    `설명: ${input.description ?? '없음'}`,
    `README 발췌: ${readmeExcerpt || '없음'}`,
    '무엇을 하는 프로젝트인지 먼저 설명하고, 필요하면 대표 사용 맥락을 덧붙이세요.',
  ].join('\n');

  return client.summarize(prompt);
}
```

- [ ] **Step 4: Add the concrete OpenAI-compatible implementation**

Use a small wrapper that keeps provider-specific code out of the ingestion pipeline:

```ts
// src/lib/summaries/summary-client.ts
import OpenAI from 'openai';
import { env } from '@/lib/env';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const DEFAULT_MODEL = 'gpt-5-mini';

export class OpenAISummaryClient implements SummaryClient {
  async summarize(prompt: string) {
    const response = await client.responses.create({
      model: DEFAULT_MODEL,
      input: prompt,
    });

    return response.output_text.trim();
  }
}
```

- [ ] **Step 5: Re-run the summary test**

Run:

```powershell
npx vitest run tests/summaries/generate-korean-summary.test.ts
```

Expected:
- PASS with the mocked summary client

- [ ] **Step 6: Commit the summary layer**

Run:

```powershell
git add src/lib/summaries tests/summaries
git commit -m "feat: add korean summary generator"
```

### Task 5: Build the ingestion orchestration and secure cron route

**Files:**
- Create: `src/lib/snapshots/serializers.ts`
- Create: `src/lib/snapshots/ingest-trending-snapshot.ts`
- Create: `src/lib/time.ts`
- Create: `src/app/api/cron/trending/route.ts`
- Create: `tests/snapshots/ingest-trending-snapshot.test.ts`
- Create: `tests/app/cron-route.test.ts`
- Modify: `src/lib/supabase/admin.ts`

- [ ] **Step 1: Write a failing orchestration test for partial success and rank preservation**

```ts
// tests/snapshots/ingest-trending-snapshot.test.ts
import { describe, expect, it, vi } from 'vitest';
import { ingestTrendingSnapshot } from '@/lib/snapshots/ingest-trending-snapshot';

describe('ingestTrendingSnapshot', () => {
  it('stores ranked items and falls back when README is missing', async () => {
    const result = await ingestTrendingSnapshot({
      targetDate: '2026-03-29',
      fetchTrendingSeeds: async () => [
        { rank: 1, owner: 'anthropic', name: 'claude-code', fullName: 'anthropic/claude-code', repositoryPath: 'anthropic/claude-code', starsToday: 2340 },
      ],
      fetchRepository: async () => ({ githubRepoId: 1, description: 'Agentic coding tool', primaryLanguage: 'TypeScript', starsTotal: 48200, forksTotal: 3800, defaultBranch: 'main', avatarUrl: 'https://example.com/a.png', githubUrl: 'https://github.com/anthropic/claude-code' }),
      fetchReadme: async () => null,
      summarize: async () => '이 프로젝트는 코드 작업을 자동화하는 개발 도구입니다.',
      store: {
        getSuccessfulSnapshotByDate: vi.fn().mockResolvedValue(null),
        createRunningSnapshot: vi.fn().mockResolvedValue({ id: 'snapshot-1' }),
        upsertRepository: vi.fn().mockResolvedValue({ id: 'repo-1' }),
        insertSnapshotItem: vi.fn().mockResolvedValue(undefined),
        markSnapshotSuccess: vi.fn().mockResolvedValue(undefined),
        markSnapshotFailed: vi.fn().mockResolvedValue(undefined),
      },
    });

    expect(result.itemCount).toBe(1);
    expect(result.items[0]?.rank).toBe(1);
    expect(result.items[0]?.summaryKo).toContain('개발 도구');
  });
});
```

- [ ] **Step 2: Run the ingestion test and confirm it fails**

Run:

```powershell
npx vitest run tests/snapshots/ingest-trending-snapshot.test.ts
```

Expected:
- FAIL because the ingestion service does not exist yet

- [ ] **Step 3: Implement the ingestion service with dependency injection**

```ts
// src/lib/snapshots/ingest-trending-snapshot.ts
export async function ingestTrendingSnapshot(deps: IngestDependencies) {
  const existing = await deps.store.getSuccessfulSnapshotByDate(deps.targetDate);
  if (existing) {
    return { snapshotId: existing.id, itemCount: 0, items: [] };
  }

  const snapshot = await deps.store.createRunningSnapshot(deps.targetDate);

  try {
    const seeds = await deps.fetchTrendingSeeds();
    const items = [];

    for (const seed of seeds) {
      const repo = await deps.fetchRepository(seed.owner, seed.name);
      const readme = await deps.fetchReadme(seed.owner, seed.name);
      const summaryKo = await deps.summarize({
        fullName: seed.fullName,
        description: repo.description,
        readme,
      });

      const storedRepo = await deps.store.upsertRepository({ seed, repo });
      await deps.store.insertSnapshotItem({
        snapshotId: snapshot.id,
        repositoryId: storedRepo.id,
        rank: seed.rank,
        starsToday: seed.starsToday,
        repoDescriptionSnapshot: repo.description,
        readmeExcerpt: readme?.slice(0, 1200) ?? null,
        summaryKo,
      });

      items.push({ rank: seed.rank, summaryKo });
    }

    await deps.store.markSnapshotSuccess(snapshot.id, items.length);
    return { snapshotId: snapshot.id, itemCount: items.length, items };
  } catch (error) {
    await deps.store.markSnapshotFailed(snapshot.id);
    throw error;
  }
}
```

- [ ] **Step 4: Add the protected cron route and its test**

```ts
// src/app/api/cron/trending/route.ts
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await runDailyTrendingIngestion();
  return Response.json({ ok: true });
}
```

```ts
// tests/app/cron-route.test.ts
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/cron/trending/route';

describe('GET /api/cron/trending', () => {
  it('rejects requests without the cron secret', async () => {
    process.env.CRON_SECRET = 'super-secret-value';
    const response = await GET(new Request('http://localhost/api/cron/trending') as never);
    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 5: Run the orchestration and route tests**

Run:

```powershell
npx vitest run tests/snapshots/ingest-trending-snapshot.test.ts tests/app/cron-route.test.ts
```

Expected:
- PASS for idempotent orchestration behavior
- PASS for unauthorized cron requests

- [ ] **Step 6: Commit the ingestion pipeline**

Run:

```powershell
git add src/lib/snapshots src/app/api/cron/trending tests/snapshots tests/app/cron-route.test.ts
git commit -m "feat: add trending ingestion pipeline"
```

### Task 6: Add snapshot queries and route-level page rendering

**Files:**
- Create: `src/lib/snapshots/queries.ts`
- Create: `src/app/archive/[date]/page.tsx`
- Create: `src/app/not-found.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/app/home-page.test.tsx`
- Test: `tests/app/archive-page.test.tsx`

- [ ] **Step 1: Write the failing homepage and archive page tests**

```ts
// tests/app/home-page.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/snapshots/queries', () => ({
  getLatestSnapshot: vi.fn().mockResolvedValue({
    snapshotDate: '2026-03-29',
    capturedAtLabel: '2026.03.29 09:30 KST',
    totalCount: 1,
    topThree: [],
    items: [
      {
        rank: 1,
        fullName: 'anthropic/claude-code',
        summaryKo: '이 프로젝트는 코드 작업을 자동화하는 개발 도구입니다.',
        starsToday: 2340,
        primaryLanguage: 'TypeScript',
        githubUrl: 'https://github.com/anthropic/claude-code',
      },
    ],
  }),
}));

import HomePage from '@/app/page';

describe('HomePage', () => {
  it('renders the latest snapshot summary', async () => {
    render(await HomePage());
    expect(screen.getByText(/오늘 뜨는 프로젝트/i)).toBeInTheDocument();
    expect(screen.getByText(/코드 작업을 자동화하는 개발 도구/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the route tests and confirm they fail**

Run:

```powershell
npx vitest run tests/app/home-page.test.tsx tests/app/archive-page.test.tsx
```

Expected:
- FAIL because the pages and query layer are not wired yet

- [ ] **Step 3: Implement the Supabase query functions and route pages**

```ts
// src/lib/snapshots/queries.ts
export async function getLatestSnapshot() {
  const { data } = await supabaseAdmin
    .from('trending_snapshots')
    .select(`
      id,
      snapshot_date,
      captured_at,
      trending_snapshot_items(
        rank,
        stars_today,
        repo_description_snapshot,
        readme_excerpt,
        summary_ko,
        repositories(
          full_name,
          github_url,
          primary_language,
          stars_total
        )
      )
    `)
    .eq('status', 'success')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapSnapshotRecord(data) : null;
}
```

```tsx
// src/app/page.tsx
export default async function HomePage() {
  const snapshot = await getLatestSnapshot();
  if (!snapshot) return <EmptyState title="아직 수집된 스냅샷이 없습니다." />;
  return <SiteShell snapshot={snapshot} />;
}
```

```tsx
// src/app/archive/[date]/page.tsx
export default async function ArchivePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const snapshot = await getSnapshotByDate(date);
  if (!snapshot) notFound();
  return <SiteShell snapshot={snapshot} archiveMode />;
}
```

- [ ] **Step 4: Add `not-found` and empty-state behavior**

Create a dedicated not-found page for unknown archive dates and keep the empty-home state visually consistent:

```tsx
// src/app/not-found.tsx
export default function NotFoundPage() {
  return <EmptyState title="해당 날짜의 스냅샷을 찾을 수 없습니다." />;
}
```

- [ ] **Step 5: Re-run the route tests**

Run:

```powershell
npx vitest run tests/app/home-page.test.tsx tests/app/archive-page.test.tsx
```

Expected:
- PASS for home route rendering
- PASS for archive rendering or not-found fallback

- [ ] **Step 6: Commit the query and routing layer**

Run:

```powershell
git add src/app src/lib/snapshots tests/app/home-page.test.tsx tests/app/archive-page.test.tsx
git commit -m "feat: add snapshot pages"
```

### Task 7: Apply the neo-brutalist UI system and deployment wiring

**Files:**
- Create: `src/components/trending/site-shell.tsx`
- Create: `src/components/trending/snapshot-hero.tsx`
- Create: `src/components/trending/top-three-grid.tsx`
- Create: `src/components/trending/repository-card.tsx`
- Create: `src/components/trending/repository-list.tsx`
- Create: `src/components/trending/empty-state.tsx`
- Modify: `src/app/globals.css`
- Create: `vercel.json`
- Modify: `README.md`

- [ ] **Step 1: Write a failing UI smoke test for the curated list**

```ts
// tests/app/home-page.test.tsx
it('renders rank badges, Korean summary, and GitHub metadata', async () => {
  render(await HomePage());
  expect(screen.getByText('#1')).toBeInTheDocument();
  expect(screen.getByText('TypeScript')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute('href', 'https://github.com/anthropic/claude-code');
});
```

- [ ] **Step 2: Implement the neo-brutalist components and typography**

Use a bold visual system with two expressive fonts and strong card treatment:

```tsx
// src/components/trending/snapshot-hero.tsx
export function SnapshotHero({ snapshot }: { snapshot: SnapshotViewModel }) {
  return (
    <section className="heroBox">
      <p className="heroKicker">Today on GitHub Trending</p>
      <h1 className="heroTitle">오늘 뜨는 프로젝트를 한글로 빠르게 훑어보는 곳</h1>
      <div className="heroMeta">
        <span>{snapshot.snapshotDate}</span>
        <span>{snapshot.capturedAtLabel}</span>
        <span>총 {snapshot.totalCount}개</span>
      </div>
    </section>
  );
}
```

```css
/* src/app/globals.css */
:root {
  --bg: #fff4cc;
  --ink: #111111;
  --accent-yellow: #ffd84d;
  --accent-orange: #ff7a00;
  --accent-blue: #97c2ff;
  --accent-mint: #8ef6d1;
  --paper: #ffffff;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body), sans-serif;
}

.heroBox,
.repoCard {
  border: 4px solid var(--ink);
  box-shadow: 10px 10px 0 var(--ink);
}
```

Use `next/font/google` or local fonts so headings are intentionally loud, not a default system stack.

- [ ] **Step 3: Add deployment wiring and the cron schedule**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/trending",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Update `README.md` with:
- local setup steps
- required env vars
- how to run `npm run dev`
- how to trigger the cron endpoint locally with the `Authorization: Bearer <CRON_SECRET>` header

- [ ] **Step 4: Run the full verification suite**

Run:

```powershell
npx vitest run
npm run lint
npm run build
```

Expected:
- All tests pass
- Lint passes
- Production build succeeds

- [ ] **Step 5: Commit the UI and deployment configuration**

Run:

```powershell
git add src/components src/app/globals.css vercel.json README.md tests/app/home-page.test.tsx
git commit -m "feat: ship neo brutalist trending site"
```

## Local Plan Review

The normal workflow would dispatch a dedicated reviewer subagent here. This session cannot use subagents unless the user explicitly asks for delegation, so review the finished plan locally against the same checklist before implementation:

- no TODO/TBD placeholders
- every spec requirement mapped to at least one task
- each task names exact files
- tests appear before implementation for behavior-heavy work
- no accidental scope creep beyond daily snapshots, archive route, and neo-brutalist UI

## Final Verification Checklist

- `npm run lint`
- `npx vitest run`
- `npm run build`
- confirm `vercel.json` contains `0 0 * * *`
- confirm `.env.example` documents `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN`, `CRON_SECRET`, and `OPENAI_API_KEY`
- confirm archive route works for an existing seeded date and returns not-found for an unknown date
