# Collapse Card Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show only the first summary paragraph by default in list cards, with a top-right arrow toggle that expands and collapses the full summary.

**Architecture:** Keep the change local to `RepositoryCard` so each list card owns its own expanded state. Preserve the existing paragraph parsing logic, but render a filtered paragraph set for `list` cards while leaving `feature` cards fully expanded. Add only the CSS needed to place the toggle in the masthead and express collapsed versus expanded state.

**Tech Stack:** Next.js App Router, React 19, global CSS, Vitest, Testing Library

---

## File Map

- Modify: `src/components/trending/repository-card.tsx`
  - add local expand/collapse state for `list` cards and render the top-right toggle button
- Modify: `src/app/globals.css`
  - add masthead/toggle layout styles and collapsed/expanded arrow visuals
- Modify: `tests/components/trending/repository-card.test.tsx`
  - replace always-expanded assertions with collapse/expand behavior coverage
- Modify: `tests/styles/card-layout-css.test.ts`
  - assert the new toggle-related selectors and masthead layout rules

### Task 1: Redefine the list card summary contract around collapse and expand

**Files:**
- Modify: `tests/components/trending/repository-card.test.tsx`
- Modify: `src/components/trending/repository-card.tsx`

- [ ] **Step 1: Write the failing repository card behavior tests**

Replace the current summary assertions in `tests/components/trending/repository-card.test.tsx` with collapse-oriented coverage:

```tsx
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RepositoryCard } from "@/components/trending/repository-card";

describe("RepositoryCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows only the first summary paragraph by default in list cards", () => {
    render(
      <RepositoryCard
        item={{
          rank: 4,
          fullName: "acme/rocket",
          owner: "acme",
          name: "rocket",
          githubUrl: "https://github.com/acme/rocket",
          summaryKo:
            "첫 문단 요약입니다.\n\n둘째 문단 설명입니다.\n\n셋째 문단 설명입니다.",
          description: null,
          readmeExcerpt: null,
          primaryLanguage: "TypeScript",
          starsToday: 120,
          starsTotal: 4200,
          forksTotal: 210,
          avatarUrl: "https://example.com/acme.png",
        }}
      />,
    );

    const summaryGroup = screen.getByRole("group", { name: "프로젝트 요약" });

    expect(within(summaryGroup).getByText("첫 문단 요약입니다.")).toBeInTheDocument();
    expect(within(summaryGroup).queryByText("둘째 문단 설명입니다.")).not.toBeInTheDocument();
    expect(within(summaryGroup).queryByText("셋째 문단 설명입니다.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "상세 펼치기" })).toBeInTheDocument();
  });

  it("expands and collapses the full summary from the top-right toggle", () => {
    render(
      <RepositoryCard
        item={{
          rank: 4,
          fullName: "acme/rocket",
          owner: "acme",
          name: "rocket",
          githubUrl: "https://github.com/acme/rocket",
          summaryKo:
            "첫 문단 요약입니다.\n\n둘째 문단 설명입니다.\n\n셋째 문단 설명입니다.",
          description: null,
          readmeExcerpt: null,
          primaryLanguage: "TypeScript",
          starsToday: 120,
          starsTotal: 4200,
          forksTotal: 210,
          avatarUrl: "https://example.com/acme.png",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "상세 펼치기" }));
    expect(screen.getByRole("button", { name: "상세 접기" })).toBeInTheDocument();
    expect(screen.getByText("둘째 문단 설명입니다.")).toBeInTheDocument();
    expect(screen.getByText("셋째 문단 설명입니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "상세 접기" }));
    expect(screen.getByRole("button", { name: "상세 펼치기" })).toBeInTheDocument();
    expect(screen.queryByText("둘째 문단 설명입니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("셋째 문단 설명입니다.")).not.toBeInTheDocument();
  });

  it("omits the toggle when a list card has only one paragraph", () => {
    render(
      <RepositoryCard
        item={{
          rank: 4,
          fullName: "acme/rocket",
          owner: "acme",
          name: "rocket",
          githubUrl: "https://github.com/acme/rocket",
          summaryKo: "첫 문단 요약입니다.",
          description: null,
          readmeExcerpt: null,
          primaryLanguage: "TypeScript",
          starsToday: 120,
          starsTotal: 4200,
          forksTotal: 210,
          avatarUrl: "https://example.com/acme.png",
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: /상세/ })).not.toBeInTheDocument();
  });

  it("keeps feature cards fully expanded without a toggle", () => {
    render(
      <RepositoryCard
        variant="feature"
        item={{
          rank: 1,
          fullName: "acme/rocket",
          owner: "acme",
          name: "rocket",
          githubUrl: "https://github.com/acme/rocket",
          summaryKo:
            "첫 문단 요약입니다.\n\n둘째 문단 설명입니다.\n\n셋째 문단 설명입니다.",
          description: null,
          readmeExcerpt: null,
          primaryLanguage: "TypeScript",
          starsToday: 120,
          starsTotal: 4200,
          forksTotal: 210,
          avatarUrl: "https://example.com/acme.png",
        }}
      />,
    );

    expect(screen.getByText("첫 문단 요약입니다.")).toBeInTheDocument();
    expect(screen.getByText("둘째 문단 설명입니다.")).toBeInTheDocument();
    expect(screen.getByText("셋째 문단 설명입니다.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /상세/ })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the repository card test to verify RED**

Run: `npm test -- tests/components/trending/repository-card.test.tsx`
Expected: FAIL because the current card renders every paragraph immediately and has no toggle button.

- [ ] **Step 3: Write the minimal repository card implementation**

Update `src/components/trending/repository-card.tsx` to add local expand state only for `list` cards with multiple paragraphs:

```tsx
"use client";

