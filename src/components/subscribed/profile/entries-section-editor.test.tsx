import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EntriesSection } from "@/types/profile";

import { EntriesSectionEditor } from "./entries-section-editor";

const section: EntriesSection = {
  id: "s1",
  type: "entries",
  title: "Experience",
  entries: [
    { id: "e1", heading: "Engineer, Acme", dates: "2020 - 2022", body: "" },
    {
      id: "e2",
      heading: "Senior Engineer, Acme",
      dates: "2022 - Present",
      body: "",
    },
  ],
};

describe("EntriesSectionEditor", () => {
  it("appends a blank entry when Add entry is clicked", () => {
    const onChange = vi.fn();
    render(
      <EntriesSectionEditor
        section={section}
        accentColor="#2f8f7a"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add entry" }));

    const call = onChange.mock.calls[0][0] as EntriesSection;
    expect(call.entries).toHaveLength(3);
    expect(call.entries[2]).toMatchObject({
      heading: "",
      dates: "",
      body: "",
    });
    expect(call.entries[0]).toBe(section.entries[0]);
    expect(call.entries[1]).toBe(section.entries[1]);
  });

  it("updates only the edited entry's heading", () => {
    const onChange = vi.fn();
    render(
      <EntriesSectionEditor
        section={section}
        accentColor="#2f8f7a"
        onChange={onChange}
      />,
    );

    const headingInputs = screen.getAllByLabelText("Entry heading");
    fireEvent.change(headingInputs[0], {
      target: { value: "Staff Engineer, Acme" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      entries: [
        { ...section.entries[0], heading: "Staff Engineer, Acme" },
        section.entries[1],
      ],
    });
  });

  it("removes an entry, preserving the order of the rest", () => {
    const onChange = vi.fn();
    render(
      <EntriesSectionEditor
        section={section}
        accentColor="#2f8f7a"
        onChange={onChange}
      />,
    );

    const removeButtons = screen.getAllByRole("button", {
      name: "Remove entry",
    });
    fireEvent.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      entries: [section.entries[1]],
    });
  });
});
