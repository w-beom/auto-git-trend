import { describe, expect, it, vi } from "vitest";

import { generateKoreanSummary } from "@/lib/summaries/generate-korean-summary";
import type { SummaryClient } from "@/lib/summaries/summary-client";

describe("generateKoreanSummary", () => {
  it("includes the description and a README excerpt in the prompt, then returns the Korean summary", async () => {
    const summarize = vi.fn().mockResolvedValue("한국어 요약 결과");
    const client: SummaryClient = {
      summarize,
    };

    const readme = [
      "# Sample Repo",
      "This README explains how the project works.",
      "The first excerpt should be included.",
      ...Array.from({ length: 200 }, (_, index) => `Additional README line ${index + 1}`),
      "TAIL_MARKER",
    ].join("\n");

    const result = await generateKoreanSummary(client, {
      fullName: "acme/sample-repo",
      description: "A small GitHub repository for testing.",
      readme,
    });

    expect(result).toBe("한국어 요약 결과");
    expect(summarize).toHaveBeenCalledTimes(1);
    expect(summarize.mock.calls[0]?.[0]).toContain("acme/sample-repo");
    expect(summarize.mock.calls[0]?.[0]).toContain("A small GitHub repository for testing.");
    expect(summarize.mock.calls[0]?.[0]).toContain("This README explains how the project works.");
    expect(summarize.mock.calls[0]?.[0]).not.toContain("TAIL_MARKER");
  });
});
