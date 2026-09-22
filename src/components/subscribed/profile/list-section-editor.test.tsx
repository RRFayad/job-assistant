import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ListSection } from "@/lib/backend/profile";

import { ListSectionEditor } from "./list-section-editor";

const section: ListSection = {
  id: "s1",
  type: "list",
  title: "Projects",
  items: ["Alpha", "Beta", "Gamma"],
};

describe("ListSectionEditor", () => {
  it("appends an empty item when Add item is clicked", () => {
    const onChange = vi.fn();
    render(<ListSectionEditor section={section} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      items: ["Alpha", "Beta", "Gamma", ""],
    });
  });

  it("updates only the edited item, preserving the others in order", () => {
    const onChange = vi.fn();
    render(<ListSectionEditor section={section} onChange={onChange} />);

    const textareas = screen.getAllByRole("textbox", { hidden: true });
    // The second textarea corresponds to "Beta" (index 1).
    fireEvent.change(textareas[1], { target: { value: "Beta (edited)" } });

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      items: ["Alpha", "Beta (edited)", "Gamma"],
    });
  });

  it("removes an item from the middle, preserving the order of the rest", () => {
    const onChange = vi.fn();
    render(<ListSectionEditor section={section} onChange={onChange} />);

    const removeButtons = screen.getAllByRole("button", {
      name: "Remove item",
    });
    fireEvent.click(removeButtons[1]); // remove "Beta"

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      items: ["Alpha", "Gamma"],
    });
  });
});
