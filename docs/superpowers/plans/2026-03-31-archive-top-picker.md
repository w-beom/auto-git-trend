# Archive Top Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the lower homepage archive date list with a hero-level archive date picker that shows the current date, routes latest back to `/`, and works on both the homepage and archive pages.

**Architecture:** Add a small client-side `ArchiveDatePicker` component responsible only for rendering the date control and routing on selection change. Thread archive date data through `SnapshotHero` and `SiteShell`, fetch archive dates on both `/` and `/archive/[date]`, and remove the old body-level archive list and its styles once the picker is in place.

**Tech Stack:** Next.js App Router, React 19, Next navigation, global CSS, Vitest, Testing Library

---

## File Map

- Create: `src/components/trending/archive-date-picker.tsx`
  - client component that renders the picker and routes on change
- Modify: `src/components/trending/snapshot-hero.tsx`
  - render the picker inside hero meta when enough dates exist
- Modify: `src/components/trending/site-shell.tsx`
  - pass archive dates through to `SnapshotHero` and stop rendering the old body list
- Modify: `src/app/page.tsx`
  - keep fetching latest snapshot and archive dates for the homepage
- Modify: `src/app/archive/[date]/page.tsx`
  - fetch archive dates for archive pages and pass them into `SiteShell`
- Modify: `src/app/globals.css`
  - add picker styles and remove old archive date list selectors
- Delete: `src/components/trending/archive-date-list.tsx`
  - no longer needed after the picker replaces the body section
- Create: `tests/components/trending/archive-date-picker.test.tsx`
  - verify selected value, routing, and hidden state
- Modify: `tests/components/trending/snapshot-hero.test.tsx`
  - verify picker placement inside the hero and archive/latest selected values
- Modify: `tests/app/home-page.test.tsx`
  - verify picker on homepage and absence of body-level archive section
- Modify: `tests/app/archive-page.test.tsx`
  - verify picker on archive page and current archive date selection
- Create: `tests/styles/archive-date-picker-css.test.ts`
  - verify picker styles exist in `globals.css`
- Delete: `tests/components/trending/archive-date-list.test.tsx`
  - old section coverage replaced by picker tests
- Delete: `tests/styles/archive-date-list-css.test.ts`
  - old section style coverage replaced by picker style tests

### Task 1: Add the top picker component with client-side routing

**Files:**
- Create: `tests/components/trending/archive-date-picker.test.tsx`
- Create: `src/components/trending/archive-date-picker.tsx`

- [ ] **Step 1: Write the failing picker test**

Create `tests/components/trending/archive-date-picker.test.tsx` with a mocked App Router:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

import { ArchiveDatePicker } from "@/components/trending/archive-date-picker";

