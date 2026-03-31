# Archive Calendar And Meta Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the top archive date dropdown with a calendar popover that allows only stored dates, while making the hero meta boxes align to a consistent visual height.

**Architecture:** Keep archive date data flow unchanged, but evolve `ArchiveDatePicker` from a native `<select>` into a small client-side calendar popover with month state and stored-date gating. Keep `SnapshotHero` responsible only for composition, and move all visual balancing into `globals.css` so the publish date, captured time, repository count, and archive picker share a common control height.

**Tech Stack:** Next.js App Router, React 19, Next navigation, global CSS, Vitest, Testing Library

---

## File Map

- Modify: `src/components/trending/archive-date-picker.tsx`
  - replace the select control with button-plus-popover calendar behavior
- Optional Create: `src/components/trending/archive-calendar.tsx`
  - extract the month grid if `archive-date-picker.tsx` gets too large during implementation
- Modify: `src/components/trending/snapshot-hero.tsx`
  - keep composition only, no calendar logic changes beyond any prop shape adjustments
- Modify: `src/app/globals.css`
  - add calendar popover styles and normalize meta box sizing
- Modify: `tests/components/trending/archive-date-picker.test.tsx`
  - replace select assertions with calendar behavior assertions
- Modify: `tests/components/trending/snapshot-hero.test.tsx`
  - keep hero integration coverage but assert the closed-state date display rather than a select control
- Modify: `tests/app/home-page.test.tsx`
  - verify the homepage still exposes the current archive date in the hero
- Modify: `tests/app/archive-page.test.tsx`
  - verify archive pages still expose the selected date in the hero
- Modify: `tests/styles/archive-date-picker-css.test.ts`
  - replace select-style assertions with popover and meta-height assertions

### Task 1: Redefine the archive picker contract around a calendar popover

**Files:**
- Modify: `tests/components/trending/archive-date-picker.test.tsx`
- Modify: `src/components/trending/archive-date-picker.tsx`

- [ ] **Step 1: Write the failing calendar picker tests**

Replace the current select-based tests in `tests/components/trending/archive-date-picker.test.tsx` with popover behavior coverage:

