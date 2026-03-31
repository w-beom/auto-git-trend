# Snapshot Query Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce archive date navigation latency by caching archive date reads and slimming snapshot page queries.

**Architecture:** Keep the optimization isolated to `src/lib/snapshots/queries.ts`. Add a small module-scoped cache for archive dates and reduce the Supabase select payload to only the fields the current UI consumes, while preserving the existing view-model shape for the rest of the app.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Vitest

---

### Task 1: Lock In Query Expectations

**Files:**
- Modify: `tests/snapshots/queries.test.ts`

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run `npm test -- tests/snapshots/queries.test.ts` to verify they fail**
- [ ] **Step 3: Implement the minimal query changes**
- [ ] **Step 4: Run `npm test -- tests/snapshots/queries.test.ts` to verify they pass**

### Task 2: Verify Page Regressions

**Files:**
- Modify: `tests/app/home-page.test.tsx`
- Modify: `tests/app/archive-page.test.tsx`

- [ ] **Step 1: Adjust page fixtures only if the slimmed query shape changes visible expectations**
- [ ] **Step 2: Run `npm test -- tests/app/home-page.test.tsx tests/app/archive-page.test.tsx`**
- [ ] **Step 3: Confirm no archive or home-page rendering behavior regressed**
