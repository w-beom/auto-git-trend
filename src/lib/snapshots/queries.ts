import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface SnapshotItemQueryRow {
  rank: number;
  stars_today: number | null;
  repo_description_snapshot: string | null;
  readme_excerpt: string | null;
  summary_ko: string;
  repository: RepositoryQueryRow | null;
}

interface RepositoryQueryRow {
  owner: string;
  name: string;
  full_name: string;
  github_url: string;
  description: string | null;
  primary_language: string | null;
  stars_total: number | null;
  forks_total: number | null;
  avatar_url: string | null;
}

interface SnapshotQueryRow {
  snapshot_date: string;
  captured_at: string;
  item_count: number;
  trending_snapshot_items: SnapshotItemQueryRow[] | null;
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
    stars_today,
    repo_description_snapshot,
    readme_excerpt,
    summary_ko,
    repository:repositories (
      owner,
      name,
      full_name,
      github_url,
      description,
      primary_language,
      stars_total,
      forks_total,
      avatar_url
    )
  )
`;

function createSnapshotQueryClient() {
  try {
    return createSupabaseAdminClient();
  } catch (error) {
    // Page routes should fall back safely when build/test environments omit runtime secrets.
    if (
      error instanceof Error &&
      error.message.startsWith("Invalid server environment:")
    ) {
      return null;
    }

    throw error;
  }
}

function formatCapturedAtLabel(capturedAtIso: string): string {
  const capturedAt = new Date(capturedAtIso);

  if (Number.isNaN(capturedAt.getTime())) {
    return `Captured ${capturedAtIso}`;
  }

  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(capturedAt);

  return `Captured ${formatted} UTC`;
}

function mapSnapshotRow(row: SnapshotQueryRow | null): SnapshotPageData | null {
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
      description: item.repo_description_snapshot ?? item.repository.description,
      readmeExcerpt: item.readme_excerpt,
      primaryLanguage: item.repository.primary_language,
      starsToday: item.stars_today,
      starsTotal: item.repository.stars_total,
      forksTotal: item.repository.forks_total,
      avatarUrl: item.repository.avatar_url,
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

export async function getLatestSnapshotPageData(): Promise<SnapshotPageData | null> {
  const client = createSnapshotQueryClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("trending_snapshots")
    .select(SNAPSHOT_SELECT)
    .eq("status", "success")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle<SnapshotQueryRow>();

  if (error) {
    throw new Error(`Failed to load latest snapshot page data: ${error.message}`);
  }

  return mapSnapshotRow(data);
}

export async function getSnapshotPageDataByDate(
  snapshotDate: string,
): Promise<SnapshotPageData | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
    return null;
  }

  const client = createSnapshotQueryClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("trending_snapshots")
    .select(SNAPSHOT_SELECT)
    .eq("status", "success")
    .eq("snapshot_date", snapshotDate)
    .maybeSingle<SnapshotQueryRow>();

  if (error) {
    throw new Error(`Failed to load snapshot ${snapshotDate}: ${error.message}`);
  }

  return mapSnapshotRow(data);
}