```tsx
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

  afterEach(() => {
    cleanup();
  });

  it("shows the current date in the closed state", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-31", "2026-03-30", "2026-03-28"]}
        currentDate="2026-03-30"
      />,
    );

    expect(
      screen.getByRole("button", { name: "아카이브 날짜 2026-03-30" }),
    ).toBeInTheDocument();
  });

  it("opens a calendar month view and disables dates that are not stored", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-31", "2026-03-30", "2026-03-28"]}
        currentDate="2026-03-30"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "아카이브 날짜 2026-03-30" }));

    const dialog = screen.getByRole("dialog", { name: "아카이브 날짜 선택" });
    expect(within(dialog).getByRole("button", { name: "2026-03-31" })).toBeEnabled();
    expect(within(dialog).getByRole("button", { name: "2026-03-30" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(dialog).getByRole("button", { name: "2026-03-29" })).toBeDisabled();
  });

  it("routes stored older dates to archive pages and the latest date to the homepage", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-31", "2026-03-30", "2026-03-28"]}
        currentDate="2026-03-30"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "아카이브 날짜 2026-03-30" }));
    fireEvent.click(screen.getByRole("button", { name: "2026-03-28" }));
    expect(push).toHaveBeenLastCalledWith("/archive/2026-03-28");

    fireEvent.click(screen.getByRole("button", { name: "아카이브 날짜 2026-03-30" }));
    fireEvent.click(screen.getByRole("button", { name: "2026-03-31" }));
    expect(push).toHaveBeenLastCalledWith("/");
  });

  it("renders nothing when fewer than two dates are available", () => {
    const { container } = render(
      <ArchiveDatePicker dates={["2026-03-31"]} currentDate="2026-03-31" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run the picker test to verify RED**

Run: `npm test -- tests/components/trending/archive-date-picker.test.tsx`
Expected: FAIL because the current implementation renders a native select instead of a calendar popover.

- [ ] **Step 3: Write the minimal calendar implementation**

Update `src/components/trending/archive-date-picker.tsx` to manage open state and a month grid keyed to stored dates:

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface ArchiveDatePickerProps {
  dates: string[];
  currentDate: string;
}

function buildMonthDays(visibleMonthIso: string) {
  const [year, month] = visibleMonthIso.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  const days = [];

  for (let day = 1; day <= last.getUTCDate(); day += 1) {
    const iso = `${visibleMonthIso}-${String(day).padStart(2, "0")}`;
    days.push(iso);
  }

  return days;
}

export function ArchiveDatePicker({
  dates,
  currentDate,
}: ArchiveDatePickerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(currentDate.slice(0, 7));

  if (dates.length < 2 || !dates.includes(currentDate)) {
    return null;
  }

  const latestDate = dates[0];
  const storedDates = useMemo(() => new Set(dates), [dates]);
  const monthDays = buildMonthDays(visibleMonth);

  function routeToDate(nextDate: string) {
    setIsOpen(false);
    router.push(nextDate === latestDate ? "/" : `/archive/${nextDate}`);
  }

  return (
    <div className="archive-date-picker">
      <span className="archive-date-picker__label">아카이브 날짜</span>
      <button
        type="button"
        className="archive-date-picker__trigger"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`아카이브 날짜 ${currentDate}`}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{currentDate}</span>
      </button>
      {isOpen ? (
        <div
          className="archive-date-picker__popover"
          role="dialog"
          aria-label="아카이브 날짜 선택"
        >
          <div className="archive-date-picker__calendar">
            {monthDays.map((date) => {
              const isStored = storedDates.has(date);
              const isCurrent = date === currentDate;

              return (
                <button
                  key={date}
                  type="button"
                  className="archive-date-picker__day"
                  aria-label={date}
                  aria-pressed={isCurrent ? "true" : undefined}
                  disabled={!isStored}
                  onClick={() => routeToDate(date)}
                >
                  {date.slice(-2)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run the picker test to verify GREEN**

Run: `npm test -- tests/components/trending/archive-date-picker.test.tsx`
Expected: PASS with closed state, popover, disabled-date, and routing behavior covered.

- [ ] **Step 5: Commit the calendar contract**

```bash
git add tests/components/trending/archive-date-picker.test.tsx src/components/trending/archive-date-picker.tsx
git commit -m "feat: add archive calendar popover"
```

### Task 2: Keep hero and page integration working with the new closed-state control

**Files:**
- Modify: `tests/components/trending/snapshot-hero.test.tsx`
- Modify: `tests/app/home-page.test.tsx`
- Modify: `tests/app/archive-page.test.tsx`
- Modify: `src/components/trending/archive-date-picker.tsx`
- Modify: `src/components/trending/snapshot-hero.tsx` (only if prop wiring needs adjustment)

- [ ] **Step 1: Write the failing integration assertions**

Update `tests/components/trending/snapshot-hero.test.tsx` so the mocked picker output matches the new closed-state contract:

```tsx
vi.mock("@/components/trending/archive-date-picker", () => ({
  ArchiveDatePicker: ({
    dates,
    currentDate,
  }: {
    dates: string[];
    currentDate: string;
  }) => (
    <div data-testid="archive-date-picker">{`${currentDate}|${dates.length}`}</div>
  ),
}));

it("renders the archive picker in the hero when multiple archive dates exist", () => {
  render(
    <SnapshotHero
      snapshot={snapshot}
      archiveDates={["2026-03-31", "2026-03-30", "2026-03-28"]}
    />,
  );

  expect(screen.getByTestId("archive-date-picker")).toHaveTextContent("2026-03-29|3");
});
```

Update `tests/app/home-page.test.tsx`:

```tsx
it("renders the archive calendar trigger in the hero for every stored snapshot date", async () => {
  getLatestSnapshotPageData.mockResolvedValue({
    ...buildSnapshot(),
    snapshotDate: "2026-03-31",
  });
  getSnapshotArchiveDates.mockResolvedValue([
    "2026-03-31",
    "2026-03-30",
    "2026-03-28",
  ]);

  render(await HomePage());

  expect(
    screen.getByRole("button", { name: "아카이브 날짜 2026-03-31" }),
  ).toBeInTheDocument();
});
```

Update `tests/app/archive-page.test.tsx`:

```tsx
expect(
  screen.getByRole("button", { name: "아카이브 날짜 2026-03-28" }),
).toBeInTheDocument();
```

- [ ] **Step 2: Run hero and page tests to verify RED**

Run: `npm test -- tests/components/trending/snapshot-hero.test.tsx tests/app/home-page.test.tsx tests/app/archive-page.test.tsx`
Expected: FAIL until tests and picker output align with the new button-based closed state.

- [ ] **Step 3: Write the minimal integration updates**

Keep `SnapshotHero` and page data flow mostly unchanged. Only update `ArchiveDatePicker` markup and accessible names as needed so the hero and page tests pass. If any prop names changed during Task 1, align them here without adding new behavior.

- [ ] **Step 4: Run hero and page tests to verify GREEN**

Run: `npm test -- tests/components/trending/snapshot-hero.test.tsx tests/app/home-page.test.tsx tests/app/archive-page.test.tsx`
Expected: PASS with the new calendar trigger visible in the hero on both latest and archive pages.

- [ ] **Step 5: Commit the integration slice**

```bash
git add tests/components/trending/snapshot-hero.test.tsx tests/app/home-page.test.tsx tests/app/archive-page.test.tsx src/components/trending/archive-date-picker.tsx src/components/trending/snapshot-hero.tsx
git commit -m "feat: wire archive calendar into hero"
```

### Task 3: Add calendar visuals and rebalance the hero meta boxes

**Files:**
- Modify: `tests/styles/archive-date-picker-css.test.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing style test**

