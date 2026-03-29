import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SnapshotHero } from "@/components/trending/snapshot-hero";

const snapshot = {
  snapshotDate: "2026-03-29",
  capturedAtIso: "2026-03-29T00:15:00.000Z",
  capturedAtLabel: "Captured Mar 29, 2026, 9:15 AM KST",
  totalCount: 13,
  topThree: [],
  items: [],
};

describe("SnapshotHero", () => {
  it("marks the latest snapshot heading as a single-line title target", () => {
    render(<SnapshotHero snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", { name: "가장 최근 GitHub 트렌드 스냅샷" }),
    ).toHaveClass("hero-panel__title--latest");
  });

  it("does not apply the single-line title class to archive headings", () => {
    render(<SnapshotHero snapshot={snapshot} mode="archive" />);

    expect(
      screen.getByRole("heading", { name: "2026-03-29 아카이브 호" }),
    ).not.toHaveClass("hero-panel__title--latest");
  });
});
