import { describe, expect, it, vi } from "vitest";

import { ingestTrendingSnapshot } from "@/lib/snapshots/ingest-trending-snapshot";
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
    const getSuccessfulSnapshotByDate = vi.fn().mockResolvedValue(null);
    const createRunningSnapshot = vi.fn().mockResolvedValue({ id: "snapshot-1" });
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
        getSuccessfulSnapshotByDate,
        createRunningSnapshot,
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
    expect(getSuccessfulSnapshotByDate).toHaveBeenCalledWith("2026-03-29");
    expect(createRunningSnapshot).toHaveBeenCalledWith({
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
    const getSuccessfulSnapshotByDate = vi
      .fn()
      .mockResolvedValue({ id: "snapshot-existing" });
    const fetchTrendingSeeds = vi.fn();
    const createRunningSnapshot = vi.fn();

    const result = await ingestTrendingSnapshot({
      targetDate: "2026-03-29",
      fetchTrendingSeeds,
      fetchRepository: vi.fn(),
      fetchReadme: vi.fn(),
      summarize: vi.fn(),
      store: {
        getSuccessfulSnapshotByDate,
        createRunningSnapshot,
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
    expect(createRunningSnapshot).not.toHaveBeenCalled();
  });
});
