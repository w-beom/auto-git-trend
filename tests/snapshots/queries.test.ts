import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient,
}));

interface QueryInvocation {
  columns: string;
  filters: Array<[string, unknown]>;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
}

interface ListQueryInvocation {
  columns: string;
  filters: Array<[string, unknown]>;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
}

function expectSlimSnapshotColumns(columns: string) {
  expect(columns).toContain("repo_description_snapshot");
  expect(columns).toContain("summary_ko");
  expect(columns).toContain("stars_total");
  expect(columns).toContain("forks_total");
  expect(columns).not.toContain("readme_excerpt");
  expect(columns).not.toContain("stars_today");
  expect(columns).not.toContain("primary_language");
  expect(columns).not.toContain("avatar_url");
  expect(columns).not.toMatch(/\brepository:repositories\s*\([^)]*\bdescription\b/);
}

function createSupabaseClientDouble(
  maybeSingleHandler: (input: QueryInvocation) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>,
) {
  return {
    from() {
      return {
        select(columns: string) {
          const filters: Array<[string, unknown]> = [];
          let orderBy: QueryInvocation["orderBy"];
          let limit: number | undefined;

          return {
            eq(field: string, value: unknown) {
              filters.push([field, value]);
              return this;
            },
            order(column: string, options: { ascending?: boolean }) {
              orderBy = {
                column,
                ascending: options.ascending,
              };
              return this;
            },
            limit(value: number) {
              limit = value;
              return this;
            },
            maybeSingle() {
              return maybeSingleHandler({
                columns,
                filters,
                orderBy,
                limit,
              });
            },
          };
        },
      };
    },
  };
}

function createSupabaseListClientDouble(
  listHandler: (input: ListQueryInvocation) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>,
) {
  return {
    from() {
      return {
        select(columns: string) {
          const filters: Array<[string, unknown]> = [];
          let orderBy: ListQueryInvocation["orderBy"];

          const query = {
            eq(field: string, value: unknown) {
              filters.push([field, value]);
              return query;
            },
            order(column: string, options: { ascending?: boolean }) {
              orderBy = {
                column,
                ascending: options.ascending,
              };
              return query;
            },
            then<TResult1 = unknown, TResult2 = never>(
              onfulfilled?:
                | ((
                    value: { data: unknown; error: { message: string } | null },
                  ) => TResult1 | PromiseLike<TResult1>)
                | null,
              onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
            ) {
              return listHandler({
                columns,
                filters,
                orderBy,
              }).then(onfulfilled, onrejected);
            },
          };

          return query;
        },
      };
    },
  };
}

const originalEnv = process.env;

