import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSnapshotPageDataByDate, notFound } = vi.hoisted(() => ({
  getSnapshotPageDataByDate: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import ArchivePage from "@/app/archive/[date]/page";

vi.mock("@/lib/snapshots/queries", () => ({
  getSnapshotPageDataByDate,
}));

vi.mock("next/navigation", () => ({
  notFound,
}));

function buildSnapshot() {
  return {
    snapshotDate: "2026-03-28",
    capturedAtIso: "2026-03-28T00:20:00.000Z",
    capturedAtLabel: "Captured Mar 28, 2026, 9:20 AM KST",
    totalCount: 1,
    topThree: [
      {
        rank: 1,
        fullName: "gamma/comet",
        summaryKo: "정적 사이트 배포 흐름을 단순화합니다.",
      },
    ],
    items: [
      {
        rank: 1,
        fullName: "gamma/comet",
        owner: "gamma",
        name: "comet",
        githubUrl: "https://github.com/gamma/comet",
        summaryKo: "정적 사이트 배포 흐름을 단순화합니다.",
        description: "Static deploy automation.",
        readmeExcerpt: "릴리스 체크리스트와 배포 로그를 한 흐름으로 묶습니다.",
        primaryLanguage: "Go",
        starsToday: 77,
        starsTotal: 1800,
        forksTotal: 44,
        avatarUrl: "https://example.com/gamma.png",
      },
    ],
  };
}

describe("ArchivePage", () => {
  beforeEach(() => {
    getSnapshotPageDataByDate.mockReset();
    notFound.mockClear();
  });

  it("renders the requested snapshot date", async () => {
    getSnapshotPageDataByDate.mockResolvedValue(buildSnapshot());

    render(
      await ArchivePage({
        params: Promise.resolve({ date: "2026-03-28" }),
      }),
    );

    expect(getSnapshotPageDataByDate).toHaveBeenCalledWith("2026-03-28");
    expect(
      screen.getByRole("heading", {
        name: "2026-03-28 아카이브 호",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("지난 트렌드를 다시 읽는 하루치 오픈소스 다이제스트")).toBeInTheDocument();
    expect(screen.getByText("Captured Mar 28, 2026, 9:20 AM KST")).toBeInTheDocument();
    expect(screen.getAllByText("gamma/comet")).toHaveLength(2);
    expect(screen.getByText("1위")).toBeInTheDocument();
    expect(screen.queryByText("Go")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "gamma/comet GitHub에서 보기" })).toHaveAttribute(
      "href",
      "https://github.com/gamma/comet",
    );
    expect(screen.getByText("총 1개 저장소")).toBeInTheDocument();
    expect(
      screen.queryByText("릴리스 체크리스트와 배포 로그를 한 흐름으로 묶습니다."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Static deploy automation."),
    ).not.toBeInTheDocument();
  });

  it("uses notFound when the snapshot date does not exist", async () => {
    getSnapshotPageDataByDate.mockResolvedValue(null);

    await expect(
      ArchivePage({
        params: Promise.resolve({ date: "2026-03-27" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getSnapshotPageDataByDate).toHaveBeenCalledWith("2026-03-27");
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
