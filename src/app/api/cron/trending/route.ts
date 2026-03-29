import type { NextRequest } from "next/server";

import { runDailyTrendingIngestion } from "@/lib/snapshots/ingest-trending-snapshot";

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  return Boolean(cronSecret) && authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest): Promise<Response> {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const result = await runDailyTrendingIngestion();

  return Response.json({
    ok: true,
    snapshotId: result.snapshotId,
    status: result.status,
    itemCount: result.itemCount,
  });
}