describe("ArchiveDatePicker", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("shows the current date as the selected value", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-29", "2026-03-28", "2026-03-27"]}
        currentDate="2026-03-28"
      />,
    );

    expect(
      screen.getByLabelText("아카이브 날짜"),
    ).toHaveValue("2026-03-28");
  });

  it("routes older dates to archive pages and the latest date to the homepage", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-29", "2026-03-28", "2026-03-27"]}
        currentDate="2026-03-29"
      />,
    );

    fireEvent.change(screen.getByLabelText("아카이브 날짜"), {
      target: { value: "2026-03-27" },
    });
    expect(push).toHaveBeenLastCalledWith("/archive/2026-03-27");

    fireEvent.change(screen.getByLabelText("아카이브 날짜"), {
      target: { value: "2026-03-29" },
    });
    expect(push).toHaveBeenLastCalledWith("/");
  });

  it("renders nothing when fewer than two dates are available", () => {
    const { container } = render(
      <ArchiveDatePicker dates={["2026-03-29"]} currentDate="2026-03-29" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run the picker test to verify RED**

Run: `npm test -- tests/components/trending/archive-date-picker.test.tsx`
Expected: FAIL because `ArchiveDatePicker` does not exist yet.

- [ ] **Step 3: Write the minimal picker implementation**

Create `src/components/trending/archive-date-picker.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";

interface ArchiveDatePickerProps {
  dates: string[];
  currentDate: string;
}

export function ArchiveDatePicker({
  dates,
  currentDate,
}: ArchiveDatePickerProps) {
  const router = useRouter();

  if (dates.length < 2 || !dates.includes(currentDate)) {
    return null;
  }

  const latestDate = dates[0];

  return (
    <label className="archive-date-picker" htmlFor="archive-date-picker">
      <span className="archive-date-picker__label">아카이브 날짜</span>
      <select
        id="archive-date-picker"
        className="archive-date-picker__control"
        value={currentDate}
        onChange={(event) => {
          const nextDate = event.target.value;
          router.push(nextDate === latestDate ? "/" : `/archive/${nextDate}`);
        }}
      >
        {dates.map((date) => (
          <option key={date} value={date}>
            {date}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 4: Run the picker test to verify GREEN**

Run: `npm test -- tests/components/trending/archive-date-picker.test.tsx`
Expected: PASS with all three picker behaviors covered.

- [ ] **Step 5: Commit the picker slice**

```bash
git add tests/components/trending/archive-date-picker.test.tsx src/components/trending/archive-date-picker.tsx
git commit -m "feat: add archive top picker"
```

### Task 2: Integrate the picker into the hero and both pages

**Files:**
- Modify: `tests/components/trending/snapshot-hero.test.tsx`
- Modify: `tests/app/home-page.test.tsx`
- Modify: `tests/app/archive-page.test.tsx`
- Modify: `src/components/trending/snapshot-hero.tsx`
- Modify: `src/components/trending/site-shell.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/archive/[date]/page.tsx`

- [ ] **Step 1: Write the failing hero and page integration tests**

Extend `tests/components/trending/snapshot-hero.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/trending/archive-date-picker", () => ({
  ArchiveDatePicker: ({
    dates,
    currentDate,
  }: {
    dates: string[];
    currentDate: string;
  }) => (
    <div data-testid="archive-date-picker">
      {currentDate}:{dates.join(",")}
    </div>
  ),
}));

it("renders the archive picker in the hero when multiple archive dates exist", () => {
  render(
    <SnapshotHero
      snapshot={snapshot}
      archiveDates={["2026-03-29", "2026-03-28", "2026-03-27"]}
    />,
  );

  expect(screen.getByTestId("archive-date-picker")).toHaveTextContent(
    "2026-03-29:2026-03-29,2026-03-28,2026-03-27",
  );
});

it("passes the archive snapshot date into the picker on archive pages", () => {
  render(
    <SnapshotHero
      snapshot={{ ...snapshot, snapshotDate: "2026-03-28" }}
      archiveDates={["2026-03-29", "2026-03-28", "2026-03-27"]}
      mode="archive"
    />,
  );

  expect(screen.getByTestId("archive-date-picker")).toHaveTextContent(
    "2026-03-28:2026-03-29,2026-03-28,2026-03-27",
  );
});
```

Update `tests/app/home-page.test.tsx` so the old archive section assertions are replaced with hero-picker assertions:

```tsx
it("renders the archive picker in the hero for every stored snapshot date", async () => {
  getLatestSnapshotPageData.mockResolvedValue(buildSnapshot());
  getSnapshotArchiveDates.mockResolvedValue([
    "2026-03-29",
    "2026-03-28",
    "2026-03-27",
  ]);

  render(await HomePage());

  expect(screen.getByLabelText("아카이브 날짜")).toHaveValue("2026-03-29");
  expect(screen.queryByRole("region", { name: "아카이브" })).not.toBeInTheDocument();
});
```

Update `tests/app/archive-page.test.tsx` to mock `getSnapshotArchiveDates` and assert the picker is rendered:

```tsx
const { getSnapshotPageDataByDate, getSnapshotArchiveDates, notFound } = vi.hoisted(() => ({
  getSnapshotPageDataByDate: vi.fn(),
  getSnapshotArchiveDates: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/snapshots/queries", () => ({
  getSnapshotPageDataByDate,
  getSnapshotArchiveDates,
}));

