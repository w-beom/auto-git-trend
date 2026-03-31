import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readGlobalsCss() {
  const filePath = path.resolve(process.cwd(), "src/app/globals.css");

  return fs.readFileSync(filePath, "utf8").replace(/\s+/g, " ");
}

describe("archive date picker css", () => {
  it("styles the hero archive picker like a meta control", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.archive-date-picker\s*\{[^}]*display:\s*grid;[^}]*gap:/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__control\s*\{[^}]*border:\s*var\(--border-md\);[^}]*box-shadow:\s*var\(--shadow-md\);/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__label\s*\{[^}]*font-size:\s*0\.72rem;[^}]*text-transform:\s*uppercase;/,
    );
    expect(css).not.toMatch(/\.archive-date-list\s*\{/);
  });
});
