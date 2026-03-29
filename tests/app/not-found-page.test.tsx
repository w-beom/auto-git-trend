import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import GlobalNotFoundPage from "@/app/not-found";
import ArchiveNotFoundPage from "@/app/archive/[date]/not-found";

describe("NotFoundPage", () => {
  it("renders generic copy for the app-wide 404 state", () => {
    render(<GlobalNotFoundPage />);

    expect(
      screen.getByRole("heading", {
        name: "요청한 페이지를 찾지 못했습니다",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("주소가 바뀌었거나 아직 준비되지 않은 페이지일 수 있습니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("요청한 아카이브 호를 찾지 못했습니다"),
    ).not.toBeInTheDocument();
  });

  it("renders archive-specific copy for archive not-found states", () => {
    render(<ArchiveNotFoundPage />);

    expect(
      screen.getByRole("heading", {
        name: "요청한 아카이브 호를 찾지 못했습니다",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("해당 날짜의 GitHub Trending 스냅샷이 아직 없거나 보관되지 않았습니다."),
    ).toBeInTheDocument();
  });
});
