# Top Three Horizontal Scroll Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the page easier to read responsively while turning the Top 3 highlight section into a single-card viewer with desktop navigation buttons and mobile swipe behavior.

**Architecture:** Keep the existing homepage structure intact, preserve the vertical full ranking list for reading stability, and reshape only the hero spacing and Top 3 layout. Drive the change with CSS-first adjustments plus a small client-side Top 3 viewer so a full-size ranking card can be shown one at a time, with desktop previous/next controls and mobile touch scrolling.

**Tech Stack:** Next.js App Router, React 19, global CSS, Vitest, Testing Library

---

### Task 1: Lock the Top 3 scroller contract with tests

**Files:**
- Modify: `tests/components/trending/top-three-grid.test.tsx`
- Modify: `tests/styles/card-layout-css.test.ts`

- [ ] **Step 1: Write the failing component test**

Add assertions that the Top 3 section renders a dedicated single-card viewer with an accessible label, pager dots, desktop previous/next controls, and full-size featured cards.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/trending/top-three-grid.test.tsx`
Expected: FAIL because the scroller container does not exist yet.

- [ ] **Step 3: Write the failing CSS test**

Add assertions that the dedicated carousel track uses single-card horizontal scrolling styles, the active pager dot has distinct styling, and desktop navigation buttons appear at the desktop breakpoint.

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- tests/styles/card-layout-css.test.ts`
Expected: FAIL because the current CSS still uses a fixed grid.

- [ ] **Step 5: Commit**

```bash
git add tests/components/trending/top-three-grid.test.tsx tests/styles/card-layout-css.test.ts
git commit -m "test: define responsive top three scroller"
```

### Task 2: Implement the responsive Top 3 scroller and readability adjustments

**Files:**
- Modify: `src/components/trending/top-three-grid.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the minimal component markup change**

Keep the Top 3 item selection logic intact, but move the rendering into a viewer component that can page one full-size card at a time.

- [ ] **Step 2: Run targeted tests**

Run: `npm test -- tests/components/trending/top-three-grid.test.tsx`
Expected: PASS once the scroller markup exists and remains accessible.

- [ ] **Step 3: Write the minimal CSS implementation**

Update the hero, section, and Top 3 styles so:
- mobile reading density improves
- the Top 3 area shows one ranking-sized card at a time on all viewport sizes
- desktop widths show explicit previous and next buttons
- mobile widths keep horizontal swipe scrolling
- dot indicators reflect the current Top 3 page

- [ ] **Step 4: Run style tests**

Run: `npm test -- tests/styles/card-layout-css.test.ts tests/styles/hero-title-css.test.ts`
Expected: PASS with the new scroller and existing hero-title constraint still intact.

- [ ] **Step 5: Commit**

```bash
git add src/components/trending/top-three-grid.tsx src/app/globals.css
git commit -m "feat: add responsive horizontal top three scroller"
```

### Task 3: Verify the page-level behavior stays safe

**Files:**
- Run-only: `tests/app/home-page.test.tsx`
- Run-only: `tests/app/home-page-smoke.test.tsx`

- [ ] **Step 1: Run page tests**

Run: `npm test -- tests/app/home-page.test.tsx tests/app/home-page-smoke.test.tsx`
Expected: PASS so the homepage still renders with the updated layout.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS with no regressions.

- [ ] **Step 3: Run production verification**

Run: `npm run build`
Expected: PASS and produce a successful Next.js build.

- [ ] **Step 4: Commit**

```bash
git add src/components/trending/top-three-grid.tsx src/app/globals.css tests/components/trending/top-three-grid.test.tsx tests/styles/card-layout-css.test.ts docs/superpowers/specs/2026-03-29-auto-git-trend-design.md docs/superpowers/plans/2026-03-30-top-three-horizontal-scroll-responsive.md
git commit -m "feat: improve responsive reading layout"
```
