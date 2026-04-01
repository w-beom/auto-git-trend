import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { formatDateUtc } from "@/lib/time";

interface SnapshotItemQueryRow {
  rank: number;
  repo_description_snapshot: string | null;
  summary_ko: string;
  repository: RepositoryQueryRow | null;
}

interface RepositoryQueryRow {
  owner: string;
  name: string;
  full_name: string;
  github_url: string;
  stars_total: number | null;
  forks_total: number | null;
}

interface SnapshotQueryRow {
  snapshot_date: string;
  captured_at: string;
  item_count: number;
  trending_snapshot_items: SnapshotItemQueryRow[] | null;
}

interface SnapshotDateRow {
  snapshot_date: string;
}

export interface SnapshotPageItem {
  rank: number;
  owner: string;
  name: string;
  fullName: string;
  githubUrl: string;
  summaryKo: string;
  description: string | null;
  readmeExcerpt: string | null;
  primaryLanguage: string | null;
  starsToday: number | null;
  starsTotal: number | null;
  forksTotal: number | null;
  avatarUrl: string | null;
  isNew?: boolean;
}

export interface SnapshotHighlight {
  rank: number;
  fullName: string;
  summaryKo: string;
}

export interface SnapshotPageData {
  snapshotDate: string;
  capturedAtIso: string;
  capturedAtLabel: string;
  totalCount: number;
  topThree: SnapshotHighlight[];
  items: SnapshotPageItem[];
}

const SNAPSHOT_SELECT = `
  snapshot_date,
  captured_at,
  item_count,
  trending_snapshot_items (
    rank,
    repo_description_snapshot,
    summary_ko,
    repository:repositories (
      owner,
      name,
      full_name,
      github_url,
      stars_total,
      forks_total
    )
  )
`;

const SNAPSHOT_ARCHIVE_DATES_TTL_MS = 60_000;

let snapshotArchiveDatesCache:
  | {
      expiresAt: number;
      value: string[];
    }
  | null = null;
let snapshotArchiveDatesPendingPromise: Promise<string[]> | null = null;

const snapshotQueryEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

function getDiagnosticNow() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function roundDuration(durationMs: number) {
  return Number(durationMs.toFixed(2));
}

function logSnapshotDiagnostic(label: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info(`[snapshot-diag] ${label}`, details);
}

function formatEnvIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const key = issue.path.join(".") || "<root>";
      return `${key}: ${issue.message}`;
    })
    .join("; ");
}

