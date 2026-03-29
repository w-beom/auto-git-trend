import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import {
  createSupabaseSnapshotStore,
  ingestTrendingSnapshot,
} from "@/lib/snapshots/ingest-trending-snapshot";
import type {
  RepositoryMetadata,
  TrendingRepositorySeed,
} from "@/lib/snapshots/types";

function buildSeed(
  overrides: Partial<TrendingRepositorySeed> = {},
): TrendingRepositorySeed {
  return {
    rank: 1,
    owner: "acme",
    name: "rocket",
    fullName: "acme/rocket",
    repositoryPath: "acme/rocket",
    starsToday: 120,
    ...overrides,
  };
}

function buildRepository(
  overrides: Partial<RepositoryMetadata> = {},
): RepositoryMetadata {
  return {
    githubRepoId: 101,
    description: "A fast launch platform.",
    primaryLanguage: "TypeScript",
    starsTotal: 4200,
    forksTotal: 210,
    defaultBranch: "main",
    avatarUrl: "https://example.com/avatar.png",
    githubUrl: "https://github.com/acme/rocket",
    ...overrides,
  };
}

function createSupabaseClientDouble(handlers: {
  selectMaybeSingle?: (input: {
    table: string;
    columns: string;
    filters: Array<[string, unknown]>;
  }) => Promise<{ data: unknown; error: { message: string } | null }>;
  insertSingle?: (input: {
    table: string;
    payload: Record<string, unknown>;
    columns: string;
  }) => Promise<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
  updateMaybeSingle?: (input: {
    table: string;
    payload: Record<string, unknown>;
    columns: string;
    filters: Array<[string, unknown]>;
  }) => Promise<{ data: unknown; error: { message: string } | null }>;
  deleteEq?: (input: {
    table: string;
    filters: Array<[string, unknown]>;
  }) => Promise<{ error: { message: string } | null }>;
}): SupabaseClient {
  return {
    from(table: string) {
      return {
        select(columns: string) {
          const filters: Array<[string, unknown]> = [];
          return {
            eq(field: string, value: unknown) {
              filters.push([field, value]);
              return this;
            },
            maybeSingle() {
              if (!handlers.selectMaybeSingle) {
                throw new Error("selectMaybeSingle handler not configured");
              }

              return handlers.selectMaybeSingle({
                table,
                columns,
                filters,
              });
            },
          };
        },
        insert(payload: Record<string, unknown>) {
          return {
            select(columns: string) {
              return {
                single() {
                  if (!handlers.insertSingle) {
                    throw new Error("insertSingle handler not configured");
                  }

                  return handlers.insertSingle({
                    table,
                    payload,
                    columns,
                  });
                },
              };
            },
          };
        },
        update(payload: Record<string, unknown>) {
          const filters: Array<[string, unknown]> = [];

          return {
            eq(field: string, value: unknown) {
              filters.push([field, value]);
              return this;
            },
            select(columns: string) {
              return {
                maybeSingle() {
                  if (!handlers.updateMaybeSingle) {
                    throw new Error("updateMaybeSingle handler not configured");
                  }

                  return handlers.updateMaybeSingle({
                    table,
                    payload,
                    columns,
                    filters,
                  });
                },
              };
            },
          };
        },
        delete() {
          const filters: Array<[string, unknown]> = [];

          return {
            eq(field: string, value: unknown) {
              filters.push([field, value]);

              if (!handlers.deleteEq) {
                throw new Error("deleteEq handler not configured");
              }

              return handlers.deleteEq({
                table,
                filters,
              });
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

describe("ingestTrendingSnapshot", () => {
  it("stores ranked items, falls back when README is missing, and preserves seed rank", async () => {
    const seeds = [
      buildSeed({
        rank: 2,
        owner: "beta",
        name: "orbit",
        fullName: "beta/orbit",
        repositoryPath: "beta/orbit",
        starsToday: 95,
      }),
      buildSeed(),
    ];
    const repositories = new Map<string, RepositoryMetadata>([
      ["beta/orbit", buildRepository({
        githubRepoId: 202,
        description: "Orbit control center.",
        githubUrl: "https://github.com/beta/orbit",
      })],
      ["acme/rocket", buildRepository()],
    ]);
    const prepareSnapshotRun = vi.fn().mockResolvedValue({
      kind: "ready",
      snapshotId: "snapshot-1",
    });
    const upsertRepository = vi
      .fn()
      .mockResolvedValueOnce({ id: "repo-beta" })
      .mockResolvedValueOnce({ id: "repo-acme" });
    const insertSnapshotItem = vi.fn().mockResolvedValue(undefined);
    const markSnapshotSuccess = vi.fn().mockResolvedValue(undefined);
    const markSnapshotFailed = vi.fn().mockResolvedValue(undefined);
    const summarize = vi
      .fn()
      .mockImplementation(
        async ({
          fullName,
          description,
          readme,
        }: {
          fullName: string;
          description: string | null;
          readme: string | null;
        }) => `요약:${fullName}:${description ?? "없음"}:${readme ?? "없음"}`,
      );

    const result = await ingestTrendingSnapshot({
      targetDate: "2026-03-29",
      fetchTrendingSeeds: async () => seeds,
      fetchRepository: async (owner, name) => repositories.get(`${owner}/${name}`) ?? null,
      fetchReadme: async (owner, name) =>
        owner === "beta" && name === "orbit" ? null : "# Rocket\nLaunch docs",
      summarize,
      store: {
        prepareSnapshotRun,
        upsertRepository,
        insertSnapshotItem,
        markSnapshotSuccess,
        markSnapshotFailed,
      },
    });

    expect(result).toEqual({
      snapshotId: "snapshot-1",
      status: "created",
      itemCount: 2,
      items: [
        {
          rank: 2,
          repositoryId: "repo-beta",
          summaryKo: "요약:beta/orbit:Orbit control center.:없음",
        },
        {
          rank: 1,
          repositoryId: "repo-acme",
          summaryKo: "요약:acme/rocket:A fast launch platform.:# Rocket\nLaunch docs",
        },
      ],
    });
    expect(prepareSnapshotRun).toHaveBeenCalledWith({
      capturedAt: expect.any(Date),
      snapshotDate: "2026-03-29",
    });
    expect(summarize).toHaveBeenNthCalledWith(1, {
      fullName: "beta/orbit",
      description: "Orbit control center.",
      readme: null,
    });
    expect(insertSnapshotItem).toHaveBeenNthCalledWith(1, {
      snapshotId: "snapshot-1",
      repositoryId: "repo-beta",
      rank: 2,
      starsToday: 95,
      repoDescriptionSnapshot: "Orbit control center.",
      readmeExcerpt: null,
      summaryKo: "요약:beta/orbit:Orbit control center.:없음",
    });
    expect(insertSnapshotItem).toHaveBeenNthCalledWith(2, {
      snapshotId: "snapshot-1",
      repositoryId: "repo-acme",
      rank: 1,
      starsToday: 120,
      repoDescriptionSnapshot: "A fast launch platform.",
      readmeExcerpt: "# Rocket\nLaunch docs",
      summaryKo: "요약:acme/rocket:A fast launch platform.:# Rocket\nLaunch docs",
    });
    expect(markSnapshotSuccess).toHaveBeenCalledWith("snapshot-1", 2);
    expect(markSnapshotFailed).not.toHaveBeenCalled();
  });

  it("returns early when a successful snapshot already exists for the date", async () => {
    const fetchTrendingSeeds = vi.fn();

    const result = await ingestTrendingSnapshot({
      targetDate: "2026-03-29",
      fetchTrendingSeeds,
      fetchRepository: vi.fn(),
      fetchReadme: vi.fn(),
      summarize: vi.fn(),
      store: {
        prepareSnapshotRun: vi.fn().mockResolvedValue({
          kind: "skipped",
          reason: "success",
          snapshotId: "snapshot-existing",
        }),
        upsertRepository: vi.fn(),
        insertSnapshotItem: vi.fn(),
        markSnapshotSuccess: vi.fn(),
        markSnapshotFailed: vi.fn(),
      },
    });

    expect(result).toEqual({
      snapshotId: "snapshot-existing",
      status: "skipped",
      itemCount: 0,
      items: [],
    });
    expect(fetchTrendingSeeds).not.toHaveBeenCalled();
  });

  it("returns early when a snapshot for the date is already running", async () => {
    const fetchTrendingSeeds = vi.fn();

    const result = await ingestTrendingSnapshot({
      targetDate: "2026-03-29",
      fetchTrendingSeeds,
      fetchRepository: vi.fn(),
      fetchReadme: vi.fn(),
      summarize: vi.fn(),
      store: {
        prepareSnapshotRun: vi.fn().mockResolvedValue({
          kind: "skipped",
          reason: "running",
          snapshotId: "snapshot-running",
        }),
        upsertRepository: vi.fn(),
        insertSnapshotItem: vi.fn(),
        markSnapshotSuccess: vi.fn(),
        markSnapshotFailed: vi.fn(),
      },
    });

    expect(result).toEqual({
      snapshotId: "snapshot-running",
      status: "skipped",
      itemCount: 0,
      items: [],
    });
    expect(fetchTrendingSeeds).not.toHaveBeenCalled();
  });

  it("marks the snapshot failed instead of succeeding when no seeds are available", async () => {
    const markSnapshotSuccess = vi.fn().mockResolvedValue(undefined);
    const markSnapshotFailed = vi.fn().mockResolvedValue(undefined);

    await expect(
      ingestTrendingSnapshot({
        targetDate: "2026-03-29",
        fetchTrendingSeeds: async () => [],
        fetchRepository: vi.fn(),
        fetchReadme: vi.fn(),
        summarize: vi.fn(),
        store: {
          prepareSnapshotRun: vi.fn().mockResolvedValue({
            kind: "ready",
            snapshotId: "snapshot-empty",
          }),
          upsertRepository: vi.fn(),
          insertSnapshotItem: vi.fn(),
          markSnapshotSuccess,
          markSnapshotFailed,
        },
      }),
    ).rejects.toThrow("Trending snapshot produced no persisted items");

    expect(markSnapshotSuccess).not.toHaveBeenCalled();
    expect(markSnapshotFailed).toHaveBeenCalledWith("snapshot-empty");
  });

  it("marks the snapshot failed instead of succeeding when every candidate is skipped", async () => {
    const markSnapshotSuccess = vi.fn().mockResolvedValue(undefined);
    const markSnapshotFailed = vi.fn().mockResolvedValue(undefined);

    await expect(
      ingestTrendingSnapshot({
        targetDate: "2026-03-29",
        fetchTrendingSeeds: async () => [buildSeed()],
        fetchRepository: async () => null,
        fetchReadme: vi.fn(),
        summarize: vi.fn(),
        store: {
          prepareSnapshotRun: vi.fn().mockResolvedValue({
            kind: "ready",
            snapshotId: "snapshot-skipped",
          }),
          upsertRepository: vi.fn(),
          insertSnapshotItem: vi.fn(),
          markSnapshotSuccess,
          markSnapshotFailed,
        },
      }),
    ).rejects.toThrow("Trending snapshot produced no persisted items");

    expect(markSnapshotSuccess).not.toHaveBeenCalled();
    expect(markSnapshotFailed).toHaveBeenCalledWith("snapshot-skipped");
  });

  it("downgrades thrown README fetch errors to null and continues persisting the item", async () => {
    const insertSnapshotItem = vi.fn().mockResolvedValue(undefined);
    const markSnapshotSuccess = vi.fn().mockResolvedValue(undefined);
    const markSnapshotFailed = vi.fn().mockResolvedValue(undefined);
    const summarize = vi.fn().mockResolvedValue("README 없이도 요약");

    const result = await ingestTrendingSnapshot({
      targetDate: "2026-03-29",
      fetchTrendingSeeds: async () => [buildSeed()],
      fetchRepository: async () => buildRepository(),
      fetchReadme: async () => {
        throw new Error("readme boom");
      },
      summarize,
      store: {
        prepareSnapshotRun: vi.fn().mockResolvedValue({
          kind: "ready",
          snapshotId: "snapshot-readme-fallback",
        }),
        upsertRepository: vi.fn().mockResolvedValue({ id: "repo-1" }),
        insertSnapshotItem,
        markSnapshotSuccess,
        markSnapshotFailed,
      },
    });

    expect(result).toEqual({
      snapshotId: "snapshot-readme-fallback",
      status: "created",
      itemCount: 1,
      items: [
        {
          rank: 1,
          repositoryId: "repo-1",
          summaryKo: "README 없이도 요약",
        },
      ],
    });
    expect(summarize).toHaveBeenCalledWith({
      fullName: "acme/rocket",
      description: "A fast launch platform.",
      readme: null,
    });
    expect(insertSnapshotItem).toHaveBeenCalledWith({
      snapshotId: "snapshot-readme-fallback",
      repositoryId: "repo-1",
      rank: 1,
      starsToday: 120,
      repoDescriptionSnapshot: "A fast launch platform.",
      readmeExcerpt: null,
      summaryKo: "README 없이도 요약",
    });
    expect(markSnapshotSuccess).toHaveBeenCalledWith("snapshot-readme-fallback", 1);
    expect(markSnapshotFailed).not.toHaveBeenCalled();
  });

  it("refreshes the running snapshot lease after claiming and after persisted progress", async () => {
    const heartbeatSnapshot = vi.fn().mockResolvedValue(undefined);
    const timestamps = [
      new Date("2026-03-29T00:00:00.000Z"),
      new Date("2026-03-29T00:05:00.000Z"),
      new Date("2026-03-29T00:10:00.000Z"),
      new Date("2026-03-29T00:15:00.000Z"),
    ];
    let nowIndex = 0;

    const result = await ingestTrendingSnapshot({
      targetDate: "2026-03-29",
      now: () => timestamps[nowIndex++] ?? timestamps[timestamps.length - 1],
      fetchTrendingSeeds: async () => [
        buildSeed(),
        buildSeed({
          rank: 2,
          owner: "beta",
          name: "orbit",
          fullName: "beta/orbit",
          repositoryPath: "beta/orbit",
          starsToday: 95,
        }),
      ],
      fetchRepository: async (owner, name) =>
        owner === "beta" && name === "orbit"
          ? buildRepository({
              githubRepoId: 202,
              description: "Orbit control center.",
              githubUrl: "https://github.com/beta/orbit",
            })
          : buildRepository(),
      fetchReadme: async () => "# README",
      summarize: async ({ fullName }) => `요약:${fullName}`,
      store: {
        prepareSnapshotRun: vi.fn().mockResolvedValue({
          kind: "ready",
          snapshotId: "snapshot-heartbeat",
        }),
        heartbeatSnapshot,
        upsertRepository: vi
          .fn()
          .mockResolvedValueOnce({ id: "repo-1" })
          .mockResolvedValueOnce({ id: "repo-2" }),
        insertSnapshotItem: vi.fn().mockResolvedValue(undefined),
        markSnapshotSuccess: vi.fn().mockResolvedValue(undefined),
        markSnapshotFailed: vi.fn().mockResolvedValue(undefined),
      },
    });

    expect(result.itemCount).toBe(2);
    expect(heartbeatSnapshot).toHaveBeenNthCalledWith(
      1,
      "snapshot-heartbeat",
      new Date("2026-03-29T00:05:00.000Z"),
    );
    expect(heartbeatSnapshot).toHaveBeenNthCalledWith(
      2,
      "snapshot-heartbeat",
      new Date("2026-03-29T00:10:00.000Z"),
    );
    expect(heartbeatSnapshot).toHaveBeenNthCalledWith(
      3,
      "snapshot-heartbeat",
      new Date("2026-03-29T00:15:00.000Z"),
    );
  });
});

describe("createSupabaseSnapshotStore", () => {
  it("skips a fresh running snapshot without attempting recovery", async () => {
    const events: string[] = [];
    const store = createSupabaseSnapshotStore(
      createSupabaseClientDouble({
        selectMaybeSingle: async ({ table, filters }) => {
          events.push(`select:${table}:${JSON.stringify(filters)}`);

          return {
            data: {
              id: "snapshot-running",
              status: "running",
              captured_at: "2026-03-29T00:20:00.000Z",
            },
            error: null,
          };
        },
        updateMaybeSingle: async ({ table, payload, filters }) => {
          events.push(`update:${table}:${JSON.stringify(payload)}:${JSON.stringify(filters)}`);

          return {
            data: null,
            error: null,
          };
        },
      }),
    );

    const result = await store.prepareSnapshotRun({
      snapshotDate: "2026-03-29",
      capturedAt: new Date("2026-03-29T00:30:00.000Z"),
    });

    expect(result).toEqual({
      kind: "skipped",
      reason: "running",
      snapshotId: "snapshot-running",
    });
    expect(events).toEqual([
      'select:trending_snapshots:[["snapshot_date","2026-03-29"]]',
    ]);
  });

  it("reclaims a stale running snapshot and clears prior items", async () => {
    const events: string[] = [];
    const store = createSupabaseSnapshotStore(
      createSupabaseClientDouble({
        selectMaybeSingle: async ({ table, filters }) => {
          events.push(`select:${table}:${JSON.stringify(filters)}`);

          return {
            data: {
              id: "snapshot-running",
              status: "running",
              captured_at: "2026-03-29T00:00:00.000Z",
            },
            error: null,
          };
        },
        updateMaybeSingle: async ({ table, payload, filters }) => {
          events.push(`update:${table}:${JSON.stringify(payload)}:${JSON.stringify(filters)}`);

          return {
            data: {
              id: "snapshot-running",
              status: "running",
              captured_at: "2026-03-29T00:00:00.000Z",
            },
            error: null,
          };
        },
        deleteEq: async ({ table, filters }) => {
          events.push(`delete:${table}:${JSON.stringify(filters)}`);

          return {
            error: null,
          };
        },
      }),
    );

    const result = await store.prepareSnapshotRun({
      snapshotDate: "2026-03-29",
      capturedAt: new Date("2026-03-29T00:30:00.000Z"),
    });

    expect(result).toEqual({
      kind: "ready",
      snapshotId: "snapshot-running",
    });
    expect(events).toEqual([
      'select:trending_snapshots:[["snapshot_date","2026-03-29"]]',
      'update:trending_snapshots:{"status":"running","item_count":0,"captured_at":"2026-03-29T00:30:00.000Z"}:[["id","snapshot-running"],["status","running"],["captured_at","2026-03-29T00:00:00.000Z"]]',
      'delete:trending_snapshot_items:[["snapshot_id","snapshot-running"]]',
    ]);
  });

  it("reuses a failed snapshot by resetting it to running and clearing prior items", async () => {
    const events: string[] = [];
    const store = createSupabaseSnapshotStore(
      createSupabaseClientDouble({
        selectMaybeSingle: async ({ table, filters }) => {
          events.push(`select:${table}:${JSON.stringify(filters)}`);

          return {
            data: {
              id: "snapshot-failed",
              status: "failed",
            },
            error: null,
          };
        },
        updateMaybeSingle: async ({ table, payload, filters }) => {
          events.push(`update:${table}:${JSON.stringify(payload)}:${JSON.stringify(filters)}`);

          return {
            data: {
              id: "snapshot-failed",
            },
            error: null,
          };
        },
        deleteEq: async ({ table, filters }) => {
          events.push(`delete:${table}:${JSON.stringify(filters)}`);

          return {
            error: null,
          };
        },
      }),
    );

    const result = await store.prepareSnapshotRun({
      snapshotDate: "2026-03-29",
      capturedAt: new Date("2026-03-29T00:00:00.000Z"),
    });

    expect(result).toEqual({
      kind: "ready",
      snapshotId: "snapshot-failed",
    });
    expect(events).toEqual([
      'select:trending_snapshots:[["snapshot_date","2026-03-29"]]',
      'update:trending_snapshots:{"status":"running","item_count":0,"captured_at":"2026-03-29T00:00:00.000Z"}:[["id","snapshot-failed"],["status","failed"]]',
      'delete:trending_snapshot_items:[["snapshot_id","snapshot-failed"]]',
    ]);
  });

  it("reverts a claimed failed snapshot back to failed when cleanup errors during retry preparation", async () => {
    const events: string[] = [];
    const store = createSupabaseSnapshotStore(
      createSupabaseClientDouble({
        selectMaybeSingle: async ({ table, filters }) => {
          events.push(`select:${table}:${JSON.stringify(filters)}`);

          return {
            data: {
              id: "snapshot-failed",
              status: "failed",
            },
            error: null,
          };
        },
        deleteEq: async ({ table, filters }) => {
          events.push(`delete:${table}:${JSON.stringify(filters)}`);

          return {
            error: {
              message: "delete failed",
            },
          };
        },
        updateMaybeSingle: async ({ table, payload, filters }) => {
          events.push(`update:${table}:${JSON.stringify(payload)}:${JSON.stringify(filters)}`);

          return {
            data: {
              id: "snapshot-failed",
            },
            error: null,
          };
        },
      }),
    );

    await expect(
      store.prepareSnapshotRun({
        snapshotDate: "2026-03-29",
        capturedAt: new Date("2026-03-29T00:00:00.000Z"),
      }),
    ).rejects.toThrow("Failed to clear snapshot items for snapshot-failed: delete failed");

    expect(events).toEqual([
      'select:trending_snapshots:[["snapshot_date","2026-03-29"]]',
      'update:trending_snapshots:{"status":"running","item_count":0,"captured_at":"2026-03-29T00:00:00.000Z"}:[["id","snapshot-failed"],["status","failed"]]',
      'delete:trending_snapshot_items:[["snapshot_id","snapshot-failed"]]',
      'update:trending_snapshots:{"status":"failed"}:[["id","snapshot-failed"],["status","running"]]',
    ]);
  });

  it("skips safely when a concurrent retry loses the failed-to-running claim", async () => {
    const events: string[] = [];
    let selectCount = 0;
    const store = createSupabaseSnapshotStore(
      createSupabaseClientDouble({
        selectMaybeSingle: async ({ table, filters }) => {
          events.push(`select:${table}:${JSON.stringify(filters)}`);
          selectCount += 1;

          if (selectCount === 1) {
            return {
              data: {
                id: "snapshot-failed",
                status: "failed",
              },
              error: null,
            };
          }

          return {
            data: {
              id: "snapshot-failed",
              status: "running",
            },
            error: null,
          };
        },
        updateMaybeSingle: async ({ table, payload, filters }) => {
          events.push(`update:${table}:${JSON.stringify(payload)}:${JSON.stringify(filters)}`);

          return {
            data: null,
            error: null,
          };
        },
        deleteEq: async ({ table, filters }) => {
          events.push(`delete:${table}:${JSON.stringify(filters)}`);

          return {
            error: null,
          };
        },
      }),
    );

    const result = await store.prepareSnapshotRun({
      snapshotDate: "2026-03-29",
      capturedAt: new Date("2026-03-29T00:00:00.000Z"),
    });

    expect(result).toEqual({
      kind: "skipped",
      reason: "running",
      snapshotId: "snapshot-failed",
    });
    expect(events).toEqual([
      'select:trending_snapshots:[["snapshot_date","2026-03-29"]]',
      'update:trending_snapshots:{"status":"running","item_count":0,"captured_at":"2026-03-29T00:00:00.000Z"}:[["id","snapshot-failed"],["status","failed"]]',
      'select:trending_snapshots:[["id","snapshot-failed"]]',
    ]);
  });

  it("skips safely when a concurrent insert loses the snapshot_date race to a running snapshot", async () => {
    let selectCount = 0;
    const store = createSupabaseSnapshotStore(
      createSupabaseClientDouble({
        selectMaybeSingle: async () => {
          selectCount += 1;

          if (selectCount === 1) {
            return {
              data: null,
              error: null,
            };
          }

          return {
            data: {
              id: "snapshot-running",
              status: "running",
              captured_at: "2026-03-29T00:00:00.000Z",
            },
            error: null,
          };
        },
        insertSingle: async () => ({
          data: null,
          error: {
            code: "23505",
            message: "duplicate key value violates unique constraint",
          },
        }),
      }),
    );

    const result = await store.prepareSnapshotRun({
      snapshotDate: "2026-03-29",
      capturedAt: new Date("2026-03-29T00:00:00.000Z"),
    });

    expect(result).toEqual({
      kind: "skipped",
      reason: "running",
      snapshotId: "snapshot-running",
    });
  });
});
