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
    capturedAtLabel: "Captured Mar 28, 2026, 12:20 AM UTC",
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
    expect(screen.getByText("2026-03-28")).toBeInTheDocument();
    expect(screen.getByText("gamma/comet")).toBeInTheDocument();
    expect(screen.getByText("1 repositories captured")).toBeInTheDocument();
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