beforeEach(() => {
  getSnapshotPageDataByDate.mockReset();
  getSnapshotArchiveDates.mockReset();
  notFound.mockClear();
});

it("renders the requested snapshot date with the archive picker selected", async () => {
  getSnapshotPageDataByDate.mockResolvedValue(buildSnapshot());
  getSnapshotArchiveDates.mockResolvedValue([
    "2026-03-29",
    "2026-03-28",
    "2026-03-27",
  ]);

  render(
    await ArchivePage({
      params: Promise.resolve({ date: "2026-03-28" }),
    }),
  );

  expect(getSnapshotArchiveDates).toHaveBeenCalled();
  expect(screen.getByLabelText("아카이브 날짜")).toHaveValue("2026-03-28");
});
```

- [ ] **Step 2: Run the hero and page tests to verify RED**

Run: `npm test -- tests/components/trending/snapshot-hero.test.tsx tests/app/home-page.test.tsx tests/app/archive-page.test.tsx`
Expected: FAIL because `SnapshotHero` does not accept `archiveDates` yet, homepage still renders the old section, and archive pages do not fetch archive dates.

- [ ] **Step 3: Write the minimal integration changes**

Update `src/components/trending/snapshot-hero.tsx`:

```tsx
import type { SnapshotPageData } from "@/lib/snapshots/queries";

import { ArchiveDatePicker } from "@/components/trending/archive-date-picker";

interface SnapshotHeroProps {
  snapshot: SnapshotPageData;
  archiveDates?: string[];
  mode?: "latest" | "archive";
}

export function SnapshotHero({
  snapshot,
  archiveDates = [],
  mode = "latest",
}: SnapshotHeroProps) {
  const isArchive = mode === "archive";

  return (
    <section className="hero-panel" aria-labelledby="snapshot-heading">
      <div className="hero-panel__intro">
        {/* existing intro stays unchanged */}
      </div>

      <div className="hero-panel__meta">
        <p className="meta-chip meta-chip--accent">{`${snapshot.snapshotDate} 발행`}</p>
        <p className="meta-chip">{snapshot.capturedAtLabel}</p>
        <p className="meta-chip">{`총 ${snapshot.totalCount}개 저장소`}</p>
        <ArchiveDatePicker
          dates={archiveDates}
          currentDate={snapshot.snapshotDate}
        />
      </div>
    </section>
  );
}
```

Update `src/components/trending/site-shell.tsx`:

```tsx
import type { SnapshotPageData } from "@/lib/snapshots/queries";

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
        <SnapshotHero snapshot={snapshot} archiveDates={archiveDates} mode={mode} />
        <TopThreeGrid highlights={snapshot.topThree} items={snapshot.items} />
        <RepositoryList items={snapshot.items} />
      </div>
    </main>
  );
}
```

Update `src/app/page.tsx` only if needed to keep passing archive dates through:

```tsx
return <SiteShell snapshot={snapshot} archiveDates={archiveDates} mode="latest" />;
```

Update `src/app/archive/[date]/page.tsx`:

```tsx
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/trending/site-shell";
import {
  getSnapshotArchiveDates,
  getSnapshotPageDataByDate,
} from "@/lib/snapshots/queries";

export const dynamic = "force-dynamic";

interface ArchivePageProps {
  params: Promise<{
    date: string;
  }>;
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { date } = await params;
  const [snapshot, archiveDates] = await Promise.all([
    getSnapshotPageDataByDate(date),
    getSnapshotArchiveDates(),
  ]);

  if (!snapshot) {
    notFound();
  }

