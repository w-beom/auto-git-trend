# Snapshot Render Instrumentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add temporary diagnostics that separate snapshot date navigation time into server query latency and client layout measurement time.

**Architecture:** Keep the instrumentation local to the snapshot query functions and the client components that participate in date navigation. Use lightweight `console.info`/`console.warn` diagnostics guarded by development mode so production behavior stays unchanged.

**Tech Stack:** Next.js App Router, React 19, Vitest

---

### Task 1: Define The Diagnostics Contract

**Files:**
- Modify: `tests/snapshots/queries.test.ts`
- Modify: `tests/components/trending/archive-date-picker.test.tsx`

- [ ] **Step 1: Write failing tests for development-only query diagnostics**
- [ ] **Step 2: Run the targeted query test to verify it fails**
- [ ] **Step 3: Write the minimal query instrumentation**
- [ ] **Step 4: Run the targeted query test to verify it passes**

### Task 2: Instrument Client Navigation And Layout Work

**Files:**
- Modify: `tests/components/trending/archive-date-picker.test.tsx`
- Modify: `src/components/trending/archive-date-picker.tsx`
- Modify: `src/components/trending/top-three-grid.tsx`
- Modify: `src/components/trending/top-three-carousel.tsx`

- [ ] **Step 1: Write failing tests for date navigation diagnostics**
- [ ] **Step 2: Run the targeted component test to verify it fails**
- [ ] **Step 3: Write minimal client-side instrumentation**
- [ ] **Step 4: Run the targeted component test to verify it passes**

### Task 3: Verify The Temporary Instrumentation

**Files:**
- Modify: `src/lib/snapshots/queries.ts`
- Modify: `src/components/trending/archive-date-picker.tsx`
- Modify: `src/components/trending/top-three-grid.tsx`
- Modify: `src/components/trending/top-three-carousel.tsx`

- [ ] **Step 1: Run the targeted test suite**
- [ ] **Step 2: Confirm the diagnostics are development-only and non-failing**
