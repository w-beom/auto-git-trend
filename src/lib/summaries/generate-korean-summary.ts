import type { SummaryClient } from "@/lib/summaries/summary-client";

export interface GenerateKoreanSummaryInput {
  fullName: string;
  description: string | null;
  readme: string | null;
}

const README_CHAR_LIMIT = 3000;

function truncateReadme(readme: string | null): string {
  if (!readme) {
    return "없음";
  }

  const normalized = readme.trim();
  if (!normalized) {
    return "없음";
  }

  return normalized.slice(0, README_CHAR_LIMIT);
}

function buildKoreanSummaryPrompt(input: GenerateKoreanSummaryInput): string {
  const description = input.description?.trim() || "없음";
  const readmeExcerpt = truncateReadme(input.readme);

  return [
    "다음 GitHub 저장소를 한국어로 간결하게 요약해줘.",
    `저장소 이름: ${input.fullName}`,
    `설명: ${description}`,
    "README 발췌:",
    readmeExcerpt,
    "요구사항:",
    "- 반드시 한국어로 작성해줘.",
    "- 핵심 목적, 주요 기능, 활용 맥락을 2~4문장으로 요약해줘.",
    "- README 발췌에 있는 내용을 우선 반영해줘.",
  ].join("\n");
}

export async function generateKoreanSummary(
  client: SummaryClient,
  input: GenerateKoreanSummaryInput,
): Promise<string> {
  const prompt = buildKoreanSummaryPrompt(input);
  return client.summarize(prompt);
}
