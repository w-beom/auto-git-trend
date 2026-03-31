import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readGlobalsCss() {
  const filePath = path.resolve(process.cwd(), "src/app/globals.css");

  return fs.readFileSync(filePath, "utf8").replace(/\s+/g, " ");
}

describe("archive date list css", () => {
  it("styles archive dates as wrapped editorial chips", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.archive-date-list\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*gap:/,
    );
    expect(css).toMatch(
      /\.archive-date-list__link\s*\{[^}]*display:\s*inline-flex;[^}]*border:\s*var\(--border-md\);[^}]*box-shadow:\s*var\(--shadow-md\);/,
    );
    expect(css).toMatch(
      /\.archive-date-list__link:hover,\s*\.archive-date-list__link:focus-visible\s*\{[^}]*transform:\s*translate\(-2px,\s*-2px\);/,
    );
  });
});
