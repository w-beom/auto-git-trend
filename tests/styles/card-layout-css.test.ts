import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readGlobalsCss() {
  const filePath = path.resolve(process.cwd(), "src/app/globals.css");

  return fs.readFileSync(filePath, "utf8").replace(/\s+/g, " ");
}

describe("card layout css", () => {
  it("turns the top-three section into a single-card carousel with pager dots and desktop nav buttons", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.top-three-carousel__track\s*\{[^}]*grid-auto-flow:\s*column;[^}]*grid-auto-columns:\s*100%;[^}]*overflow-x:\s*auto;[^}]*scroll-snap-type:\s*x mandatory;/,
    );
    expect(css).toMatch(
      /\.top-three-carousel__slide\s*\{[^}]*scroll-snap-align:\s*start;/,
    );
    expect(css).toMatch(
      /\.top-three-carousel__dot\[aria-current="true"\]\s*\{[^}]*background:\s*var\(--ink\);/,
    );
    expect(css).toMatch(
      /\.top-three-carousel__nav\s*\{[^}]*display:\s*none;/,
    );
    expect(css).toMatch(
      /@media\s*\(min-width:\s*1280px\)\s*\{[\s\S]*?\.top-three-carousel__frame\s*\{[^}]*grid-template-columns:\s*auto minmax\(0,\s*1fr\) auto;[^}]*\}[\s\S]*?\.top-three-carousel__nav\s*\{[^}]*display:\s*inline-flex;/,
    );
  });

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

  it("keeps top-three card headers pinned to the top on mobile", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.repo-card__content\s*\{[^}]*align-content:\s*start;/,
    );
  });

  it("animates the desktop carousel and top-three section height between cards", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.top-three-carousel__viewport\s*\{[^}]*overflow:\s*hidden;/,
    );
    expect(css).toMatch(
      /\.top-three-carousel__track\s*\{[^}]*align-items:\s*start;/,
    );
    expect(css).toMatch(
      /\.top-three-carousel__slide\s+\.repo-card--feature\s*\{[^}]*height:\s*auto;/,
    );
    expect(css).toMatch(
      /@media\s*\(min-width:\s*1280px\)\s*\{[\s\S]*?\.top-three-carousel__viewport\s*\{[^}]*height:\s*var\(--top-three-carousel-height\);[^}]*transition:\s*height/,
    );
    expect(css).toMatch(
      /@media\s*\(min-width:\s*1280px\)\s*\{[\s\S]*?\.section-block--top-three\s*\{[^}]*height:\s*var\(--top-three-section-height,\s*auto\);[^}]*overflow:\s*hidden;[^}]*transition:\s*height/,
    );
  });

  it("styles repository cards for top-right detail toggles", () => {
    const css = readGlobalsCss();

    expect(css).toMatch(
      /\.repo-card__masthead\s*\{[^}]*justify-content:\s*space-between;[^}]*align-items:\s*flex-start;/,
    );
    expect(css).toMatch(
      /\.repo-card__masthead-main\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;/,
    );
    expect(css).toMatch(
      /\.repo-card__toggle\s*\{[^}]*display:\s*inline-flex;[^}]*min-width:\s*44px;[^}]*border:\s*var\(--border-md\);/,
    );
    expect(css).toMatch(
      /\.repo-card__toggle--expanded\s*\{[^}]*background:\s*var\(--orange\);/,
    );
  });
});