Replace the current select-style assertions in `tests/styles/archive-date-picker-css.test.ts`:

```ts
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readGlobalsCss() {
  const filePath = path.resolve(process.cwd(), "src/app/globals.css");

  return fs.readFileSync(filePath, "utf8").replace(/\s+/g, " ");
}

describe("archive date picker css", () => {
  it("styles the archive picker as a calendar popover and aligns hero meta boxes", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.hero-panel__meta\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*stretch;/,
    );
    expect(css).toMatch(
      /\.meta-chip\s*\{[^}]*min-height:\s*72px;[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__trigger\s*\{[^}]*min-height:\s*72px;[^}]*border:\s*var\(--border-md\);[^}]*box-shadow:\s*var\(--shadow-md\);/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__popover\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*10;/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__day\[disabled\]\s*\{[^}]*opacity:\s*0\.35;/,
    );
    expect(css).not.toMatch(/\.archive-date-picker__control\s*\{/);
  });
});
```

- [ ] **Step 2: Run the style test to verify RED**

Run: `npm test -- tests/styles/archive-date-picker-css.test.ts`
Expected: FAIL because the current CSS still styles a select control and does not normalize meta box heights.

- [ ] **Step 3: Write the minimal CSS implementation**

Update `src/app/globals.css` so the hero meta row stretches boxes to a shared height and the picker renders as a popover calendar:

```css
.hero-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: stretch;
}

.meta-chip {
  min-height: 72px;
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border: var(--border-md);
  background: #ffffff;
  font-size: 0.98rem;
  font-weight: 650;
}

.archive-date-picker {
  position: relative;
  display: grid;
  gap: 6px;
}

.archive-date-picker__trigger {
  min-height: 72px;
  min-width: 220px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: var(--border-md);
  background: #ffffff;
  box-shadow: var(--shadow-md);
  font: inherit;
  font-size: 0.98rem;
  font-weight: 650;
}

.archive-date-picker__popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 10;
  padding: 12px;
  border: var(--border-md);
  background: #ffffff;
  box-shadow: var(--shadow-lg);
}

.archive-date-picker__calendar {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.archive-date-picker__day {
  min-width: 36px;
  min-height: 36px;
  border: var(--border-md);
  background: #ffffff;
  font: inherit;
  font-weight: 650;
}

.archive-date-picker__day[aria-pressed="true"] {
  background: var(--orange);
}

.archive-date-picker__day[disabled] {
  opacity: 0.35;
  cursor: not-allowed;
}
```

Remove the obsolete select-only selector:

```css
.archive-date-picker__control { ... }
```

- [ ] **Step 4: Run focused verification**

Run: `npm test -- tests/components/trending/archive-date-picker.test.tsx tests/components/trending/snapshot-hero.test.tsx tests/app/home-page.test.tsx tests/app/archive-page.test.tsx tests/styles/archive-date-picker-css.test.ts`
Expected: PASS with the calendar trigger, popover, disabled dates, and aligned hero meta boxes all covered.

- [ ] **Step 5: Run the full regression suite**

Run: `npm test`
Expected: PASS with no regressions across the full app test suite.

- [ ] **Step 6: Run production verification**

Run: `npm run build`
Expected: PASS and produce a successful Next.js production build.

- [ ] **Step 7: Commit the visual and verification slice**

```bash
git add src/components/trending/archive-date-picker.tsx src/components/trending/snapshot-hero.tsx src/app/globals.css tests/components/trending/archive-date-picker.test.tsx tests/components/trending/snapshot-hero.test.tsx tests/app/home-page.test.tsx tests/app/archive-page.test.tsx tests/styles/archive-date-picker-css.test.ts
git commit -m "feat: add archive calendar and align meta boxes"
```
