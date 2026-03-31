# Date Archive List Design

## Overview

Add an archive date list to the homepage so users can browse every stored trending snapshot by date while keeping the homepage focused on the latest successful snapshot.

The current product already supports direct archive routes at `/archive/[date]`, but users can only reach them if they already know a valid date. This change adds a first-class navigation surface for archive discovery without changing the existing latest-snapshot homepage behavior.

## Product Goal

- Keep `/` anchored to the latest successful snapshot.
- Show every stored successful snapshot date on the homepage.
- Let users move from the homepage to `/archive/[date]` with a single click.
- Preserve the current empty-state behavior when no successful snapshot exists yet.

## Non-Goals

- Adding a separate `/archive` index page.
- Replacing the homepage hero with a date picker or dropdown.
- Introducing filters, pagination, or grouping by month or year.
- Changing how `/archive/[date]` renders a selected snapshot.

## Current Context

The codebase already has:

- `getLatestSnapshotPageData()` for homepage snapshot loading.
- `getSnapshotPageDataByDate()` for archive page loading.
- `SiteShell` as the shared page shell used by both latest and archive views.
- A working `/archive/[date]` route and tests covering valid and invalid dates.

The missing piece is a homepage-level archive navigation component backed by a query that returns all stored snapshot dates.

## Recommended Approach

Add a homepage archive section below the latest snapshot content. The section renders a simple list of links, ordered by newest date first, where each link points to `/archive/[date]`.

This is the smallest change that satisfies the user goal:

- It preserves the current information hierarchy.
- It reuses the existing archive route instead of creating a parallel navigation pattern.
- It scales naturally as more snapshots are stored.

## Data Design

### Snapshot Date Query

Add a new snapshot query that returns all successful snapshot dates:

- source table: `trending_snapshots`
- filter: `status = 'success'`
- sort: `snapshot_date DESC`

The UI should treat dates as unique even if duplicated rows ever appear due to operational issues. Deduplicating by date in application code is acceptable and keeps the rendering contract stable.

### Empty and Partial States

Two states are important:

1. If no latest successful snapshot exists, render the existing homepage empty state and do not show an archive list.
2. If a latest snapshot exists but the date-list query returns no dates, keep rendering the homepage snapshot content and omit the archive section.

The second case should be rare, but the UI should fail safely instead of blocking the homepage.

## UI Design

### Homepage Layout

The homepage keeps its current sequence and gains one additional section:

1. latest snapshot hero
2. Top 3 highlights
3. full ranking
4. archive date list

Placing the archive section after the main content keeps the homepage centered on the freshest snapshot while still making historical navigation easy to discover.

### Archive Date List

The archive section should:

- use the existing editorial visual language
- display a clear section heading such as `아카이브`
- render all available dates in descending order
- use plain links instead of client-side stateful controls

Each item should expose an accessible link name that makes the destination obvious, for example `2026-03-29 아카이브 보기`.

Visible text can stay minimal and date-focused as long as the accessible name remains explicit.

## Component Boundaries

Keep responsibilities narrow:

- `src/lib/snapshots/queries.ts`
  - add a query function dedicated to archive date listing
- new archive list component under `src/components/trending/`
  - render the list section and links only
- `src/components/trending/site-shell.tsx`
  - accept optional archive dates and compose the new section
- `src/app/page.tsx`
  - fetch latest snapshot data and archive dates together for the homepage

This avoids coupling archive navigation logic into the hero or repository list components.

## Error Handling

- Invalid archive dates continue to be handled by the existing `/archive/[date]` logic.
- A failure in the homepage date-list query should surface as a server error, consistent with current snapshot query behavior.
- A successful homepage load with an empty date list should not degrade the main latest-snapshot reading experience.

## Testing Strategy

### Query Tests

Add tests for the new archive-date query to verify:

- only successful snapshots are included
- dates are returned newest first
- duplicate dates are collapsed before rendering

### Homepage Tests

Add homepage coverage to verify:

- the archive section appears when the latest snapshot exists and dates are available
- links point to the correct `/archive/[date]` routes
- the newest date appears first

### Empty-State Safety

Keep or extend homepage tests to verify:

- the existing empty state still renders when no latest snapshot exists
- the archive list does not render in that state

## Success Criteria

- Homepage still shows the latest successful snapshot exactly as before.
- Homepage also shows a list of all stored successful snapshot dates.
- Clicking a date takes the user to the existing archive page for that date.
- No archive navigation is shown when there is no successful snapshot to display.
