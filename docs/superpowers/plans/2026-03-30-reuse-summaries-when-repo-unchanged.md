# Reuse Summaries When Repository Metadata Is Unchanged Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reuse previously stored repository summaries when the repository description and README excerpt are unchanged, while still refreshing the latest star and fork counts.

**Architecture:** Extend the snapshot ingestion store with a lookup for the latest successful snapshot item per repository. During ingestion, fetch the latest repository metadata and README excerpt, compare them against the most recent successful snapshot values, and call the AI summarizer only when either field changed.

**Tech Stack:** Next.js, TypeScript, Vitest, Supabase

---

### Task 1: Add regression coverage for summary reuse

**Files:**
- Modify: `tests/snapshots/ingest-trending-snapshot.test.ts`
- Test: `tests/snapshots/ingest-trending-snapshot.test.ts`

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run the targeted ingest snapshot tests to verify the new cases fail**
- [ ] **Step 3: Implement the minimal ingestion/store changes**
- [ ] **Step 4: Re-run the targeted ingest snapshot tests to verify they pass**

### Task 2: Implement cached-summary reuse in ingestion

**Files:**
- Modify: `src/lib/snapshots/ingest-trending-snapshot.ts`
- Modify: `src/lib/snapshots/serializers.ts`
- Test: `tests/snapshots/ingest-trending-snapshot.test.ts`

- [ ] **Step 1: Add a store lookup for the latest successful snapshot item**
- [ ] **Step 2: Compare normalized description and README excerpt before summarizing**
- [ ] **Step 3: Reuse the stored summary when both fields are unchanged**
- [ ] **Step 4: Preserve existing behavior when no cached snapshot exists or either field changed**

### Task 3: Verify behavior end-to-end at unit level

**Files:**
- Test: `tests/snapshots/ingest-trending-snapshot.test.ts`

- [ ] **Step 1: Run the targeted ingest snapshot suite**
- [ ] **Step 2: Run the broader snapshot-related test suite**
- [ ] **Step 3: Confirm no existing snapshot regression cases broke**
