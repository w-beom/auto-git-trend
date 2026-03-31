import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchiveDateList } from "@/components/trending/archive-date-list";

describe("ArchiveDateList", () => {
  it("renders every archive date as a descending link list", () => {
    render(<ArchiveDateList dates={["2026-03-29", "2026-03-28", "2026-03-27"]} />);

    const section = screen.getByRole("region", { name: "아카이브" });
    const links = within(section).getAllByRole("link");

    expect(within(section).getByRole("heading", { name: "아카이브" })).toBeInTheDocument();
    expect(links.map((link) => link.textContent)).toEqual([
      "2026-03-29",
      "2026-03-28",
      "2026-03-27",
    ]);
    expect(links[0]).toHaveAttribute("href", "/archive/2026-03-29");
    expect(links[0]).toHaveAccessibleName("2026-03-29 아카이브 보기");
  });

  it("renders nothing when no archive dates are available", () => {
    const { container } = render(<ArchiveDateList dates={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
