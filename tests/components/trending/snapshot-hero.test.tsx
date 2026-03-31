import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SnapshotHero } from "@/components/trending/snapshot-hero";

vi.mock("@/components/trending/archive-date-picker", () => ({
  ArchiveDatePicker: ({
    dates,
    currentDate,
  }: {
    dates: string[];
    currentDate: string;
  }) => <div data-testid="archive-date-picker">{`${currentDate}:${dates.join(",")}`}</div>,
}));

const snapshot = {
  snapshotDate: "2026-03-29",
  capturedAtIso: "2026-03-29T00:15:00.000Z",
  capturedAtLabel: "Captured Mar 29, 2026, 9:15 AM KST",
  totalCount: 13,
  topThree: [],
  items: [],
};

describe("SnapshotHero", () => {
  afterEach(() => {
    cleanup();
  });

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

  it("renders the archive picker in the hero when multiple archive dates exist", () => {
    render(
      <SnapshotHero
        snapshot={snapshot}
        archiveDates={["2026-03-29", "2026-03-28", "2026-03-27"]}
      />,
    );

    expect(screen.getByTestId("archive-date-picker")).toHaveTextContent(
      "2026-03-29:2026-03-29,2026-03-28,2026-03-27",
    );
  });

  it("passes the archive snapshot date into the picker on archive pages", () => {
    render(
      <SnapshotHero
        snapshot={{ ...snapshot, snapshotDate: "2026-03-28" }}
        archiveDates={["2026-03-29", "2026-03-28", "2026-03-27"]}
        mode="archive"
      />,
    );

    expect(screen.getByTestId("archive-date-picker")).toHaveTextContent(
      "2026-03-28:2026-03-29,2026-03-28,2026-03-27",
    );
  });
});