  return <SiteShell snapshot={snapshot} archiveDates={archiveDates} mode="archive" />;
}
```

- [ ] **Step 4: Run the hero and page tests to verify GREEN**

Run: `npm test -- tests/components/trending/snapshot-hero.test.tsx tests/app/home-page.test.tsx tests/app/archive-page.test.tsx`
Expected: PASS with the picker rendered in the hero on both latest and archive pages, and the old lower archive region gone.

- [ ] **Step 5: Commit the integration slice**

```bash
git add tests/components/trending/snapshot-hero.test.tsx tests/app/home-page.test.tsx tests/app/archive-page.test.tsx src/components/trending/snapshot-hero.tsx src/components/trending/site-shell.tsx src/app/page.tsx src/app/archive/[date]/page.tsx
git commit -m "feat: move archive navigation to hero"
```

### Task 3: Replace old styles, remove the obsolete section, and verify the full app

**Files:**
- Create: `tests/styles/archive-date-picker-css.test.ts`
- Modify: `src/app/globals.css`
- Delete: `src/components/trending/archive-date-list.tsx`
- Delete: `tests/components/trending/archive-date-list.test.tsx`
- Delete: `tests/styles/archive-date-list-css.test.ts`

- [ ] **Step 1: Write the failing picker CSS test**

Create `tests/styles/archive-date-picker-css.test.ts`:

```ts
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readGlobalsCss() {
  const filePath = path.resolve(process.cwd(), "src/app/globals.css");

  return fs.readFileSync(filePath, "utf8").replace(/\s+/g, " ");
}

describe("archive date picker css", () => {
  it("styles the hero archive picker like a meta control", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.archive-date-picker\s*\{[^}]*display:\s*grid;[^}]*gap:/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__control\s*\{[^}]*border:\s*var\(--border-md\);[^}]*box-shadow:\s*var\(--shadow-md\);/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__label\s*\{[^}]*font-size:\s*0\.72rem;[^}]*text-transform:\s*uppercase;/,
    );
    expect(css).not.toMatch(/\.archive-date-list\s*\{/);
  });
});
```

- [ ] **Step 2: Run the CSS test to verify RED**

Run: `npm test -- tests/styles/archive-date-picker-css.test.ts`
Expected: FAIL because the picker selectors do not exist and old archive-date-list selectors are still present.

- [ ] **Step 3: Write the minimal style and cleanup changes**

Update `src/app/globals.css` by removing the old archive section selectors and adding picker styles near the hero metadata styles:

```css
.archive-date-picker {
  display: grid;
  gap: 6px;
}

.archive-date-picker__label {
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.archive-date-picker__control {
  min-height: 44px;
  padding: 10px 36px 10px 12px;
  border: var(--border-md);
  background: #ffffff;
  box-shadow: var(--shadow-md);
  font: inherit;
  font-size: 0.98rem;
  font-weight: 650;
}
```

Delete the obsolete files:

```text
src/components/trending/archive-date-list.tsx
tests/components/trending/archive-date-list.test.tsx
tests/styles/archive-date-list-css.test.ts
```

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `npm test -- tests/components/trending/archive-date-picker.test.tsx tests/components/trending/snapshot-hero.test.tsx tests/app/home-page.test.tsx tests/app/archive-page.test.tsx tests/styles/archive-date-picker-css.test.ts`
Expected: PASS with the picker fully replacing the body-level archive list.

- [ ] **Step 5: Run the full regression suite**

Run: `npm test`
Expected: PASS with no regressions across the full app test suite.

- [ ] **Step 6: Run production verification**

Run: `npm run build`
Expected: PASS and produce a successful Next.js production build.

- [ ] **Step 7: Commit the cleanup and verification slice**

```bash
git add src/components/trending/archive-date-picker.tsx src/components/trending/snapshot-hero.tsx src/components/trending/site-shell.tsx src/app/page.tsx src/app/archive/[date]/page.tsx src/app/globals.css tests/components/trending/archive-date-picker.test.tsx tests/components/trending/snapshot-hero.test.tsx tests/app/home-page.test.tsx tests/app/archive-page.test.tsx tests/styles/archive-date-picker-css.test.ts
git rm src/components/trending/archive-date-list.tsx tests/components/trending/archive-date-list.test.tsx tests/styles/archive-date-list-css.test.ts
git commit -m "feat: replace archive list with hero picker"
```
