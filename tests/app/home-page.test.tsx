import { act, cleanup, render, screen } from "@testing-library/react";
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
    capturedAtLabel: "Captured Mar 29, 2026, 12:15 AM UTC",
    totalCount: 2,
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
        primaryLanguage: "Python",
        starsToday: 95,
        starsTotal: 3100,
        forksTotal: 155,
        avatarUrl: "https://example.com/beta.png",
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

    await act(async () => {
      render(<HomePage />);
    });

    expect(getLatestSnapshotPageData).toHaveBeenCalled();
    expect(await screen.findByText("2026-03-29")).toBeInTheDocument();
    expect(
      await screen.findByText("Captured Mar 29, 2026, 12:15 AM UTC"),
    ).toBeInTheDocument();
    expect(await screen.findByText("2 repositories captured")).toBeInTheDocument();
    expect(await screen.findByText("acme/rocket")).toBeInTheDocument();
    expect(await screen.findByText("beta/orbit")).toBeInTheDocument();
    expect(
      await screen.findByText("빠르게 배포할 수 있는 로켓 플랫폼입니다."),
    ).toBeInTheDocument();
  });

  it("renders a safe empty state when no latest snapshot exists", async () => {
    getLatestSnapshotPageData.mockResolvedValue(null);

    await act(async () => {
      render(<HomePage />);
    });

    expect(
      await screen.findByText("The latest GitHub Trending snapshot is not available yet."),
    ).toBeInTheDocument();
  });
});
