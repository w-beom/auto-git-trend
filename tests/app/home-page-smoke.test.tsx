import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function SmokeFixture() {
  return <h1>Vitest and RTL smoke works</h1>;
}

describe("HomePage smoke test", () => {
  it("renders the bootstrap placeholder through RTL", () => {
    render(<SmokeFixture />);

    expect(
      screen.getByRole("heading", { name: "Vitest and RTL smoke works" }),
    ).toBeInTheDocument();
  });
});
