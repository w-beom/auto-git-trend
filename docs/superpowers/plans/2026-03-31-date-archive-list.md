# Date Archive List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a homepage archive date list that shows every stored successful snapshot date and links each date to the existing `/archive/[date]` route without changing the homepage's latest-snapshot focus.

**Architecture:** Keep the latest snapshot query and archive page query intact, then add a dedicated archive-date query returning descending unique dates from `trending_snapshots`. Render those dates through a new homepage-only section component, and wire the homepage to fetch both the latest snapshot and the archive dates while preserving the current empty-state path.

**Tech Stack:** Next.js App Router, React 19, Next Link, Supabase JS, global CSS, Vitest, Testing Library

---

## File Map

- Modify: `src/lib/snapshots/queries.ts`
  - add `getSnapshotArchiveDates()` and any small row types needed for the new query
- Create: `src/components/trending/archive-date-list.tsx`
  - render the archive section and date links only
- Modify: `src/components/trending/site-shell.tsx`
  - accept optional archive dates and render the archive section only on the latest homepage
- Modify: `src/app/page.tsx`
  - fetch archive dates alongside the latest snapshot and pass them into `SiteShell`
- Modify: `src/app/globals.css`
  - style the archive section and date links in the existing editorial system
- Modify: `tests/snapshots/queries.test.ts`
  - lock the new query contract and no-env behavior
- Create: `tests/components/trending/archive-date-list.test.tsx`
  - verify the section heading, link text, accessible names, and empty rendering
- Create: `tests/styles/archive-date-list-css.test.ts`
  - verify the new archive section styles exist in `globals.css`
- Modify: `tests/app/home-page.test.tsx`
  - verify homepage archive rendering, ordering, and omission when dates are empty
- Modify: `tests/app/home-page-smoke.test.tsx`
  - verify the empty state still renders alone when there is no latest snapshot

### Task 1: Add the archive date query with tests first

**Files:**
- Modify: `tests/snapshots/queries.test.ts`
- Modify: `src/lib/snapshots/queries.ts`

- [ ] **Step 1: Write the failing query tests**

Add a list-query helper and two new tests to `tests/snapshots/queries.test.ts` so the contract is locked before implementation:

```ts
interface ListQueryInvocation {
  columns: string;
  filters: Array<[string, unknown]>;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
}

function createSupabaseListClientDouble(
  listHandler: (input: ListQueryInvocation) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>,
) {
  return {
    from() {
      return {
        select(columns: string) {
          const filters: Array<[string, unknown]> = [];
          let orderBy: ListQueryInvocation["orderBy"];

          const query = {
            eq(field: string, value: unknown) {
              filters.push([field, value]);
              return query;
            },
            order(column: string, options: { ascending?: boolean }) {
              orderBy = {
                column,
                ascending: options.ascending,
              };
              return query;
            },
            then<TResult1 = unknown, TResult2 = never>(
              onfulfilled?: ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
              onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
            ) {
              return listHandler({
                columns,
                filters,
                orderBy,
              }).then(onfulfilled, onrejected);
            },
          };

          return query;
        },
      };
    },
  };
}

it("returns successful snapshot dates newest first without duplicates", async () => {
  createClient.mockReturnValue(
    createSupabaseListClientDouble(async ({ columns, filters, orderBy }) => {
      expect(columns).toBe("snapshot_date");
      expect(filters).toEqual([["status", "success"]]);
      expect(orderBy).toEqual({
        column: "snapshot_date",
        ascending: false,
      });

      return {
        data: [
          { snapshot_date: "2026-03-29" },
          { snapshot_date: "2026-03-28" },
          { snapshot_date: "2026-03-28" },
          { snapshot_date: "2026-03-27" },
        ],
        error: null,
      };
    }),
  );
  process.env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  } as NodeJS.ProcessEnv;

  const { getSnapshotArchiveDates } = await import("@/lib/snapshots/queries");

  await expect(getSnapshotArchiveDates()).resolves.toEqual([
    "2026-03-29",
    "2026-03-28",
    "2026-03-27",
  ]);
});

it("returns an empty archive date list when Supabase env is absent", async () => {
  process.env = {} as NodeJS.ProcessEnv;

  const { getSnapshotArchiveDates } = await import("@/lib/snapshots/queries");

  await expect(getSnapshotArchiveDates()).resolves.toEqual([]);
  expect(createClient).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the query test file to verify RED**

Run: `npm test -- tests/snapshots/queries.test.ts`
Expected: FAIL because `getSnapshotArchiveDates` does not exist yet.

- [ ] **Step 3: Write the minimal query implementation**

Update `src/lib/snapshots/queries.ts` with a minimal archive-date row type and query function:

```ts
interface SnapshotDateRow {
  snapshot_date: string;
}

