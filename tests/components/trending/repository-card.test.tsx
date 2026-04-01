import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RepositoryCard } from "@/components/trending/repository-card";

describe("RepositoryCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows only the first summary paragraph by default in list cards", () => {
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

    expect(within(summaryGroup).getByText("첫 문단 요약입니다.")).toBeInTheDocument();
    expect(within(summaryGroup).queryByText("둘째 문단 설명입니다.")).not.toBeInTheDocument();
    expect(within(summaryGroup).queryByText("셋째 문단 설명입니다.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "상세 펼치기" })).toBeInTheDocument();
  });

  it("expands and collapses the full summary from the top-right toggle", () => {
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

    fireEvent.click(screen.getByRole("button", { name: "상세 펼치기" }));
    expect(screen.getByRole("button", { name: "상세 접기" })).toBeInTheDocument();
    expect(screen.getByText("둘째 문단 설명입니다.")).toBeInTheDocument();
    expect(screen.getByText("셋째 문단 설명입니다.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "상세 접기" }));
    expect(screen.getByRole("button", { name: "상세 펼치기" })).toBeInTheDocument();
    expect(screen.queryByText("둘째 문단 설명입니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("셋째 문단 설명입니다.")).not.toBeInTheDocument();
  });

  it("omits the toggle when a list card has only one paragraph", () => {
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

    expect(screen.queryByRole("button", { name: /상세/ })).not.toBeInTheDocument();
  });

  it("keeps feature cards fully expanded without a toggle", () => {
    render(
      <RepositoryCard
        variant="feature"
        item={{
          rank: 1,
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

    expect(screen.getByText("첫 문단 요약입니다.")).toBeInTheDocument();
    expect(screen.getByText("둘째 문단 설명입니다.")).toBeInTheDocument();
    expect(screen.getByText("셋째 문단 설명입니다.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /상세/ })).not.toBeInTheDocument();
  });

  it("renders a NEW badge next to the repository name when the item is new", () => {
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
          isNew: true,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: /rocket/i })).toBeInTheDocument();
    expect(screen.getByText("NEW")).toBeInTheDocument();
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
