import type { SummaryClient } from "@/lib/summaries/summary-client";
import { extractReadmeText } from "@/lib/github/extract-readme-text";

export interface GenerateKoreanSummaryInput {
  fullName: string;
  description: string | null;
  readme: string | null;
}

const README_CHAR_LIMIT = 3000;

function truncateReadme(readme: string | null): string {
  const extractedReadme = extractReadmeText(readme);

  if (!extractedReadme) {
    return "없음";
  }

  const normalized = extractedReadme.trim();
  if (!normalized) {
    return "없음";
  }

  return normalized.slice(0, README_CHAR_LIMIT);
}

function buildRepositoryUrl(fullName: string): string {
  return `https://github.com/${fullName}`;
}

function buildKoreanSummaryPrompt(input: GenerateKoreanSummaryInput): string {
  const readmeExcerpt = truncateReadme(input.readme);

  return [
    "다음 GitHub 저장소를 분석해서, 이 저장소가 “무슨 프로젝트인지” 이해할 수 있게 설명해줘.",
    "",
    "[분석할 저장소]",
    `- 저장소 URL: ${buildRepositoryUrl(input.fullName)}`,
    "",
    "[설명 목적]",
    "- 이 프로젝트가 무엇인지 빠르게 파악하고 싶다.",
    "- README를 바탕으로 설명해라.",
    "- 추측은 최소화하고, 확인 가능한 내용 위주로 설명해라.",
    "",
    "[README 내용]",
    readmeExcerpt,
    "",
    "[출력 형식]",
    "- 한국어로 작성해라.",
    "- 모든 문장은 자연스러운 “~요” 말투로 작성해라.",
    "- 첫 문단은 이 프로젝트가 무엇인지 요약 설명하는 문단으로 작성해라.",
    "- 그 다음 문단들은 핵심 3가지 정도를 문단별로 정리해라.",
    "- 번호 목록 대신 읽기 쉬운 짧은 문단 형태로 작성해라.",
    "",
    "[설명 스타일]",
    "- README 내용을 그대로 복붙하지 말고 풀어서 설명",
  ].join("\n");
}

export async function generateKoreanSummary(
  client: SummaryClient,
  input: GenerateKoreanSummaryInput,
): Promise<string> {
  const prompt = buildKoreanSummaryPrompt(input);
  const summary = await client.summarize(prompt);
  return summary.trim();
}
