import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readGlobalsCss() {
  const filePath = path.resolve(process.cwd(), "src/app/globals.css");

  return fs.readFileSync(filePath, "utf8").replace(/\s+/g, " ");
}

describe("archive date picker css", () => {
  it("styles the archive picker as a calendar popover and aligns hero meta boxes", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.hero-panel__meta\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*stretch;/,
    );
    expect(css).toMatch(
      /\.meta-chip\s*\{[^}]*min-height:\s*72px;[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__trigger\s*\{[^}]*min-height:\s*72px;[^}]*border:\s*var\(--border-md\);[^}]*box-shadow:\s*var\(--shadow-md\);/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__popover\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*10;/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__day\[disabled\]\s*\{[^}]*opacity:\s*0\.35;/,
    );
    expect(css).toMatch(
      /\.archive-date-picker__label\s*\{[^}]*font-size:\s*0\.72rem;[^}]*text-transform:\s*uppercase;/,
    );
    expect(css).not.toMatch(/\.archive-date-picker__control\s*\{/);
  });
});
