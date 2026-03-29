import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getLatestSnapshotPageData } = vi.hoisted(() => ({
  getLatestSnapshotPageData: vi.fn(),
}));

import HomePage from "@/app/page";

vi.mock("@/lib/snapshots/queries", () => ({
  getLatestSnapshotPageData,
}));

function buildSnapshot() {
  return {
    snapshotDate: "2026-03-29",
    capturedAtIso: "2026-03-29T00:15:00.000Z",
    capturedAtLabel: "Captured Mar 29, 2026, 9:15 AM KST",
    totalCount: 3,
    topThree: [
      {
        rank: 1,
        fullName: "acme/rocket",
        summaryKo: "빠르게 배포할 수 있는 로켓 플랫폼입니다.",
      },
      {
        rank: 2,
        fullName: "beta/orbit",
        summaryKo: "관측 데이터 파이프라인을 정리해 주는 도구입니다.",
      },
    ],
    items: [
      {
        rank: 1,
        fullName: "acme/rocket",
        owner: "acme",
        name: "rocket",
        githubUrl: "https://github.com/acme/rocket",
        summaryKo: "빠르게 배포할 수 있는 로켓 플랫폼입니다.",
        description: "A fast launch platform.",
        readmeExcerpt: "CLI와 워크플로 템플릿으로 배포 단계를 줄여 줍니다.",
        primaryLanguage: "TypeScript",
        starsToday: 120,
        starsTotal: 4200,
        forksTotal: 210,
        avatarUrl: "https://example.com/acme.png",
      },
      {
        rank: 2,
        fullName: "beta/orbit",
        owner: "beta",
        name: "orbit",
        githubUrl: "https://github.com/beta/orbit",
        summaryKo: "관측 데이터 파이프라인을 정리해 주는 도구입니다.",
        description: "Orbit control center.",
        readmeExcerpt: "수집, 정리, 배포 파이프라인을 하나의 보드로 묶습니다.",
        primaryLanguage: "Python",
        starsToday: 95,
        starsTotal: 3100,
        forksTotal: 155,
        avatarUrl: "https://example.com/beta.png",
      },
      {
        rank: 3,
        fullName: "charlie/pulse",
        owner: "charlie",
        name: "pulse",
        githubUrl: "https://github.com/charlie/pulse",
        summaryKo: "팀별 릴리스 흐름을 하루 단위로 추적하는 대시보드입니다.",
        description: "Release heartbeat dashboard.",
        readmeExcerpt: null,
        primaryLanguage: "Rust",
        starsToday: 88,
        starsTotal: 2500,
        forksTotal: 99,
        avatarUrl: "https://example.com/charlie.png",
      },
    ],
  };
}

describe("HomePage", () => {
  beforeEach(() => {
    getLatestSnapshotPageData.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the latest snapshot summary data", async () => {
    getLatestSnapshotPageData.mockResolvedValue(buildSnapshot());

    render(await HomePage());

    expect(getLatestSnapshotPageData).toHaveBeenCalled();
    expect(
      screen.getByRole("heading", {
        name: "오늘의 GitHub 트렌드 스냅샷",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("2026-03-29 발행"),
    ).toBeInTheDocument();
    expect(screen.getByText("Captured Mar 29, 2026, 9:15 AM KST")).toBeInTheDocument();
    expect(screen.getByText("총 3개 저장소")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "오늘의 톱 3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "전체 랭킹" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("TOP 1")[0]).toBeInTheDocument();
    expect(screen.getByText("1위")).toBeInTheDocument();
    expect(screen.getAllByText("acme/rocket")).toHaveLength(2);
    expect(screen.getAllByText("beta/orbit")).toHaveLength(2);
    expect(
      screen.getAllByText("빠르게 배포할 수 있는 로켓 플랫폼입니다."),
    ).toHaveLength(2);
    expect(
      screen.getAllByText("CLI와 워크플로 템플릿으로 배포 단계를 줄여 줍니다."),
    ).toHaveLength(2);
    expect(screen.getAllByText("TypeScript")).toHaveLength(2);
    expect(screen.getAllByText("+120 today")).toHaveLength(2);
    expect(screen.getAllByText("4,200 stars")).toHaveLength(2);
    expect(screen.getAllByText("210 forks")).toHaveLength(2);
    expect(
      screen.getByRole("link", {
        name: "acme/rocket GitHub에서 보기",
      }),
    ).toHaveAttribute("href", "https://github.com/acme/rocket");
    expect(
      screen.queryByText("Trending snapshots will render here later."),
    ).not.toBeInTheDocument();
  });

  it("renders a safe empty state when no latest snapshot exists", async () => {
    getLatestSnapshotPageData.mockResolvedValue(null);

    render(await HomePage());

    expect(
      screen.getByRole("heading", {
        name: "아직 오늘의 스냅샷이 도착하지 않았습니다",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("크론 수집이 끝나면 한국어 큐레이션과 함께 여기에 정리됩니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Trending snapshots will render here later."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "The base app is ready for the daily GitHub Trending pipeline and future archive views.",
      ),
    ).not.toBeInTheDocument();
  });
});
