import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

beforeEach(() => {
  runDailyTrendingIngestion.mockResolvedValue({
    snapshotId: "snapshot-1",
    status: "created",
    itemCount: 1,
    items: [],
  });
});

afterEach(() => {
  if (typeof originalCronSecret === "undefined") {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = originalCronSecret;
  }

  vi.restoreAllMocks();
  runDailyTrendingIngestion.mockReset();
});

describe("GET /api/cron/trending", () => {
  it("logs unauthorized cron requests and returns 401 when the authorization header does not match the cron secret", async () => {
    process.env.CRON_SECRET = "super-secret-value";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = await GET(
      new Request("http://localhost/api/cron/trending", {
        method: "GET",
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(runDailyTrendingIngestion).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("cron request unauthorized", {
      hasAuthorizationHeader: false,
      path: "/api/cron/trending",
    });
  });

  it("logs the cron execution lifecycle when the request is authorized", async () => {
    process.env.CRON_SECRET = "super-secret-value";
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

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
    expect(logSpy).toHaveBeenNthCalledWith(1, "cron ingestion started", {
      path: "/api/cron/trending",
    });
    expect(logSpy).toHaveBeenNthCalledWith(2, "cron ingestion completed", {
      itemCount: 1,
      path: "/api/cron/trending",
      snapshotId: "snapshot-1",
      status: "created",
    });
    await expect(response.json()).resolves.toEqual({
      ok: true,
      snapshotId: "snapshot-1",
      status: "created",
      itemCount: 1,
    });
  });

  it("logs ingestion failures before rethrowing them", async () => {
    process.env.CRON_SECRET = "super-secret-value";
    const error = new Error("ingestion failed");
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    runDailyTrendingIngestion.mockRejectedValueOnce(error);

    await expect(
      GET(
        new Request("http://localhost/api/cron/trending", {
          method: "GET",
          headers: {
            Authorization: "Bearer super-secret-value",
          },
        }) as never,
      ),
    ).rejects.toThrow("ingestion failed");

    expect(errorSpy).toHaveBeenCalledWith("cron ingestion failed", {
      error,
      path: "/api/cron/trending",
    });
  });
});
