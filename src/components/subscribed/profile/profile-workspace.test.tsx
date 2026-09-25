import { fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import type { Profile } from "@/types/profile";

import { ProfileWorkspace } from "./profile-workspace";

vi.mock("@/lib/backend/profile", () => ({
  saveProfile: vi.fn().mockResolvedValue(true),
  fetchProfileSuggestion: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

const makeProfile = (id: string, name: string): Profile => ({
  id,
  name,
  header: {
    fullName: `Full Name ${id}`,
    careerTitle: "Engineer",
    email: "a@example.com",
    phone: "",
    location: "",
    links: [],
    primaryColor: "#000000",
    secondaryColor: "#000000",
  },
  sections: [],
});

describe("ProfileWorkspace", () => {
  it("shows the entry screen (not a dead end) when the user has zero Profiles", () => {
    render(<ProfileWorkspace profiles={[]} />);

    expect(
      screen.getByRole("heading", { name: "Build your Profile" }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Upload your resume/ }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Start from a blank template/ }),
    ).toBeDefined();
  });

  it("goes straight to editing the single existing Profile", () => {
    render(<ProfileWorkspace profiles={[makeProfile("1", "Profile One")]} />);

    expect(screen.getByRole("heading", { name: "Your Profile" })).toBeDefined();
    expect(screen.getByDisplayValue("Full Name 1")).toBeDefined();
  });

  it("lets the user open the entry screen from an existing Profile, and cancel back", () => {
    render(<ProfileWorkspace profiles={[makeProfile("1", "Profile One")]} />);

    fireEvent.click(screen.getByRole("button", { name: "New Profile" }));
    expect(
      screen.getByRole("heading", { name: "Create a new Profile" }),
    ).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", { name: "Back to your Profiles" }),
    );
    expect(screen.getByRole("heading", { name: "Your Profile" })).toBeDefined();
  });

  it("shows the 3-Profile cap toast on the 'New Profile' click itself, not after choosing an option", () => {
    const profiles = [
      makeProfile("1", "Profile One"),
      makeProfile("2", "Profile Two"),
      makeProfile("3", "Profile Three"),
    ];
    render(<ProfileWorkspace profiles={profiles} />);

    fireEvent.click(screen.getByRole("button", { name: "New Profile" }));

    expect(toast.error).toHaveBeenCalledWith(
      "You can only have up to 3 Profiles — delete one first.",
    );
    // Never navigated to the entry screen at all.
    expect(
      screen.queryByRole("heading", { name: "Create a new Profile" }),
    ).toBeNull();
    expect(screen.getByRole("heading", { name: "Your Profile" })).toBeDefined();
  });

  it("lets the user rename a Profile from its chip", () => {
    render(<ProfileWorkspace profiles={[makeProfile("1", "Profile One")]} />);

    fireEvent.click(screen.getByRole("button", { name: "Rename Profile One" }));
    const input = screen.getByRole("textbox", { name: "Profile name" });
    fireEvent.change(input, { target: { value: "Renamed Profile" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(
      screen.getByRole("button", { name: "Renamed Profile" }),
    ).toBeDefined();
  });
});
