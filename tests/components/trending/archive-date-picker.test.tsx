import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

import { ArchiveDatePicker } from "@/components/trending/archive-date-picker";

describe("ArchiveDatePicker", () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the current date as the selected value", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-29", "2026-03-28", "2026-03-27"]}
        currentDate="2026-03-28"
      />,
    );

    expect(screen.getByLabelText("아카이브 날짜")).toHaveValue("2026-03-28");
  });

  it("routes older dates to archive pages and the latest date to the homepage", () => {
    render(
      <ArchiveDatePicker
        dates={["2026-03-29", "2026-03-28", "2026-03-27"]}
        currentDate="2026-03-29"
      />,
    );

    fireEvent.change(screen.getByLabelText("아카이브 날짜"), {
      target: { value: "2026-03-27" },
    });
    expect(push).toHaveBeenLastCalledWith("/archive/2026-03-27");

    fireEvent.change(screen.getByLabelText("아카이브 날짜"), {
      target: { value: "2026-03-29" },
    });
    expect(push).toHaveBeenLastCalledWith("/");
  });

  it("renders nothing when fewer than two dates are available", () => {
    const { container } = render(
      <ArchiveDatePicker dates={["2026-03-29"]} currentDate="2026-03-29" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
