import { describe, expect, it, vi } from "vitest";

import { generateKoreanSummary } from "@/lib/summaries/generate-korean-summary";
import type { SummaryClient } from "@/lib/summaries/summary-client";

describe("generateKoreanSummary", () => {
  it("builds the prompt with the repository url and paragraph-based README analysis instructions", async () => {
    const summarize = vi.fn().mockResolvedValue("한국어 요약 결과");
    const client: SummaryClient = {
      summarize,
    };

    const readme = [
      "<br />",
      '<img src="https://example.com/logo.svg" alt="Logo" width="600">',
      '[![Twitter](https://img.shields.io/twitter)](https://x.com/example)',
      "# Sample Repo",
      "This README explains how the project works.",
      "The first excerpt should be included.",
      ...Array.from({ length: 200 }, (_, index) => `Additional README line ${index + 1}`),
      "TAIL_MARKER",
    ].join("\n");

    const result = await generateKoreanSummary(client, {
      fullName: "acme/sample-repo",
      description: "DESCRIPTION_MARKER",
      readme,
    });

    expect(result).toBe("한국어 요약 결과");
    expect(summarize).toHaveBeenCalledTimes(1);
    expect(summarize.mock.calls[0]?.[0]).toContain("다음 GitHub 저장소를 분석해서");
    expect(summarize.mock.calls[0]?.[0]).toContain("저장소 URL: https://github.com/acme/sample-repo");
    expect(summarize.mock.calls[0]?.[0]).toContain("README를 바탕으로 설명해라.");
    expect(summarize.mock.calls[0]?.[0]).toContain("첫 문단은 이 프로젝트가 무엇인지 요약 설명하는 문단");
    expect(summarize.mock.calls[0]?.[0]).toContain("그 다음 문단들은 핵심 3가지 정도를 문단별로 정리");
    expect(summarize.mock.calls[0]?.[0]).toContain("모든 문장은 자연스러운 “~요” 말투");
    expect(summarize.mock.calls[0]?.[0]).toContain("This README explains how the project works.");
    expect(summarize.mock.calls[0]?.[0]).toContain("Sample Repo");
    expect(summarize.mock.calls[0]?.[0]).not.toContain("DESCRIPTION_MARKER");
    expect(summarize.mock.calls[0]?.[0]).not.toContain("<img");
    expect(summarize.mock.calls[0]?.[0]).not.toContain("[![Twitter]");
    expect(summarize.mock.calls[0]?.[0]).not.toContain("TAIL_MARKER");
  });

  it("keeps the full paragraph response instead of trimming it", async () => {
    const summarize = vi.fn().mockResolvedValue([
      "이 프로젝트는 예시 저장소로, README를 쉽게 풀어 설명해 주는 안내 문서예요.",
      "",
      "첫 번째 핵심은 사용 목적이에요. README 기준으로 보이는 목적을 설명해 줘요.",
      "",
      "두 번째 핵심은 주요 기능이에요. 핵심 기능을 쉬운 말로 정리해 줘요.",
      "",
      "세 번째 핵심은 주의할 점이에요. README 기준 제약사항을 알려줘요.",
    ].join("\n"));
    const client: SummaryClient = {
      summarize,
    };

    const result = await generateKoreanSummary(client, {
      fullName: "acme/sample-repo",
      description: "unused",
      readme: "# Sample Repo\nREADME text",
    });

    expect(result).toContain("이 프로젝트는 예시 저장소로");
    expect(result).toContain("첫 번째 핵심은 사용 목적이에요.");
    expect(result).toContain("두 번째 핵심은 주요 기능이에요.");
    expect(result).toContain("세 번째 핵심은 주의할 점이에요.");
  });
});