export async function getSnapshotArchiveDates(): Promise<string[]> {
  const client = createSnapshotQueryClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("trending_snapshots")
    .select("snapshot_date")
    .eq("status", "success")
    .order("snapshot_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load snapshot archive dates: ${error.message}`);
  }

  return Array.from(
    new Set(
      ((data ?? []) as SnapshotDateRow[]).map((row) => row.snapshot_date),
    ),
  );
}
```

- [ ] **Step 4: Run the query test file to verify GREEN**

Run: `npm test -- tests/snapshots/queries.test.ts`
Expected: PASS with the existing snapshot tests plus the new archive-date tests.

- [ ] **Step 5: Commit the query slice**

```bash
git add tests/snapshots/queries.test.ts src/lib/snapshots/queries.ts
git commit -m "feat: add snapshot archive date query"
```

### Task 2: Build the archive date section component and styles

**Files:**
- Create: `tests/components/trending/archive-date-list.test.tsx`
- Create: `tests/styles/archive-date-list-css.test.ts`
- Create: `src/components/trending/archive-date-list.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing component test**

Create `tests/components/trending/archive-date-list.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchiveDateList } from "@/components/trending/archive-date-list";

describe("ArchiveDateList", () => {
  it("renders every archive date as a descending link list", () => {
    render(
      <ArchiveDateList
        dates={["2026-03-29", "2026-03-28", "2026-03-27"]}
      />,
    );

    const section = screen.getByRole("region", { name: "아카이브" });
    const links = within(section).getAllByRole("link");

    expect(
      within(section).getByRole("heading", { name: "아카이브" }),
    ).toBeInTheDocument();
    expect(links.map((link) => link.textContent)).toEqual([
      "2026-03-29",
      "2026-03-28",
      "2026-03-27",
    ]);
    expect(links[0]).toHaveAttribute("href", "/archive/2026-03-29");
    expect(links[0]).toHaveAccessibleName("2026-03-29 아카이브 보기");
  });

  it("renders nothing when no archive dates are available", () => {
    const { container } = render(<ArchiveDateList dates={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run the component test to verify RED**

Run: `npm test -- tests/components/trending/archive-date-list.test.tsx`
Expected: FAIL because the component file does not exist yet.

- [ ] **Step 3: Write the failing CSS test**

Create `tests/styles/archive-date-list-css.test.ts`:

```ts
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readGlobalsCss() {
  const filePath = path.resolve(process.cwd(), "src/app/globals.css");

  return fs.readFileSync(filePath, "utf8").replace(/\s+/g, " ");
}

describe("archive date list css", () => {
  it("styles archive dates as wrapped editorial chips", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.archive-date-list\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*gap:/,
    );
    expect(css).toMatch(
      /\.archive-date-list__link\s*\{[^}]*display:\s*inline-flex;[^}]*border:\s*var\(--border-md\);[^}]*box-shadow:\s*var\(--shadow-md\);/,
    );
    expect(css).toMatch(
      /\.archive-date-list__link:hover,\s*\.archive-date-list__link:focus-visible\s*\{[^}]*transform:\s*translate\(-2px,\s*-2px\);/,
    );
  });
});
```

- [ ] **Step 4: Run the CSS test to verify RED**

Run: `npm test -- tests/styles/archive-date-list-css.test.ts`
Expected: FAIL because the archive list selectors are not in `globals.css` yet.

- [ ] **Step 5: Write the minimal component and CSS implementation**

Create `src/components/trending/archive-date-list.tsx`:

```tsx
import Link from "next/link";

