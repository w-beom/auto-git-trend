import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RepositoryCard } from "@/components/trending/repository-card";

describe("RepositoryCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders summary as readable paragraphs inside a dedicated summary group", () => {
    render(
      <RepositoryCard
        item={{
          rank: 4,
          fullName: "acme/rocket",
          owner: "acme",
          name: "rocket",
          githubUrl: "https://github.com/acme/rocket",
          summaryKo:
            "첫 문단 요약입니다.\n\n둘째 문단 설명입니다.\n\n셋째 문단 설명입니다.",
          description: null,
          readmeExcerpt: null,
          primaryLanguage: "TypeScript",
          starsToday: 120,
          starsTotal: 4200,
          forksTotal: 210,
          avatarUrl: "https://example.com/acme.png",
        }}
      />,
    );

    const summaryGroup = screen.getByRole("group", { name: "프로젝트 요약" });
    const paragraphs = within(summaryGroup).getAllByText(/문단/);

    expect(paragraphs).toHaveLength(3);
    expect(within(summaryGroup).getByText("첫 문단 요약입니다.")).toBeInTheDocument();
    expect(within(summaryGroup).getByText("둘째 문단 설명입니다.")).toBeInTheDocument();
    expect(within(summaryGroup).getByText("셋째 문단 설명입니다.")).toBeInTheDocument();
  });

  it("omits language and daily star growth in the detail card metadata", () => {
    render(
      <RepositoryCard
        item={{
          rank: 4,
          fullName: "acme/rocket",
          owner: "acme",
          name: "rocket",
          githubUrl: "https://github.com/acme/rocket",
          summaryKo: "첫 문단 요약입니다.",
          description: null,
          readmeExcerpt: null,
          primaryLanguage: "TypeScript",
          starsToday: 120,
          starsTotal: 4200,
          forksTotal: 210,
          avatarUrl: "https://example.com/acme.png",
        }}
      />,
    );

    expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();
    expect(screen.queryByText("+120 today")).not.toBeInTheDocument();
    expect(screen.getByText("4,200 stars")).toBeInTheDocument();
    expect(screen.getByText("210 forks")).toBeInTheDocument();
  });
});
