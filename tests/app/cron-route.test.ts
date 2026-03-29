import { afterEach, describe, expect, it, vi } from "vitest";

const { runDailyTrendingIngestion } = vi.hoisted(() => ({
  runDailyTrendingIngestion: vi.fn().mockResolvedValue({
    snapshotId: "snapshot-1",
    status: "created",
    itemCount: 1,
    items: [],
  }),
}));

vi.mock("@/lib/snapshots/ingest-trending-snapshot", () => ({
  runDailyTrendingIngestion,
}));

import { GET } from "@/app/api/cron/trending/route";

const originalCronSecret = process.env.CRON_SECRET;

afterEach(() => {
  if (typeof originalCronSecret === "undefined") {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = originalCronSecret;
  }

  runDailyTrendingIngestion.mockClear();
});

describe("GET /api/cron/trending", () => {
  it("returns 401 when the authorization header does not match the cron secret", async () => {
    process.env.CRON_SECRET = "super-secret-value";

    const response = await GET(
      new Request("http://localhost/api/cron/trending", {
        method: "GET",
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(runDailyTrendingIngestion).not.toHaveBeenCalled();
  });

  it("delegates to the daily ingestion entrypoint when the request is authorized", async () => {
    process.env.CRON_SECRET = "super-secret-value";

    const response = await GET(
      new Request("http://localhost/api/cron/trending", {
        method: "GET",
        headers: {
          Authorization: "Bearer super-secret-value",
        },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(runDailyTrendingIngestion).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      snapshotId: "snapshot-1",
      status: "created",
      itemCount: 1,
    });
  });
});
