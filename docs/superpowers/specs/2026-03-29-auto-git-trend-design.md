# Auto Git Trend Design

## Overview

Build a website that collects the repositories listed on [GitHub Trending](https://github.com/trending) once per day, stores a dated snapshot, generates a Korean explanation for each repository, and shows the results in a curated Korean-first interface.

The first release targets a single daily trending snapshot with history preserved by date. The product emphasis is not raw GitHub metadata. It is fast Korean understanding of what each project is and why it matters.

## Product Goals

- Show the latest daily GitHub Trending list as a Korean-curated homepage.
- Preserve historical daily snapshots so older trending lists can be revisited later.
- Generate Korean summaries from the repository description plus the leading part of the README.
- Make the Korean summary the primary content and GitHub metadata secondary.
- Use a neo-brutalist visual system so the site feels editorial and distinctive rather than like a GitHub clone.

## Non-Goals For MVP

- Language filters such as TypeScript or Python.
- Trending period filters such as weekly or monthly.
- Admin dashboards, manual moderation tools, or custom ranking.
- Real-time on-demand generation at page request time.
- Perfect parity with every possible GitHub edge case outside the Trending page itself.

## Recommended Architecture

The product will use a single-app architecture:

- Frontend: Next.js deployed on Vercel.
- Scheduled ingestion: Vercel Cron calling a protected server endpoint.
- Storage: Supabase Postgres.
- Data source: `https://github.com/trending` HTML, plus GitHub repository metadata and README content.
- Presentation model: precomputed daily snapshot stored in Supabase and rendered by the frontend.

### High-Level Flow

1. Vercel Cron triggers once per day.
2. A Next.js server handler fetches and parses GitHub Trending HTML.
3. For each repository entry, the handler fetches repository metadata and README content.
4. The system generates a Korean explanation using the description and README excerpt.
5. The system upserts repository records and inserts snapshot items into Supabase.
6. The homepage reads the latest successful snapshot and renders a Korean-first curated list.

### Why This Architecture

- It is the fastest path to MVP because app and scheduler live in one deploy target.
- Rendering is stable because the site reads already-built snapshot data instead of recomputing on page load.
- It preserves a clean migration path if ingestion later needs to move to Supabase scheduled functions or another worker system.

## Scheduling Assumption

The ingestion schedule will be configured as a once-daily Vercel Cron. The user is in the `Asia/Seoul` timezone, while Vercel Cron schedules are configured in UTC. The design should therefore store and display both:

- `snapshot_date`: the logical daily snapshot date shown to users.
- `captured_at`: the exact ingestion timestamp.

Initial assumption:

- Run the cron at `00:00 UTC`, which is `09:00 KST`, so users see a fresh curated list during the Korean daytime.
- Store timestamps in UTC in the database and format them as Korea Standard Time in the UI.

## Data Model

Three tables are enough for the MVP.

### `repositories`

Canonical repository records keyed to GitHub repository identity.

Suggested fields:

- `id` UUID primary key
- `github_repo_id` bigint unique
- `owner` text
- `name` text
- `full_name` text unique
- `github_url` text
- `description` text nullable
- `primary_language` text nullable
- `stars_total` integer nullable
- `forks_total` integer nullable
- `default_branch` text nullable
- `avatar_url` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz

### `trending_snapshots`

One row per daily ingestion run.

Suggested fields:

- `id` UUID primary key
- `snapshot_date` date unique
- `captured_at` timestamptz
- `status` text
- `item_count` integer
- `source` text
- `created_at` timestamptz

Suggested `status` values:

- `running`
- `success`
- `failed`

### `trending_snapshot_items`

The displayable ranked list for a specific day.

Suggested fields:

- `id` UUID primary key
- `snapshot_id` UUID references `trending_snapshots(id)`
- `repository_id` UUID references `repositories(id)`
- `rank` integer
- `stars_today` integer nullable
- `repo_description_snapshot` text nullable
- `readme_excerpt` text nullable
- `summary_ko` text
- `created_at` timestamptz

Suggested constraints:

- Unique on `snapshot_id, rank`
- Unique on `snapshot_id, repository_id`

### Design Note

`summary_ko` belongs on `trending_snapshot_items`, not `repositories`, so that the generated summary stays tied to the specific day and input context used when the snapshot was created.

## Ingestion Pipeline

### Step Sequence

1. Check whether a successful snapshot already exists for the target date.
2. If it exists, stop to keep the pipeline idempotent.
3. Create a new `trending_snapshots` row with `running` status.
4. Fetch `https://github.com/trending`.
5. Parse repository entries, rank, and daily star counts from the page.
6. For each repository:
   - fetch GitHub repository metadata
   - fetch README content or README excerpt
   - generate Korean summary text
   - upsert the repository row
   - insert the snapshot item row
7. Mark the snapshot as `success` and store the final item count.
8. If the trending page itself cannot be fetched or parsed, mark the snapshot as `failed`.

### Failure Handling

The pipeline should prefer partial success over all-or-nothing failure.

- If one repository README fetch fails, fall back to description-based summarization.
- If one repository metadata lookup fails, keep the item if enough information was already parsed from Trending.
- Only fail the full snapshot when the Trending list itself cannot be fetched or parsed.

### Idempotency

The system must tolerate duplicated cron invocations.

- `snapshot_date` should be unique.
- If a successful snapshot for that date already exists, the handler should exit safely.
- If a failed snapshot exists for the date, a future rerun can replace or retry it based on implementation policy.

## GitHub Data Retrieval

The product goal is to mirror the repositories shown on the GitHub Trending page as closely as practical. Therefore, the Trending HTML page itself is the source of truth for ranking and inclusion.

Additional GitHub calls are used only to enrich each item:

- repository metadata
- repository description
- README content or README excerpt

The design assumes use of a GitHub token for reliable rate limits and README retrieval.

## Korean Summary Generation

The system should generate a Korean explanation from:

- the repository description, if present
- the leading part of the README

Summary length should be flexible, not hard-capped to one or two sentences. The target is natural Korean that helps the user understand the project quickly before clicking through to GitHub.

Summary guidance:

- prioritize what the project does
- mention likely use case when it is obvious from the README
- keep tone neutral and informative
- avoid marketing phrasing
- avoid direct machine translation that reads awkwardly in Korean

### Provider Assumption

Implementation planning will assume a server-side LLM provider is used for summary generation. The default assumption is an OpenAI-compatible API behind a thin adapter so the provider can be swapped later without rewriting the ingestion pipeline.

## Frontend Information Architecture

### Primary Route

- `/` shows the latest successful snapshot

### MVP Archive Route

- `/archive/[date]` shows a specific historical daily snapshot

### Homepage Structure

1. Hero section with:
   - service identity
   - snapshot date
   - capture time
   - total item count
2. Highlighted Top 3 section
3. Full ranked list

### Card Content Priority

Each repository card should emphasize:

1. repository name
2. Korean summary
3. supporting context from description or README
4. secondary metadata such as primary language, total stars, daily stars, and GitHub link

## Visual Direction

The approved design language is neo-brutalism.

Key principles:

- thick black borders
- offset shadows with visible depth
- strong contrast and bold color blocks
- oversized typography and compressed hierarchy
- editorial, poster-like composition instead of a generic SaaS layout

Visual intent:

- not a GitHub clone
- not a neutral dashboard
- closer to a Korean curated editorial board for open source discovery

## UX Principles

- The Korean explanation is the main reason to visit the site.
- Metadata should support scanning, not compete with the summary.
- Users should understand a repository without leaving the page.
- Historical snapshots should feel like archived issues of a daily digest.

## Testing Strategy

The MVP test scope should focus on the most brittle parts of the system.

### Parsing Tests

- Parse repository rank from a saved Trending HTML fixture
- Parse owner and repository name correctly
- Parse daily star count correctly

### Ingestion Tests

- Snapshot creation path succeeds for a mocked trending page
- Repository enrichment handles missing README gracefully
- Snapshot item inserts preserve rank ordering

### Frontend Tests

- Homepage renders latest successful snapshot
- Empty or failed snapshot state renders safely
- Archive page renders a selected historical date when present

## Security And Operational Notes

- The cron handler should require a secret token to prevent public triggering.
- Supabase service-role credentials must remain server-side only.
- GitHub token should be optional in local development but required in production for stability.

## Required Environment Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_TOKEN`
- `CRON_SECRET`
- `OPENAI_API_KEY`

Additional provider-specific variables may be introduced later if the summary provider changes.

## Open Questions Resolved In This Design

- Scope: daily snapshot only
- Storage: preserve history by date
- Source of truth: GitHub Trending page itself
- Summary input: description plus README excerpt
- UI emphasis: Korean-first curated presentation
- Visual direction: neo-brutalism

## Implementation Direction

Implementation should begin with:

1. scaffold the Next.js app for Vercel deployment
2. add Supabase schema and access layer
3. build the Trending ingestion pipeline
4. build the homepage and archive view
5. add tests around parser and snapshot rendering

This design intentionally keeps the first release small while preserving a clean path toward filters, multiple time ranges, richer archives, and operational tooling in later iterations.
