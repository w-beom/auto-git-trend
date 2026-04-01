import { describe, expect, it } from "vitest";

import { loadServerEnv } from "@/lib/env";

describe("loadServerEnv", () => {
  const validEnv = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    GITHUB_TOKEN: "github-token",
    CRON_SECRET: "1234567890abcdef",
    OPENAI_API_KEY: "openai-key",
  } as unknown as NodeJS.ProcessEnv;

  it("throws when CRON_SECRET is shorter than 16 characters and identifies the key", () => {
    expect(() =>
      loadServerEnv({
        ...validEnv,
        CRON_SECRET: "too-short",
      }),
    ).toThrow(/CRON_SECRET/);
  });

  it("returns the parsed env for a valid env object", () => {
    expect(loadServerEnv(validEnv)).toEqual(validEnv);
  });
});
