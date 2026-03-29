import type { SupabaseClient } from "@supabase/supabase-js";

import { loadServerEnv } from "@/lib/env";
import { fetchReadme } from "@/lib/github/fetch-readme";
import { fetchRepository } from "@/lib/github/fetch-repository";
import { fetchTrendingHtml } from "@/lib/github/fetch-trending-html";
import { parseTrendingRepositories } from "@/lib/github/parse-trending";
import {
  serializeRepositoryForUpsert,
  serializeSnapshotItemForInsert,
  type RepositoryUpsertPayload,
  type SnapshotItemInsertPayload,
} from "@/lib/snapshots/serializers";
import type {
  RepositoryMetadata,
  TrendingRepositorySeed,
} from "@/lib/snapshots/types";
import { createOpenAISummaryClient } from "@/lib/summaries/summary-client";
import { generateKoreanSummary } from "@/lib/summaries/generate-korean-summary";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDateUtc } from "@/lib/time";

interface SnapshotReference {
  id: string;
}

type SnapshotStatus = "running" | "success" | "failed";

interface SnapshotState extends SnapshotReference {
  status: SnapshotStatus;
  captured_at?: string | null;
}

interface StoredRepositoryReference {
  id: string;
}

export type PrepareSnapshotRunResult =
  | {
      kind: "ready";
      snapshotId: string;
    }
  | {
      kind: "skipped";
      snapshotId: string;
      reason: "running" | "success";
    };

export interface IngestTrendingSnapshotStore {
  prepareSnapshotRun(input: {
    snapshotDate: string;
    capturedAt: Date;
  }): Promise<PrepareSnapshotRunResult>;
  heartbeatSnapshot?: (snapshotId: string, capturedAt: Date) => Promise<void>;
  upsertRepository(payload: RepositoryUpsertPayload): Promise<StoredRepositoryReference>;
  insertSnapshotItem(payload: SnapshotItemInsertPayload): Promise<void>;
  markSnapshotSuccess(snapshotId: string, itemCount: number): Promise<void>;
  markSnapshotFailed(snapshotId: string): Promise<void>;
}

export interface IngestTrendingSnapshotDependencies {
  targetDate: string;
  fetchTrendingSeeds: () => Promise<TrendingRepositorySeed[]>;
  fetchRepository: (
    owner: string,
    repo: string,
  ) => Promise<RepositoryMetadata | null>;
  fetchReadme: (owner: string, repo: string) => Promise<string | null>;
  summarize: (input: {
    fullName: string;
    description: string | null;
    readme: string | null;
  }) => Promise<string>;
  store: IngestTrendingSnapshotStore;
  now?: Date | (() => Date);
}

export interface IngestTrendingSnapshotResultItem {
  rank: number;
  repositoryId: string;
  summaryKo: string;
}

export interface IngestTrendingSnapshotResult {
  snapshotId: string;
  status: "created" | "skipped";
  itemCount: number;
  items: IngestTrendingSnapshotResultItem[];
}

function resolveNow(now: IngestTrendingSnapshotDependencies["now"]): Date {
  if (typeof now === "function") {
    return now();
  }

  return now ?? new Date();
}

function isUniqueSnapshotDateViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

const RUNNING_SNAPSHOT_LEASE_MS = 15 * 60 * 1000;

