import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getLatestSnapshotPageData, getSnapshotArchiveDates } = vi.hoisted(() => ({
  getLatestSnapshotPageData: vi.fn(),
  getSnapshotArchiveDates: vi.fn(),
}));

import HomePage from "@/app/page";

vi.mock("@/lib/snapshots/queries", () => ({
  getLatestSnapshotPageData,
  getSnapshotArchiveDates,
}));

describe("HomePage smoke test", () => {
  it("renders only the homepage safe empty state when no latest snapshot is available", async () => {
    getLatestSnapshotPageData.mockResolvedValue(null);
    getSnapshotArchiveDates.mockResolvedValue(["2026-03-29"]);

    render(await HomePage());

    expect(getLatestSnapshotPageData).toHaveBeenCalled();
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
    expect(screen.queryByRole("region", { name: "아카이브" })).not.toBeInTheDocument();
  });
});
