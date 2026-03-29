import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getLatestSnapshotPageData } = vi.hoisted(() => ({
  getLatestSnapshotPageData: vi.fn(),
}));

import HomePage from "@/app/page";

vi.mock("@/lib/snapshots/queries", () => ({
  getLatestSnapshotPageData,
}));

describe("HomePage smoke test", () => {
  it("renders only the homepage safe empty state when no latest snapshot is available", async () => {
    getLatestSnapshotPageData.mockResolvedValue(null);

    render(await HomePage());

    expect(getLatestSnapshotPageData).toHaveBeenCalled();
    expect(
      screen.getByText("The latest GitHub Trending snapshot is not available yet."),
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