export function createSupabaseSnapshotStore(
  client: SupabaseClient,
): IngestTrendingSnapshotStore {
  async function getSnapshotByDate(snapshotDate: string): Promise<SnapshotState | null> {
    const { data, error } = await client
      .from("trending_snapshots")
      .select("id, status, captured_at")
      .eq("snapshot_date", snapshotDate)
      .maybeSingle<SnapshotState>();

    if (error) {
      throw new Error(`Failed to load snapshot for ${snapshotDate}: ${error.message}`);
    }

    return data;
  }

  async function getSnapshotById(snapshotId: string): Promise<SnapshotState | null> {
    const { data, error } = await client
      .from("trending_snapshots")
      .select("id, status, captured_at")
      .eq("id", snapshotId)
      .maybeSingle<SnapshotState>();

    if (error) {
      throw new Error(`Failed to reload snapshot ${snapshotId}: ${error.message}`);
    }

    return data;
  }

  function isSnapshotStale(snapshot: SnapshotState, capturedAt: Date): boolean {
    const snapshotCapturedAt = snapshot.captured_at ? Date.parse(snapshot.captured_at) : Number.NaN;

    if (Number.isNaN(snapshotCapturedAt)) {
      return true;
    }

    return capturedAt.getTime() - snapshotCapturedAt >= RUNNING_SNAPSHOT_LEASE_MS;
  }

  async function restartFailedSnapshot(input: {
    snapshotId: string;
    capturedAt: Date;
  }): Promise<PrepareSnapshotRunResult> {
    const { data, error } = await client
      .from("trending_snapshots")
      .update({
        status: "running",
        item_count: 0,
        captured_at: input.capturedAt.toISOString(),
      })
      .eq("id", input.snapshotId)
      .eq("status", "failed")
      .select("id, status, captured_at")
      .maybeSingle<SnapshotState>();

    if (error) {
      throw new Error(`Failed to reset snapshot ${input.snapshotId}: ${error.message}`);
    }

    if (!data) {
      const currentSnapshot = await getSnapshotById(input.snapshotId);

      if (!currentSnapshot) {
        throw new Error(`Snapshot ${input.snapshotId} disappeared during reset`);
      }

      if (currentSnapshot.status === "failed") {
        throw new Error(`Snapshot ${input.snapshotId} could not be reset from failed state`);
      }

      return {
        kind: "skipped",
        snapshotId: currentSnapshot.id,
        reason: currentSnapshot.status,
      };
    }

    const { error: deleteError } = await client
      .from("trending_snapshot_items")
      .delete()
      .eq("snapshot_id", input.snapshotId);

    if (deleteError) {
      const revertResult = await client
        .from("trending_snapshots")
        .update({
          status: "failed",
        })
        .eq("id", input.snapshotId)
        .eq("status", "running")
        .select("id, status, captured_at")
        .maybeSingle<SnapshotState>();

      if (revertResult.error) {
        throw new Error(
          `Failed to clear snapshot items for ${input.snapshotId}: ${deleteError.message}; failed to revert snapshot: ${revertResult.error.message}`,
        );
      }

      throw new Error(
        `Failed to clear snapshot items for ${input.snapshotId}: ${deleteError.message}`,
      );
    }

    return {
      kind: "ready",
      snapshotId: data.id,
    };
  }

  async function reclaimStaleRunningSnapshot(input: {
    snapshot: SnapshotState;
    capturedAt: Date;
  }): Promise<PrepareSnapshotRunResult> {
    const previousCapturedAt = input.snapshot.captured_at;
    const { data, error } = await client
      .from("trending_snapshots")
      .update({
        status: "running",
        item_count: 0,
        captured_at: input.capturedAt.toISOString(),
      })
      .eq("id", input.snapshot.id)
      .eq("status", "running")
      .eq("captured_at", previousCapturedAt)
      .select("id, status, captured_at")
      .maybeSingle<SnapshotState>();

    if (error) {
      throw new Error(`Failed to reclaim stale snapshot ${input.snapshot.id}: ${error.message}`);
    }

    if (!data) {
      const currentSnapshot = await getSnapshotById(input.snapshot.id);

      if (!currentSnapshot) {
        throw new Error(`Snapshot ${input.snapshot.id} disappeared during stale-run recovery`);
      }

      if (currentSnapshot.status === "failed") {
        return restartFailedSnapshot({
          snapshotId: currentSnapshot.id,
          capturedAt: input.capturedAt,
        });
      }

      return {
        kind: "skipped",
        snapshotId: currentSnapshot.id,
        reason: currentSnapshot.status,
      };
    }

    const { error: deleteError } = await client
      .from("trending_snapshot_items")
      .delete()
      .eq("snapshot_id", input.snapshot.id);

    if (deleteError) {
      const revertResult = await client
        .from("trending_snapshots")
        .update({
          status: "failed",
        })
        .eq("id", input.snapshot.id)
        .eq("status", "running")
        .select("id, status, captured_at")
        .maybeSingle<SnapshotState>();

      if (revertResult.error) {
        throw new Error(
          `Failed to clear snapshot items for ${input.snapshot.id}: ${deleteError.message}; failed to revert snapshot: ${revertResult.error.message}`,
        );
      }

      throw new Error(
        `Failed to clear snapshot items for ${input.snapshot.id}: ${deleteError.message}`,
      );
    }

    return {
      kind: "ready",
      snapshotId: data.id,
    };
  }

  return {
    async prepareSnapshotRun(input) {
      const existingSnapshot = await getSnapshotByDate(input.snapshotDate);

      if (existingSnapshot?.status === "success") {
        return {
          kind: "skipped",
          snapshotId: existingSnapshot.id,
          reason: existingSnapshot.status,
        };
      }

      if (existingSnapshot?.status === "running") {
        if (!isSnapshotStale(existingSnapshot, input.capturedAt)) {
          return {
            kind: "skipped",
            snapshotId: existingSnapshot.id,
            reason: existingSnapshot.status,
          };
        }

        return reclaimStaleRunningSnapshot({
          snapshot: existingSnapshot,
          capturedAt: input.capturedAt,
        });
      }

      if (existingSnapshot?.status === "failed") {
        return restartFailedSnapshot({
          snapshotId: existingSnapshot.id,
          capturedAt: input.capturedAt,
        });
      }

      const { data, error } = await client
        .from("trending_snapshots")
        .insert({
          snapshot_date: input.snapshotDate,
          captured_at: input.capturedAt.toISOString(),
          status: "running",
        })
        .select("id")
        .single<{ id: string }>();

      if (error) {
        if (isUniqueSnapshotDateViolation(error)) {
          const duplicateSnapshot = await getSnapshotByDate(input.snapshotDate);

          if (!duplicateSnapshot) {
            throw new Error(
              `Snapshot for ${input.snapshotDate} already exists but could not be reloaded`,
            );
          }

          if (duplicateSnapshot.status === "failed") {
            return restartFailedSnapshot({
              snapshotId: duplicateSnapshot.id,
              capturedAt: input.capturedAt,
            });
          }

          if (
            duplicateSnapshot.status === "running" &&
            isSnapshotStale(duplicateSnapshot, input.capturedAt)
          ) {
            return reclaimStaleRunningSnapshot({
              snapshot: duplicateSnapshot,
              capturedAt: input.capturedAt,
            });
          }

          return {
            kind: "skipped",
            snapshotId: duplicateSnapshot.id,
            reason: duplicateSnapshot.status,
          };
        }

        throw new Error(`Failed to create running snapshot: ${error.message}`);
      }

      return {
        kind: "ready",
        snapshotId: data.id,
      };
    },
    async upsertRepository(payload) {
      const { data, error } = await client
        .from("repositories")
        .upsert(
          {
            github_repo_id: payload.githubRepoId,
            owner: payload.owner,
            name: payload.name,
            full_name: payload.fullName,
            github_url: payload.githubUrl,
            description: payload.description,
            primary_language: payload.primaryLanguage,
            stars_total: payload.starsTotal,
            forks_total: payload.forksTotal,
            default_branch: payload.defaultBranch,
            avatar_url: payload.avatarUrl,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "github_repo_id",
          },
        )
        .select("id")
        .single<{ id: string }>();

      if (error) {
        throw new Error(`Failed to upsert repository ${payload.fullName}: ${error.message}`);
      }

      return data;
    },
    async heartbeatSnapshot(snapshotId, capturedAt) {
      const { data, error } = await client
        .from("trending_snapshots")
        .update({
          captured_at: capturedAt.toISOString(),
        })
        .eq("id", snapshotId)
        .eq("status", "running")
        .select("id, status, captured_at")
        .maybeSingle<SnapshotState>();

      if (error) {
        throw new Error(`Failed to heartbeat snapshot ${snapshotId}: ${error.message}`);
      }

      if (!data) {
        throw new Error(`Snapshot ${snapshotId} is no longer running for heartbeat`);
      }
    },
    async insertSnapshotItem(payload) {
      const { error } = await client.from("trending_snapshot_items").insert({
        snapshot_id: payload.snapshotId,
        repository_id: payload.repositoryId,
        rank: payload.rank,
        stars_today: payload.starsToday,
        repo_description_snapshot: payload.repoDescriptionSnapshot,
        readme_excerpt: payload.readmeExcerpt,
        summary_ko: payload.summaryKo,
      });

      if (error) {
        throw new Error(
          `Failed to insert snapshot item for repository ${payload.repositoryId}: ${error.message}`,
        );
      }
    },
    async markSnapshotSuccess(snapshotId, itemCount) {
      const { error } = await client
        .from("trending_snapshots")
        .update({
          status: "success",
          item_count: itemCount,
        })
        .eq("id", snapshotId);

      if (error) {
        throw new Error(`Failed to mark snapshot ${snapshotId} successful: ${error.message}`);
      }
    },
    async markSnapshotFailed(snapshotId) {
      const { error } = await client
        .from("trending_snapshots")
        .update({
          status: "failed",
        })
        .eq("id", snapshotId);

      if (error) {
        throw new Error(`Failed to mark snapshot ${snapshotId} failed: ${error.message}`);
      }
    },
  };
}