describe("snapshot queries", () => {
  beforeEach(() => {
    vi.resetModules();
    createClient.mockReset();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("formats latest snapshot labels in KST using only Supabase env", async () => {
    createClient.mockReturnValue(
      createSupabaseClientDouble(async ({ columns, filters, orderBy, limit }) => {
        expectSlimSnapshotColumns(columns);
        expect(filters).toEqual([["status", "success"]]);
        expect(orderBy).toEqual({
          column: "snapshot_date",
          ascending: false,
        });
        expect(limit).toBe(1);

        return {
          data: {
            snapshot_date: "2026-03-29",
            captured_at: "2026-03-29T00:15:00.000Z",
            item_count: 1,
            trending_snapshot_items: [
              {
                rank: 1,
                repo_description_snapshot: "A fast launch platform.",
                summary_ko: "빠르게 배포할 수 있는 로켓 플랫폼입니다.",
                repository: {
                  owner: "acme",
                  name: "rocket",
                  full_name: "acme/rocket",
                  github_url: "https://github.com/acme/rocket",
                  stars_total: 4200,
                  forks_total: 210,
                },
              },
            ],
          },
          error: null,
        };
      }),
    );
    process.env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    } as NodeJS.ProcessEnv;

    const { getLatestSnapshotPageData } = await import("@/lib/snapshots/queries");
    const result = await getLatestSnapshotPageData();

    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
    expect(result).toMatchObject({
      snapshotDate: "2026-03-29",
      capturedAtLabel: "Captured Mar 29, 2026, 9:15 AM KST",
      totalCount: 1,
      items: [
        {
          description: "A fast launch platform.",
          readmeExcerpt: null,
          primaryLanguage: null,
          starsToday: null,
          avatarUrl: null,
        },
      ],
    });
  });

  it("throws clearly when Supabase env is genuinely misconfigured", async () => {
    process.env = {
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    } as NodeJS.ProcessEnv;

    const { getLatestSnapshotPageData } = await import("@/lib/snapshots/queries");

    await expect(getLatestSnapshotPageData()).rejects.toThrow(/SUPABASE_URL/);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("formats archive snapshot labels in KST", async () => {
    createClient.mockReturnValue(
      createSupabaseClientDouble(async ({ columns, filters }) => {
        expectSlimSnapshotColumns(columns);
        expect(filters).toEqual([
          ["status", "success"],
          ["snapshot_date", "2026-03-28"],
        ]);

        return {
          data: {
            snapshot_date: "2026-03-28",
            captured_at: "2026-03-28T00:20:00.000Z",
            item_count: 1,
            trending_snapshot_items: [
              {
                rank: 1,
                repo_description_snapshot: "Static deploy automation.",
                summary_ko: "정적 사이트 배포 흐름을 단순화합니다.",
                repository: {
                  owner: "gamma",
                  name: "comet",
                  full_name: "gamma/comet",
                  github_url: "https://github.com/gamma/comet",
                  stars_total: 1800,
                  forks_total: 44,
                },
              },
            ],
          },
          error: null,
        };
      }),
    );
    process.env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    } as NodeJS.ProcessEnv;

    const { getSnapshotPageDataByDate } = await import("@/lib/snapshots/queries");
    const result = await getSnapshotPageDataByDate("2026-03-28");

    expect(result?.capturedAtLabel).toBe("Captured Mar 28, 2026, 9:20 AM KST");
  });

  it("returns successful snapshot dates newest first without duplicates", async () => {
    createClient.mockReturnValue(
      createSupabaseListClientDouble(async ({ columns, filters, orderBy }) => {
        expect(columns).toBe("snapshot_date");
        expect(filters).toEqual([["status", "success"]]);
        expect(orderBy).toEqual({
          column: "snapshot_date",
          ascending: false,
        });

        return {
          data: [
            { snapshot_date: "2026-03-29" },
            { snapshot_date: "2026-03-28" },
            { snapshot_date: "2026-03-28" },
            { snapshot_date: "2026-03-27" },
          ],
          error: null,
        };
      }),
    );
    process.env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    } as NodeJS.ProcessEnv;

    const { getSnapshotArchiveDates } = await import("@/lib/snapshots/queries");

    await expect(getSnapshotArchiveDates()).resolves.toEqual([
      "2026-03-29",
      "2026-03-28",
      "2026-03-27",
    ]);
  });

  it("returns an empty archive date list when Supabase env is absent", async () => {
    process.env = {} as NodeJS.ProcessEnv;

    const { getSnapshotArchiveDates } = await import("@/lib/snapshots/queries");

    await expect(getSnapshotArchiveDates()).resolves.toEqual([]);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("reuses cached archive dates across repeated calls", async () => {
    const listHandler = vi.fn(async ({ columns, filters, orderBy }: ListQueryInvocation) => {
      expect(columns).toBe("snapshot_date");
      expect(filters).toEqual([["status", "success"]]);
      expect(orderBy).toEqual({
        column: "snapshot_date",
        ascending: false,
      });

      return {
        data: [
          { snapshot_date: "2026-03-29" },
          { snapshot_date: "2026-03-28" },
        ],
        error: null,
      };
    });

    createClient.mockReturnValue(createSupabaseListClientDouble(listHandler));
    process.env = {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    } as NodeJS.ProcessEnv;

    const { getSnapshotArchiveDates } = await import("@/lib/snapshots/queries");

    await expect(getSnapshotArchiveDates()).resolves.toEqual(["2026-03-29", "2026-03-28"]);
    await expect(getSnapshotArchiveDates()).resolves.toEqual(["2026-03-29", "2026-03-28"]);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(listHandler).toHaveBeenCalledTimes(1);
  });

  it("emits a non-production diagnostic for archive snapshot queries", async () => {
    createClient.mockReturnValue(
      createSupabaseClientDouble(async () => ({
        data: {
          snapshot_date: "2026-03-28",
          captured_at: "2026-03-28T00:20:00.000Z",
          item_count: 1,
          trending_snapshot_items: [
            {
              rank: 1,
              stars_today: 77,
              repo_description_snapshot: "Static deploy automation.",
              readme_excerpt: null,
              summary_ko: "정적 사이트 배포 흐름을 단순화합니다.",
              repository: {
                owner: "gamma",
                name: "comet",
                full_name: "gamma/comet",
                github_url: "https://github.com/gamma/comet",
                description: "Static deploy automation.",
                primary_language: "Go",
                stars_total: 1800,
                forks_total: 44,
                avatar_url: "https://example.com/gamma.png",
              },
            },
          ],
        },
        error: null,
      })),
    );
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    } as NodeJS.ProcessEnv;
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});

    const { getSnapshotPageDataByDate } = await import("@/lib/snapshots/queries");
    await getSnapshotPageDataByDate("2026-03-28");

    expect(consoleInfo).toHaveBeenCalledWith(
      "[snapshot-diag] query",
      expect.objectContaining({
        name: "getSnapshotPageDataByDate",
        snapshotDate: "2026-03-28",
        itemCount: 1,
      }),
    );
  });
});
