import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TopThreeGrid } from "@/components/trending/top-three-grid";

describe("TopThreeGrid", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
  });

  it("renders full-size featured cards one at a time with pager dots", () => {
    render(
      <TopThreeGrid
        highlights={[
          {
            rank: 1,
            fullName: "acme/rocket",
            summaryKo:
              "첫 문단 요약입니다.\n\n둘째 문단 설명입니다.\n\n셋째 문단 설명입니다.",
          },
          {
            rank: 2,
            fullName: "beta/beam",
            summaryKo: "두 번째 카드 요약입니다.",
          },
          {
            rank: 3,
            fullName: "charlie/cloud",
            summaryKo: "세 번째 카드 요약입니다.",
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
          {
            rank: 2,
            fullName: "beta/beam",
            owner: "beta",
            name: "beam",
            githubUrl: "https://github.com/beta/beam",
            summaryKo: "두 번째 카드 요약입니다.",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: "TypeScript",
            starsToday: 98,
            starsTotal: 2100,
            forksTotal: 140,
            avatarUrl: "https://example.com/beta.png",
          },
          {
            rank: 3,
            fullName: "charlie/cloud",
            owner: "charlie",
            name: "cloud",
            githubUrl: "https://github.com/charlie/cloud",
            summaryKo: "세 번째 카드 요약입니다.",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: "Go",
            starsToday: 87,
            starsTotal: 1900,
            forksTotal: 110,
            avatarUrl: "https://example.com/charlie.png",
          },
        ]}
      />,
    );

    const section = screen.getByRole("region", { name: "오늘의 톱 3" });
    const viewer = within(section).getByRole("group", {
      name: "오늘의 톱 3 카드 뷰어",
    });
    const pager = within(section).getByRole("group", {
      name: "오늘의 톱 3 페이지 선택",
    });
    const [summaryGroup] = within(section).getAllByRole("group", {
      name: "프로젝트 요약",
    });
    const topTwoButton = within(pager).getByRole("button", {
      name: "TOP 2 카드 보기",
    });

    expect(viewer).toHaveClass("top-three-grid");
    expect(within(section).getByText("TOP 1")).toBeInTheDocument();
    expect(within(section).getByText("acme/rocket")).toBeInTheDocument();
    expect(within(section).getByRole("heading", { name: "rocket" })).toBeInTheDocument();
    expect(within(summaryGroup).getByText("첫 문단 요약입니다.")).toBeInTheDocument();
    expect(within(summaryGroup).getByText("둘째 문단 설명입니다.")).toBeInTheDocument();
    expect(within(section).queryByText("TypeScript")).not.toBeInTheDocument();
    expect(within(section).queryByText("+120 today")).not.toBeInTheDocument();
    expect(within(section).getByText("4,200 stars")).toBeInTheDocument();
    expect(within(pager).getAllByRole("button")).toHaveLength(3);
    expect(
      within(pager).getByRole("button", { name: "TOP 1 카드 보기" }),
    ).toHaveAttribute("aria-current", "true");

    fireEvent.click(topTwoButton);

    expect(topTwoButton).toHaveAttribute("aria-current", "true");
    expect(
      within(section).getByRole("link", {
        name: "acme/rocket 하이라이트 GitHub에서 보기",
      }),
    ).toHaveAttribute("href", "https://github.com/acme/rocket");
  });

  it("moves between top-three cards with desktop previous and next buttons", () => {
    render(
      <TopThreeGrid
        highlights={[
          { rank: 1, fullName: "acme/rocket", summaryKo: "첫 카드" },
          { rank: 2, fullName: "beta/beam", summaryKo: "둘째 카드" },
          { rank: 3, fullName: "charlie/cloud", summaryKo: "셋째 카드" },
        ]}
        items={[
          {
            rank: 1,
            fullName: "acme/rocket",
            owner: "acme",
            name: "rocket",
            githubUrl: "https://github.com/acme/rocket",
            summaryKo: "첫 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 4200,
            forksTotal: 210,
            avatarUrl: null,
          },
          {
            rank: 2,
            fullName: "beta/beam",
            owner: "beta",
            name: "beam",
            githubUrl: "https://github.com/beta/beam",
            summaryKo: "둘째 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 2100,
            forksTotal: 140,
            avatarUrl: null,
          },
          {
            rank: 3,
            fullName: "charlie/cloud",
            owner: "charlie",
            name: "cloud",
            githubUrl: "https://github.com/charlie/cloud",
            summaryKo: "셋째 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 1900,
            forksTotal: 110,
            avatarUrl: null,
          },
        ]}
      />,
    );

    const viewer = screen.getByRole("group", {
      name: "오늘의 톱 3 카드 뷰어",
    });
    const track = viewer.querySelector(".top-three-carousel__track") as HTMLDivElement | null;
    const topOneButton = screen.getByRole("button", { name: "TOP 1 카드 보기" });
    const topTwoButton = screen.getByRole("button", { name: "TOP 2 카드 보기" });
    const previousButton = screen.getByRole("button", { name: "이전 톱3 카드" });
    const nextButton = screen.getByRole("button", { name: "다음 톱3 카드" });

    expect(track).not.toBeNull();
    expect(previousButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    if (!track) {
      return;
    }

    fireEvent.click(nextButton);
    expect(topTwoButton).toHaveAttribute("aria-current", "true");
    expect(topOneButton).not.toHaveAttribute("aria-current", "true");
    expect(previousButton).not.toBeDisabled();

    fireEvent.click(previousButton);

    expect(topOneButton).toHaveAttribute("aria-current", "true");
    expect(previousButton).toBeDisabled();
  });

  it("scrolls the desktop carousel track directly when the next button is clicked", () => {
    render(
      <TopThreeGrid
        highlights={[
          { rank: 1, fullName: "acme/rocket", summaryKo: "첫 카드" },
          { rank: 2, fullName: "beta/beam", summaryKo: "둘째 카드" },
          { rank: 3, fullName: "charlie/cloud", summaryKo: "셋째 카드" },
        ]}
        items={[
          {
            rank: 1,
            fullName: "acme/rocket",
            owner: "acme",
            name: "rocket",
            githubUrl: "https://github.com/acme/rocket",
            summaryKo: "첫 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 4200,
            forksTotal: 210,
            avatarUrl: null,
          },
          {
            rank: 2,
            fullName: "beta/beam",
            owner: "beta",
            name: "beam",
            githubUrl: "https://github.com/beta/beam",
            summaryKo: "둘째 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 2100,
            forksTotal: 140,
            avatarUrl: null,
          },
          {
            rank: 3,
            fullName: "charlie/cloud",
            owner: "charlie",
            name: "cloud",
            githubUrl: "https://github.com/charlie/cloud",
            summaryKo: "셋째 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 1900,
            forksTotal: 110,
            avatarUrl: null,
          },
        ]}
      />,
    );

    const viewer = screen.getByRole("group", {
      name: "오늘의 톱 3 카드 뷰어",
    });
    const track = viewer.querySelector(".top-three-carousel__track") as HTMLDivElement | null;
    const nextButton = screen.getByRole("button", { name: "다음 톱3 카드" });

    expect(track).not.toBeNull();

    if (!track) {
      return;
    }

    Object.defineProperty(track, "clientWidth", {
      configurable: true,
      value: 960,
    });

    const scrollToMock = vi.spyOn(track, "scrollTo");

    fireEvent.click(nextButton);

    expect(scrollToMock).toHaveBeenCalledWith({
      behavior: "smooth",
      left: 960,
      top: 0,
    });
  });

  it("updates the desktop carousel height to match the next card content", async () => {
    render(
      <TopThreeGrid
        highlights={[
          { rank: 1, fullName: "acme/rocket", summaryKo: "첫 카드" },
          { rank: 2, fullName: "beta/beam", summaryKo: "둘째 카드" },
          { rank: 3, fullName: "charlie/cloud", summaryKo: "셋째 카드" },
        ]}
        items={[
          {
            rank: 1,
            fullName: "acme/rocket",
            owner: "acme",
            name: "rocket",
            githubUrl: "https://github.com/acme/rocket",
            summaryKo: "첫 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 4200,
            forksTotal: 210,
            avatarUrl: null,
          },
          {
            rank: 2,
            fullName: "beta/beam",
            owner: "beta",
            name: "beam",
            githubUrl: "https://github.com/beta/beam",
            summaryKo: "둘째 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 2100,
            forksTotal: 140,
            avatarUrl: null,
          },
          {
            rank: 3,
            fullName: "charlie/cloud",
            owner: "charlie",
            name: "cloud",
            githubUrl: "https://github.com/charlie/cloud",
            summaryKo: "셋째 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 1900,
            forksTotal: 110,
            avatarUrl: null,
          },
        ]}
      />,
    );

    const viewer = screen.getByRole("group", {
      name: "오늘의 톱 3 카드 뷰어",
    });
    const viewport = viewer.querySelector(".top-three-carousel__viewport") as HTMLDivElement | null;
    const slides = Array.from(
      viewer.querySelectorAll(".top-three-carousel__slide"),
    ) as HTMLDivElement[];
    const nextButton = screen.getByRole("button", { name: "다음 톱3 카드" });

    expect(viewport).not.toBeNull();
    expect(slides).toHaveLength(3);

    if (!viewport || slides.length !== 3) {
      return;
    }

    [420, 560, 480].forEach((height, index) => {
      Object.defineProperty(slides[index], "getBoundingClientRect", {
        configurable: true,
        value: () => ({
          width: 320,
          height,
          top: 0,
          left: 0,
          right: 320,
          bottom: height,
          x: 0,
          y: 0,
          toJSON() {
            return {};
          },
        }),
      });
    });

    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(viewport.style.getPropertyValue("--top-three-carousel-height")).toBe("420px");
    });

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(viewport.style.getPropertyValue("--top-three-carousel-height")).toBe("560px");
    });
  });

  it("updates the outer top-three section height in sync with the target card height", async () => {
    render(
      <TopThreeGrid
        highlights={[
          { rank: 1, fullName: "acme/rocket", summaryKo: "첫 카드" },
          { rank: 2, fullName: "beta/beam", summaryKo: "둘째 카드" },
          { rank: 3, fullName: "charlie/cloud", summaryKo: "셋째 카드" },
        ]}
        items={[
          {
            rank: 1,
            fullName: "acme/rocket",
            owner: "acme",
            name: "rocket",
            githubUrl: "https://github.com/acme/rocket",
            summaryKo: "첫 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 4200,
            forksTotal: 210,
            avatarUrl: null,
          },
          {
            rank: 2,
            fullName: "beta/beam",
            owner: "beta",
            name: "beam",
            githubUrl: "https://github.com/beta/beam",
            summaryKo: "둘째 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 2100,
            forksTotal: 140,
            avatarUrl: null,
          },
          {
            rank: 3,
            fullName: "charlie/cloud",
            owner: "charlie",
            name: "cloud",
            githubUrl: "https://github.com/charlie/cloud",
            summaryKo: "셋째 카드",
            description: null,
            readmeExcerpt: null,
            primaryLanguage: null,
            starsToday: null,
            starsTotal: 1900,
            forksTotal: 110,
            avatarUrl: null,
          },
        ]}
      />,
    );

    const section = screen.getByRole("region", { name: "오늘의 톱 3" });
    const content = section.querySelector(".section-block__content--top-three") as HTMLDivElement | null;
    const slides = Array.from(
      section.querySelectorAll(".top-three-carousel__slide"),
    ) as HTMLDivElement[];
    const nextButton = screen.getByRole("button", { name: "다음 톱3 카드" });

    expect(content).not.toBeNull();
    expect(slides).toHaveLength(3);

    if (!content || slides.length !== 3) {
      return;
    }

    Object.defineProperty(content, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        width: 320,
        height: 540,
        top: 0,
        left: 0,
        right: 320,
        bottom: 540,
        x: 0,
        y: 0,
        toJSON() {
          return {};
        },
      }),
    });

    [420, 560, 480].forEach((height, index) => {
      Object.defineProperty(slides[index], "getBoundingClientRect", {
        configurable: true,
        value: () => ({
          width: 320,
          height,
          top: 0,
          left: 0,
          right: 320,
          bottom: height,
          x: 0,
          y: 0,
          toJSON() {
            return {};
          },
        }),
      });
    });

    fireEvent(window, new Event("resize"));

    await waitFor(() => {
      expect(section.style.getPropertyValue("--top-three-section-height")).toBe("540px");
    });

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(section.style.getPropertyValue("--top-three-section-height")).toBe("680px");
    });
  });
});
