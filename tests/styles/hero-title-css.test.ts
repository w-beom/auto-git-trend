import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readGlobalsCss() {
  const filePath = path.resolve(process.cwd(), "src/app/globals.css");

  return fs.readFileSync(filePath, "utf8").replace(/\s+/g, " ");
}

describe("hero title css", () => {
  it("keeps the latest snapshot title on one line", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.hero-panel__title--latest\s*\{[^}]*white-space:\s*nowrap;/,
    );
  });
});
