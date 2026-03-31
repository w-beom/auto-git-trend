import * as archivePageModule from "@/app/archive/[date]/page";
import * as homePageModule from "@/app/page";

import { describe, expect, it } from "vitest";

describe("page cache config", () => {
  it("revalidates snapshot pages instead of forcing dynamic rendering", () => {
    expect(homePageModule.revalidate).toBeGreaterThan(0);
    expect("dynamic" in homePageModule).toBe(false);
    expect(archivePageModule.revalidate).toBeGreaterThan(0);
    expect("dynamic" in archivePageModule).toBe(false);
  });
});
