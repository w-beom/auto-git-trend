import { describe, expect, it } from "vitest";

import { loadServerEnv } from "@/lib/env";

describe("loadServerEnv", () => {
  it("throws when a required server variable is missing", () => {
    expect(() =>
      loadServerEnv({
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
        GITHUB_TOKEN: "github-token",
        CRON_SECRET: "cron-secret",
      } as NodeJS.ProcessEnv),
    ).toThrow();
  });
});