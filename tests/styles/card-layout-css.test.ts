import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readGlobalsCss() {
  const filePath = path.resolve(process.cwd(), "src/app/globals.css");

  return fs.readFileSync(filePath, "utf8").replace(/\s+/g, " ");
}

describe("card layout css", () => {
  it("keeps top-three and ranking metadata boxes compact", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.top-card__meta\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*width:\s*fit-content;/,
    );
    expect(css).toMatch(
      /\.repo-card__meta\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*width:\s*fit-content;/,
    );
  });

  it("lets ranking-card summaries use the full content width", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.repo-card__content\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;/,
    );
    expect(css).toMatch(
      /\.repo-card__summary-block\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;/,
    );
  });
});
