import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage smoke test", () => {
  it("renders the real placeholder heading and body copy", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "Trending snapshots will render here later.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The base app is ready for the daily GitHub Trending pipeline and future archive views.",
      ),
    ).toBeInTheDocument();
  });
});
