import type { NextRequest } from "next/server";

import { runDailyTrendingIngestion } from "@/lib/snapshots/ingest-trending-snapshot";

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  return Boolean(cronSecret) && authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest): Promise<Response> {
  const path = new URL(request.url).pathname;

  if (!isAuthorized(request)) {
    console.warn("cron request unauthorized", {
      hasAuthorizationHeader: Boolean(request.headers.get("authorization")),
      path,
    });

    return new Response("Unauthorized", {
      status: 401,
    });
  }

  console.log("cron ingestion started", {
    path,
  });

  try {
    const result = await runDailyTrendingIngestion();

    console.log("cron ingestion completed", {
      itemCount: result.itemCount,
      path,
      snapshotId: result.snapshotId,
      status: result.status,
    });

    return Response.json({
      ok: true,
      snapshotId: result.snapshotId,
      status: result.status,
      itemCount: result.itemCount,
    });
  } catch (error) {
    console.error("cron ingestion failed", {
      error,
      path,
    });

    throw error;
  }
}