interface ArchiveDateListProps {
  dates: string[];
}

export function ArchiveDateList({ dates }: ArchiveDateListProps) {
  if (dates.length === 0) {
    return null;
  }

  return (
    <section
      className="section-block section-block--archive"
      aria-labelledby="archive-date-list-heading"
    >
      <div className="section-heading">
        <p className="section-kicker">ARCHIVE</p>
        <h2 id="archive-date-list-heading">아카이브</h2>
      </div>
      <ul className="archive-date-list" aria-label="저장된 스냅샷 날짜 목록">
        {dates.map((date) => (
          <li key={date}>
            <Link
              href={`/archive/${date}`}
              className="archive-date-list__link"
              aria-label={`${date} 아카이브 보기`}
            >
              {date}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Append the archive section styles to `src/app/globals.css` near the other section styles:

```css
.section-block--archive {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0 60%, rgba(17, 17, 17, 0.04) 60% 100%),
    var(--paper);
}

.archive-date-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  list-style: none;
}

.archive-date-list__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 10px 14px;
  border: var(--border-md);
  background: #ffffff;
  box-shadow: var(--shadow-md);
  font-size: 0.98rem;
  font-weight: 650;
}

.archive-date-list__link:hover,
.archive-date-list__link:focus-visible {
  transform: translate(-2px, -2px);
}
```

- [ ] **Step 6: Run the focused component and CSS tests to verify GREEN**

Run: `npm test -- tests/components/trending/archive-date-list.test.tsx tests/styles/archive-date-list-css.test.ts`
Expected: PASS with the new section markup and style selectors in place.

- [ ] **Step 7: Commit the component slice**

```bash
git add tests/components/trending/archive-date-list.test.tsx tests/styles/archive-date-list-css.test.ts src/components/trending/archive-date-list.tsx src/app/globals.css
git commit -m "feat: add archive date list section"
```

### Task 3: Integrate archive dates into the homepage and verify the full flow

**Files:**
- Modify: `tests/app/home-page.test.tsx`
- Modify: `tests/app/home-page-smoke.test.tsx`
- Modify: `src/components/trending/site-shell.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the failing homepage tests**

Update `tests/app/home-page.test.tsx` so the mocked query module includes `getSnapshotArchiveDates`, then add archive assertions:

```tsx
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getLatestSnapshotPageData, getSnapshotArchiveDates } = vi.hoisted(() => ({
  getLatestSnapshotPageData: vi.fn(),
  getSnapshotArchiveDates: vi.fn(),
}));

vi.mock("@/lib/snapshots/queries", () => ({
  getLatestSnapshotPageData,
  getSnapshotArchiveDates,
}));

beforeEach(() => {
  getLatestSnapshotPageData.mockReset();
  getSnapshotArchiveDates.mockReset();
});

it("renders archive navigation for every stored snapshot date", async () => {
  getLatestSnapshotPageData.mockResolvedValue(buildSnapshot());
  getSnapshotArchiveDates.mockResolvedValue([
    "2026-03-29",
    "2026-03-28",
    "2026-03-27",
  ]);

  render(await HomePage());

  const archiveSection = screen.getByRole("region", { name: "아카이브" });
  const links = within(archiveSection).getAllByRole("link");

  expect(getSnapshotArchiveDates).toHaveBeenCalled();
  expect(links.map((link) => link.textContent)).toEqual([
    "2026-03-29",
    "2026-03-28",
    "2026-03-27",
  ]);
  expect(links[1]).toHaveAttribute("href", "/archive/2026-03-28");
});

it("omits archive navigation when there are no archive dates to show", async () => {
  getLatestSnapshotPageData.mockResolvedValue(buildSnapshot());
  getSnapshotArchiveDates.mockResolvedValue([]);

  render(await HomePage());

  expect(screen.queryByRole("region", { name: "아카이브" })).not.toBeInTheDocument();
});
```

Update `tests/app/home-page-smoke.test.tsx` to mock the new query and keep the empty-state assertion explicit:

```tsx
const { getLatestSnapshotPageData, getSnapshotArchiveDates } = vi.hoisted(() => ({
  getLatestSnapshotPageData: vi.fn(),
  getSnapshotArchiveDates: vi.fn(),
}));

vi.mock("@/lib/snapshots/queries", () => ({
  getLatestSnapshotPageData,
  getSnapshotArchiveDates,
}));

it("renders only the homepage safe empty state when no latest snapshot is available", async () => {
  getLatestSnapshotPageData.mockResolvedValue(null);
  getSnapshotArchiveDates.mockResolvedValue(["2026-03-29"]);

  render(await HomePage());

  expect(screen.queryByRole("region", { name: "아카이브" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the homepage tests to verify RED**

Run: `npm test -- tests/app/home-page.test.tsx tests/app/home-page-smoke.test.tsx`
Expected: FAIL because `HomePage` does not fetch or render archive dates yet.

- [ ] **Step 3: Write the minimal homepage integration**

Update `src/components/trending/site-shell.tsx`:

```tsx
import type { SnapshotPageData } from "@/lib/snapshots/queries";

import { ArchiveDateList } from "@/components/trending/archive-date-list";
import { RepositoryList } from "@/components/trending/repository-list";
import { SnapshotHero } from "@/components/trending/snapshot-hero";
import { TopThreeGrid } from "@/components/trending/top-three-grid";

interface SiteShellProps {
  snapshot: SnapshotPageData;
  archiveDates?: string[];
  mode?: "latest" | "archive";
}

export function SiteShell({
  snapshot,
  archiveDates = [],
  mode = "latest",
}: SiteShellProps) {
  return (
    <main className="site-shell">
      <div className="poster-grid">
        <SnapshotHero snapshot={snapshot} mode={mode} />
        <TopThreeGrid highlights={snapshot.topThree} items={snapshot.items} />
        <RepositoryList items={snapshot.items} />
        {mode === "latest" && archiveDates.length > 0 ? (
          <ArchiveDateList dates={archiveDates} />
        ) : null}
      </div>
    </main>
  );
}
```

Update `src/app/page.tsx`:

```tsx
import { getLatestSnapshotPageData, getSnapshotArchiveDates } from "@/lib/snapshots/queries";
import { EmptyState } from "@/components/trending/empty-state";
import { SiteShell } from "@/components/trending/site-shell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [snapshot, archiveDates] = await Promise.all([
    getLatestSnapshotPageData(),
    getSnapshotArchiveDates(),
  ]);

  if (!snapshot) {
    return (
      <EmptyState
        title="아직 오늘의 스냅샷이 도착하지 않았습니다"
        description="크론 수집이 끝나면 한국어 큐레이션과 함께 여기에 정리됩니다."
        kicker="DAILY SNAPSHOT"
      />
    );
  }

  return <SiteShell snapshot={snapshot} archiveDates={archiveDates} mode="latest" />;
}
```

- [ ] **Step 4: Run the homepage and new component tests to verify GREEN**

Run: `npm test -- tests/app/home-page.test.tsx tests/app/home-page-smoke.test.tsx tests/components/trending/archive-date-list.test.tsx tests/styles/archive-date-list-css.test.ts tests/snapshots/queries.test.ts`
Expected: PASS with archive dates visible only on the homepage latest view.

- [ ] **Step 5: Run the full regression suite**

Run: `npm test`
Expected: PASS with no regressions across existing snapshot, app, component, and style coverage.

- [ ] **Step 6: Run production verification**

Run: `npm run build`
Expected: PASS and finish a successful Next.js production build.

- [ ] **Step 7: Commit the integrated feature**

```bash
git add src/app/page.tsx src/app/globals.css src/components/trending/archive-date-list.tsx src/components/trending/site-shell.tsx src/lib/snapshots/queries.ts tests/app/home-page.test.tsx tests/app/home-page-smoke.test.tsx tests/components/trending/archive-date-list.test.tsx tests/styles/archive-date-list-css.test.ts tests/snapshots/queries.test.ts
git commit -m "feat: add homepage archive date navigation"
```
