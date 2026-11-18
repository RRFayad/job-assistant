import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders the title and description", () => {
    render(<PageHeader title="Profile" description="Coming soon" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Profile" }),
    ).toBeDefined();
    expect(screen.getByText("Coming soon")).toBeDefined();
  });

  it("omits the description when none is given", () => {
    render(<PageHeader title="Profile" />);

    expect(screen.queryByText("Coming soon")).toBeNull();
  });
});