function createSnapshotQueryClient() {
  const queryEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  if (!queryEnv.SUPABASE_URL && !queryEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const parsed = snapshotQueryEnvSchema.safeParse(queryEnv);

  if (!parsed.success) {
    throw new Error(
      `Invalid snapshot query environment: ${formatEnvIssues(parsed.error.issues)}`,
    );
  }

  return createClient(
    parsed.data.SUPABASE_URL,
    parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function formatCapturedAtLabel(capturedAtIso: string): string {
  const capturedAt = new Date(capturedAtIso);

  if (Number.isNaN(capturedAt.getTime())) {
    return `Captured ${capturedAtIso}`;
  }

  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(capturedAt);

  return `Captured ${formatted} KST`;
}

function getPreviousSnapshotDate(snapshotDate: string): string | null {
  const date = new Date(`${snapshotDate}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() - 1);

  return formatDateUtc(date);
}

function getRepositoryNames(row: SnapshotQueryRow | null): Set<string> {
  return new Set(
    (row?.trending_snapshot_items ?? [])
      .map((item) => item.repository?.full_name)
      .filter((fullName): fullName is string => Boolean(fullName)),
  );
}

function mapSnapshotRow(
  row: SnapshotQueryRow | null,
  previousDayRepositoryNames: Set<string> | null = null,
): SnapshotPageData | null {
  if (!row) {
    return null;
  }

  const items = (row.trending_snapshot_items ?? [])
    .filter((item): item is SnapshotItemQueryRow & { repository: RepositoryQueryRow } =>
      item.repository !== null,
    )
    .sort((left, right) => left.rank - right.rank)
    .map((item) => ({
      rank: item.rank,
      owner: item.repository.owner,
      name: item.repository.name,
      fullName: item.repository.full_name,
      githubUrl: item.repository.github_url,
      summaryKo: item.summary_ko,
      description: item.repo_description_snapshot,
      readmeExcerpt: null,
      primaryLanguage: null,
      starsToday: null,
      starsTotal: item.repository.stars_total,
      forksTotal: item.repository.forks_total,
      avatarUrl: null,
      isNew:
        previousDayRepositoryNames === null
          ? false
          : !previousDayRepositoryNames.has(item.repository.full_name),
    }));

  return {
    snapshotDate: row.snapshot_date,
    capturedAtIso: row.captured_at,
    capturedAtLabel: formatCapturedAtLabel(row.captured_at),
    totalCount: row.item_count > 0 ? row.item_count : items.length,
    topThree: items.slice(0, 3).map((item) => ({
      rank: item.rank,
      fullName: item.fullName,
      summaryKo: item.summaryKo,
    })),
    items,
  };
}

async function fetchSnapshotRow(
  client: ReturnType<typeof createSnapshotQueryClient>,
  snapshotDate?: string,
): Promise<SnapshotQueryRow | null> {
  if (!client) {
    return null;
  }

  const query = client
    .from("trending_snapshots")
    .select(SNAPSHOT_SELECT)
    .eq("status", "success");

  if (snapshotDate) {
    const { data, error } = await query
      .eq("snapshot_date", snapshotDate)
      .maybeSingle<SnapshotQueryRow>();

    if (error) {
      throw new Error(`Failed to load snapshot ${snapshotDate}: ${error.message}`);
    }

    return data;
  }

  const { data, error } = await query
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle<SnapshotQueryRow>();

  if (error) {
    throw new Error(`Failed to load latest snapshot page data: ${error.message}`);
  }

  return data;
}

export async function getLatestSnapshotPageData(): Promise<SnapshotPageData | null> {
  const startedAt = getDiagnosticNow();
  const client = createSnapshotQueryClient();

  if (!client) {
    return null;
  }

  const latestSnapshot = await fetchSnapshotRow(client);

  if (!latestSnapshot) {
    return null;
  }

  const previousSnapshotDate = getPreviousSnapshotDate(latestSnapshot.snapshot_date);
  const previousSnapshot = previousSnapshotDate
    ? await fetchSnapshotRow(client, previousSnapshotDate)
    : null;
  const result = mapSnapshotRow(
    latestSnapshot,
    previousSnapshot ? getRepositoryNames(previousSnapshot) : null,
  );

  logSnapshotDiagnostic("query", {
    name: "getLatestSnapshotPageData",
    durationMs: roundDuration(getDiagnosticNow() - startedAt),
    itemCount: result?.items.length ?? 0,
    snapshotDate: result?.snapshotDate ?? null,
  });

  return result;
}

export async function getSnapshotPageDataByDate(
  snapshotDate: string,
): Promise<SnapshotPageData | null> {
  const startedAt = getDiagnosticNow();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
    return null;
  }

  const client = createSnapshotQueryClient();

  if (!client) {
    return null;
  }

  const snapshot = await fetchSnapshotRow(client, snapshotDate);
  const result = mapSnapshotRow(snapshot);

  logSnapshotDiagnostic("query", {
    name: "getSnapshotPageDataByDate",
    durationMs: roundDuration(getDiagnosticNow() - startedAt),
    itemCount: result?.items.length ?? 0,
    snapshotDate,
  });

  return result;
}

export async function getSnapshotArchiveDates(): Promise<string[]> {
  const startedAt = getDiagnosticNow();
  const now = Date.now();

  if (snapshotArchiveDatesCache && snapshotArchiveDatesCache.expiresAt > now) {
    logSnapshotDiagnostic("query", {
      name: "getSnapshotArchiveDates",
      durationMs: roundDuration(getDiagnosticNow() - startedAt),
      dateCount: snapshotArchiveDatesCache.value.length,
      cacheStatus: "hit",
    });

    return snapshotArchiveDatesCache.value;
  }

  if (snapshotArchiveDatesPendingPromise) {
    const result = await snapshotArchiveDatesPendingPromise;

    logSnapshotDiagnostic("query", {
      name: "getSnapshotArchiveDates",
      durationMs: roundDuration(getDiagnosticNow() - startedAt),
      dateCount: result.length,
      cacheStatus: "pending-hit",
    });

    return result;
  }

  const client = createSnapshotQueryClient();

  if (!client) {
    return [];
  }

  snapshotArchiveDatesPendingPromise = (async () => {
    try {
      const { data, error } = await client
        .from("trending_snapshots")
        .select("snapshot_date")
        .eq("status", "success")
        .order("snapshot_date", { ascending: false });

      if (error) {
        throw new Error(`Failed to load snapshot archive dates: ${error.message}`);
      }

      const result = Array.from(
        new Set(
          ((data ?? []) as SnapshotDateRow[]).map((row) => row.snapshot_date),
        ),
      );

      snapshotArchiveDatesCache = {
        expiresAt: Date.now() + SNAPSHOT_ARCHIVE_DATES_TTL_MS,
        value: result,
      };

      return result;
    } finally {
      snapshotArchiveDatesPendingPromise = null;
    }
  })();

  const result = await snapshotArchiveDatesPendingPromise;

  logSnapshotDiagnostic("query", {
    name: "getSnapshotArchiveDates",
    durationMs: roundDuration(getDiagnosticNow() - startedAt),
    dateCount: result.length,
    cacheStatus: "miss",
  });

  return result;
}