import { useState } from "react";

import type { SnapshotPageItem } from "@/lib/snapshots/queries";

interface RepositoryCardProps {
  item: SnapshotPageItem;
  variant?: "feature" | "list";
}

function getSummaryParagraphs(summary: string) {
  return summary
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function formatCount(value: number | null, label: string) {
  if (value === null) {
    return null;
  }

  return `${value.toLocaleString("en-US")} ${label}`;
}

export function RepositoryCard({
  item,
  variant = "list",
}: RepositoryCardProps) {
  const isFeature = variant === "feature";
  const summaryParagraphs = getSummaryParagraphs(item.summaryKo);
  const isToggleable = !isFeature && summaryParagraphs.length > 1;
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleParagraphs =
    isToggleable && !isExpanded ? summaryParagraphs.slice(0, 1) : summaryParagraphs;

  return (
    <article className={`repo-card repo-card--${variant}`}>
      <div className="repo-card__content">
        <div className="repo-card__masthead">
          <div className="repo-card__masthead-main">
            <span className={`rank-badge rank-badge--${variant}`}>
              {isFeature ? `TOP ${item.rank}` : `${item.rank}위`}
            </span>
            <span className="repo-card__owner">{`@${item.owner}`}</span>
          </div>

          {isToggleable ? (
            <button
              type="button"
              className={`repo-card__toggle${isExpanded ? " repo-card__toggle--expanded" : ""}`}
              aria-label={isExpanded ? "상세 접기" : "상세 펼치기"}
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((expanded) => !expanded)}
            >
              <span aria-hidden="true">{isExpanded ? "▴" : "▾"}</span>
            </button>
          ) : null}
        </div>

        <div className="repo-card__body">
          <p className="repo-card__fullname">{item.fullName}</p>
          <h3 className="repo-card__name">{item.name}</h3>
          <div className="repo-card__summary-block" role="group" aria-label="프로젝트 요약">
            {visibleParagraphs.map((paragraph) => (
              <p key={paragraph} className="repo-card__summary-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="repo-card__footer">
        <dl className="repo-card__meta" aria-label={`${item.fullName} 메타데이터`}>
          {item.starsTotal !== null ? (
            <div>
              <dt>누적 스타</dt>
              <dd>{formatCount(item.starsTotal, "stars")}</dd>
            </div>
          ) : null}
          {item.forksTotal !== null ? (
            <div>
              <dt>포크</dt>
              <dd>{formatCount(item.forksTotal, "forks")}</dd>
            </div>
          ) : null}
        </dl>

        <a
          className="action-link"
          href={item.githubUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={
            isFeature
              ? `${item.fullName} 하이라이트 GitHub에서 보기`
              : `${item.fullName} GitHub에서 보기`
          }
        >
          GitHub에서 보기
        </a>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Run the repository card test to verify GREEN**

Run: `npm test -- tests/components/trending/repository-card.test.tsx`
Expected: PASS with collapsed-by-default list cards, functional toggle behavior, and untouched feature cards.

- [ ] **Step 5: Commit the card behavior slice**

```bash
git add tests/components/trending/repository-card.test.tsx src/components/trending/repository-card.tsx
git commit -m "feat: collapse repository card details"
```

### Task 2: Add the top-right arrow layout and state styling

**Files:**
- Modify: `tests/styles/card-layout-css.test.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing card layout style test**

Extend `tests/styles/card-layout-css.test.ts` with assertions for the new masthead and toggle selectors:

```ts
it("styles repository cards for top-right detail toggles", () => {
  const css = readGlobalsCss();

  expect(css).toMatch(
    /\.repo-card__masthead\s*\{[^}]*justify-content:\s*space-between;[^}]*align-items:\s*flex-start;/,
  );
  expect(css).toMatch(
    /\.repo-card__masthead-main\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;/,
  );
  expect(css).toMatch(
    /\.repo-card__toggle\s*\{[^}]*display:\s*inline-flex;[^}]*min-width:\s*44px;[^}]*border:\s*var\(--border-md\);/,
  );
  expect(css).toMatch(
    /\.repo-card__toggle--expanded\s*\{[^}]*background:\s*var\(--orange\);/,
  );
});
```

- [ ] **Step 2: Run the style test to verify RED**

Run: `npm test -- tests/styles/card-layout-css.test.ts`
Expected: FAIL because the current CSS has no toggle button selectors or masthead split layout.

- [ ] **Step 3: Write the minimal CSS implementation**

Update `src/app/globals.css` near the existing repository card rules:

```css
.repo-card__masthead {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: nowrap;
  gap: 10px;
}

.repo-card__masthead-main {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.repo-card__toggle {
  flex: none;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: var(--border-md);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 2px 2px 0 rgba(17, 17, 17, 0.64);
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.repo-card__toggle--expanded {
  background: var(--orange);
}
```

Keep the existing card visual system intact. Do not add animation in this task.

- [ ] **Step 4: Run the style test to verify GREEN**

Run: `npm test -- tests/styles/card-layout-css.test.ts`
Expected: PASS with the toggle selectors and masthead split layout covered.

- [ ] **Step 5: Commit the visual slice**

```bash
git add tests/styles/card-layout-css.test.ts src/app/globals.css
git commit -m "feat: style repository detail toggle"
```

### Task 3: Run focused regression and full verification

**Files:**
- Modify: `tests/components/trending/repository-card.test.tsx` (only if Task 1/2 review revealed gaps)
- Modify: `src/components/trending/repository-card.tsx` (only if Task 1/2 review revealed gaps)
- Modify: `src/app/globals.css` (only if Task 2 review revealed gaps)

- [ ] **Step 1: Run the focused repository card regression set**

Run:
`npm test -- tests/components/trending/repository-card.test.tsx tests/components/trending/top-three-grid.test.tsx tests/styles/card-layout-css.test.ts`

Expected: PASS, confirming list cards collapse correctly, feature cards remain fully expanded, and layout CSS stays intact.

- [ ] **Step 2: Run the full regression suite**

Run: `npm test`
Expected: PASS with no regressions across the full app test suite.

- [ ] **Step 3: Run production verification**

Run: `npm run build`
Expected: PASS and produce a successful Next.js production build.

- [ ] **Step 4: Commit any follow-up fixes if needed**

If verification required no further changes, do nothing in this step.

If verification required follow-up edits, commit them explicitly:

```bash
git add src/components/trending/repository-card.tsx src/app/globals.css tests/components/trending/repository-card.test.tsx tests/styles/card-layout-css.test.ts
git commit -m "fix: polish repository detail toggle"
```
