import { describe, expect, it } from "vitest";

import { extractReadmeText } from "@/lib/github/extract-readme-text";

describe("extractReadmeText", () => {
  it("removes html tags, badges, and markdown image noise while keeping readable README text", () => {
    const readme = [
      "<br />",
      '<img src="https://example.com/logo.svg" alt="Logo" width="600">',
      "",
      '[![Twitter](https://img.shields.io/twitter)](https://x.com/example)',
      '<a href="https://codespaces.new/example/repo">',
      '  <img src="https://github.com/codespaces/badge.svg" height="20" />',
      "</a>",
      "",
      "# Open Data Platform",
      "",
      "Open Data Platform by OpenBB (ODP) is the open-source toolset that helps data engineers.",
      "",
      "Get started with: `pip install openbb`",
      "",
      "```python",
      "from openbb import obb",
      "```",
      "",
      "Data integrations available can be found here: <https://docs.openbb.co/python/reference>",
    ].join("\n");

    const result = extractReadmeText(readme);

    expect(result).toContain("Open Data Platform");
    expect(result).toContain(
      "Open Data Platform by OpenBB (ODP) is the open-source toolset that helps data engineers.",
    );
    expect(result).toContain("Get started with: pip install openbb");
    expect(result).toContain("https://docs.openbb.co/python/reference");
    expect(result).not.toContain("<img");
    expect(result).not.toContain("<a ");
    expect(result).not.toContain("[![Twitter]");
    expect(result).not.toContain("```");
    expect(result).not.toContain("from openbb import obb");
  });
});