export async function ingestTrendingSnapshot(
  dependencies: IngestTrendingSnapshotDependencies,
): Promise<IngestTrendingSnapshotResult> {
  const snapshotRun = await dependencies.store.prepareSnapshotRun({
    snapshotDate: dependencies.targetDate,
    capturedAt: resolveNow(dependencies.now),
  });

  if (snapshotRun.kind === "skipped") {
    return {
      snapshotId: snapshotRun.snapshotId,
      status: "skipped",
      itemCount: 0,
      items: [],
    };
  }

  try {
    await dependencies.store.heartbeatSnapshot?.(
      snapshotRun.snapshotId,
      resolveNow(dependencies.now),
    );

    const seeds = await dependencies.fetchTrendingSeeds();
    const items: IngestTrendingSnapshotResultItem[] = [];

    for (const seed of seeds) {
      const repository = await dependencies.fetchRepository(seed.owner, seed.name);

      if (!repository) {
        continue;
      }

      let readme: string | null;
      try {
        readme = await dependencies.fetchReadme(seed.owner, seed.name);
      } catch {
        readme = null;
      }
      const summaryKo = await dependencies.summarize({
        fullName: seed.fullName,
        description: repository.description,
        readme,
      });
      const storedRepository = await dependencies.store.upsertRepository(
        serializeRepositoryForUpsert(seed, repository),
      );

      await dependencies.store.insertSnapshotItem(
        serializeSnapshotItemForInsert({
          snapshotId: snapshotRun.snapshotId,
          repositoryId: storedRepository.id,
          seed,
          repository,
          readme,
          summaryKo,
        }),
      );

      await dependencies.store.heartbeatSnapshot?.(
        snapshotRun.snapshotId,
        resolveNow(dependencies.now),
      );

      items.push({
        rank: seed.rank,
        repositoryId: storedRepository.id,
        summaryKo: summaryKo.trim(),
      });
    }

    if (items.length === 0) {
      throw new Error("Trending snapshot produced no persisted items");
    }

    await dependencies.store.markSnapshotSuccess(snapshotRun.snapshotId, items.length);

    return {
      snapshotId: snapshotRun.snapshotId,
      status: "created",
      itemCount: items.length,
      items,
    };
  } catch (error) {
    await dependencies.store.markSnapshotFailed(snapshotRun.snapshotId);
    throw error;
  }
}

export async function runDailyTrendingIngestion(options: {
  processEnv?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  now?: Date;
} = {}): Promise<IngestTrendingSnapshotResult> {
  const env = loadServerEnv(options.processEnv);
  const fetchImpl = options.fetchImpl ?? fetch;
  const summaryClient = createOpenAISummaryClient({
    processEnv: options.processEnv,
  });
  const store = createSupabaseSnapshotStore(
    createSupabaseAdminClient(options.processEnv),
  );

  return ingestTrendingSnapshot({
    targetDate: formatDateUtc(options.now ?? new Date()),
    now: options.now,
    fetchTrendingSeeds: async () => {
      const html = await fetchTrendingHtml(fetchImpl, env.GITHUB_TOKEN);

      if (!html) {
        throw new Error("Failed to fetch GitHub Trending HTML");
      }

      return parseTrendingRepositories(html);
    },
    fetchRepository: (owner, repo) =>
      fetchRepository(owner, repo, fetchImpl, env.GITHUB_TOKEN),
    fetchReadme: (owner, repo) => fetchReadme(owner, repo, fetchImpl, env.GITHUB_TOKEN),
    summarize: (input) => generateKoreanSummary(summaryClient, input),
    store,
  });
}
