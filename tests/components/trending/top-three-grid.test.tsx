import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TopThreeGrid } from "@/components/trending/top-three-grid";

describe("TopThreeGrid", () => {
  it("renders a condensed highlight card with the lead summary and key metadata", () => {
    render(
      <TopThreeGrid
        highlights={[
          {
            rank: 1,
            fullName: "acme/rocket",
            summaryKo:
              "첫 문단 요약입니다.\n\n둘째 문단 설명입니다.\n\n셋째 문단 설명입니다.",
          },
        ]}
        items={[
          {
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
          },
        ]}
      />,
    );

    const section = screen.getByRole("region", { name: "오늘의 톱 3" });
    const summaryGroup = within(section).getByRole("group", {
      name: "하이라이트 요약",
    });

    expect(within(section).getByText("TOP 1")).toBeInTheDocument();
    expect(within(section).getByText("acme/rocket")).toBeInTheDocument();
    expect(within(section).getByRole("heading", { name: "rocket" })).toBeInTheDocument();
    expect(within(summaryGroup).getByText("첫 문단 요약입니다.")).toBeInTheDocument();
    expect(within(summaryGroup).queryByText("둘째 문단 설명입니다.")).not.toBeInTheDocument();
    expect(within(section).queryByText("TypeScript")).not.toBeInTheDocument();
    expect(within(section).queryByText("+120 today")).not.toBeInTheDocument();
    expect(within(section).getByText("4,200 stars")).toBeInTheDocument();
    expect(
      within(section).getByRole("link", {
        name: "acme/rocket 하이라이트 GitHub에서 보기",
      }),
    ).toHaveAttribute("href", "https://github.com/acme/rocket");
  });
});
