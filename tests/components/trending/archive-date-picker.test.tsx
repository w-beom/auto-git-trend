import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { push, prefetch } = vi.hoisted(() => ({
  push: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    prefetch,
  }),
}));

import { ArchiveDatePicker } from "@/components/trending/archive-date-picker";

describe("ArchiveDatePicker", () => {
  beforeEach(() => {
    push.mockReset();
    prefetch.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the current date in the closed state", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-31", "2026-03-30", "2026-03-28"]}
        currentDate="2026-03-30"
      />,
    );

    expect(
      screen.getByRole("button", { name: "아카이브 날짜 2026-03-30" }),
    ).toBeInTheDocument();
  });

  it("opens a calendar month view and disables dates that are not stored", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-31", "2026-03-30", "2026-03-28"]}
        currentDate="2026-03-30"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "아카이브 날짜 2026-03-30" }));

    const dialog = screen.getByRole("dialog", { name: "아카이브 날짜 선택" });
    expect(within(dialog).getByRole("button", { name: "2026-03-31" })).toBeEnabled();
    expect(within(dialog).getByRole("button", { name: "2026-03-30" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(dialog).getByRole("button", { name: "2026-03-29" })).toBeDisabled();
  });

  it("routes stored older dates to archive pages and the latest date to the homepage", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-31", "2026-03-30", "2026-03-28"]}
        currentDate="2026-03-30"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "아카이브 날짜 2026-03-30" }));
    fireEvent.click(screen.getByRole("button", { name: "2026-03-28" }));
    expect(push).toHaveBeenLastCalledWith("/archive/2026-03-28");

    fireEvent.click(screen.getByRole("button", { name: "아카이브 날짜 2026-03-30" }));
    fireEvent.click(screen.getByRole("button", { name: "2026-03-31" }));
    expect(push).toHaveBeenLastCalledWith("/");
  });

  it("prefetches visible stored dates when the calendar opens", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-31", "2026-03-30", "2026-03-28", "2026-02-27"]}
        currentDate="2026-03-30"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "아카이브 날짜 2026-03-30" }));

    expect(prefetch).toHaveBeenCalledWith("/");
    expect(prefetch).toHaveBeenCalledWith("/archive/2026-03-30");
    expect(prefetch).toHaveBeenCalledWith("/archive/2026-03-28");
    expect(prefetch).not.toHaveBeenCalledWith("/archive/2026-02-27");
  });

  it("renders nothing when fewer than two dates are available", () => {
    const { container } = render(
      <ArchiveDatePicker dates={["2026-03-31"]} currentDate="2026-03-31" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("emits a navigation diagnostic when a stored date is selected", () => {
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});

    render(
      <ArchiveDatePicker
        dates={["2026-03-31", "2026-03-30", "2026-03-28"]}
        currentDate="2026-03-30"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "아카이브 날짜 2026-03-30" }));
    fireEvent.click(screen.getByRole("button", { name: "2026-03-28" }));

    expect(consoleInfo).toHaveBeenCalledWith(
      "[snapshot-diag] navigation",
      expect.objectContaining({
        currentDate: "2026-03-30",
        nextDate: "2026-03-28",
        targetRoute: "/archive/2026-03-28",
      }),
    );
  });
});
