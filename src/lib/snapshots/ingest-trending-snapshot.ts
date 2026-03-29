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

interface StoredRepositoryReference {
  id: string;
}

export interface IngestTrendingSnapshotStore {
  getSuccessfulSnapshotByDate(snapshotDate: string): Promise<SnapshotReference | null>;
  createRunningSnapshot(input: {
    snapshotDate: string;
    capturedAt: Date;
  }): Promise<SnapshotReference>;
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
  now?: Date;
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

function createSupabaseSnapshotStore(
  client: SupabaseClient,
): IngestTrendingSnapshotStore {
  return {
    async getSuccessfulSnapshotByDate(snapshotDate) {
      const { data, error } = await client
        .from("trending_snapshots")
        .select("id")
        .eq("snapshot_date", snapshotDate)
        .eq("status", "success")
        .maybeSingle<{ id: string }>();

      if (error) {
        throw new Error(`Failed to load snapshot for ${snapshotDate}: ${error.message}`);
      }

      return data;
    },
    async createRunningSnapshot(input) {
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
        throw new Error(`Failed to create running snapshot: ${error.message}`);
      }

      return data;
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
  const existingSnapshot = await dependencies.store.getSuccessfulSnapshotByDate(
    dependencies.targetDate,
  );

  if (existingSnapshot) {
    return {
      snapshotId: existingSnapshot.id,
      status: "skipped",
      itemCount: 0,
      items: [],
    };
  }

  const snapshot = await dependencies.store.createRunningSnapshot({
    snapshotDate: dependencies.targetDate,
    capturedAt: dependencies.now ?? new Date(),
  });

  try {
    const seeds = await dependencies.fetchTrendingSeeds();
    const items: IngestTrendingSnapshotResultItem[] = [];

    for (const seed of seeds) {
      const repository = await dependencies.fetchRepository(seed.owner, seed.name);

      if (!repository) {
        continue;
      }

      const readme = await dependencies.fetchReadme(seed.owner, seed.name);
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
          snapshotId: snapshot.id,
          repositoryId: storedRepository.id,
          seed,
          repository,
          readme,
          summaryKo,
        }),
      );

      items.push({
        rank: seed.rank,
        repositoryId: storedRepository.id,
        summaryKo: summaryKo.trim(),
      });
    }

    await dependencies.store.markSnapshotSuccess(snapshot.id, items.length);

    return {
      snapshotId: snapshot.id,
      status: "created",
      itemCount: items.length,
      items,
    };
  } catch (error) {
    await dependencies.store.markSnapshotFailed(snapshot.id);
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
