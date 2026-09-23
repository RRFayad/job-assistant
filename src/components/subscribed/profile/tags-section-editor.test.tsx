import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TagsSection } from "@/lib/backend/profile";

import { TagsSectionEditor } from "./tags-section-editor";

const section: TagsSection = {
  id: "s1",
  type: "tags",
  title: "Tech Stack",
  categories: [
    { id: "c1", label: "Languages", items: ["TypeScript", "Python"] },
    { id: "c2", label: "Frameworks", items: ["React"] },
  ],
};

describe("TagsSectionEditor", () => {
  it("appends a new category when Add category is clicked", () => {
    const onChange = vi.fn();
    render(<TagsSectionEditor section={section} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Add category" }));

    const call = onChange.mock.calls[0][0] as TagsSection;
    expect(call.categories).toHaveLength(3);
    expect(call.categories[2]).toMatchObject({ items: [] });
    expect(call.categories[0]).toBe(section.categories[0]);
    expect(call.categories[1]).toBe(section.categories[1]);
  });

  it("renames only the edited category", () => {
    const onChange = vi.fn();
    render(<TagsSectionEditor section={section} onChange={onChange} />);

    const labels = screen.getAllByPlaceholderText("Category name");
    fireEvent.change(labels[0], { target: { value: "Core Languages" } });

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      categories: [
        { ...section.categories[0], label: "Core Languages" },
        section.categories[1],
      ],
    });
  });

  it("adds a tag to the correct category on Enter", () => {
    const onChange = vi.fn();
    render(<TagsSectionEditor section={section} onChange={onChange} />);

    const draftInputs = screen.getAllByPlaceholderText("+ Add");
    fireEvent.change(draftInputs[1], { target: { value: "Vue" } }); // Frameworks
    fireEvent.keyDown(draftInputs[1], { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      categories: [
        section.categories[0],
        { ...section.categories[1], items: ["React", "Vue"] },
      ],
    });
  });

  it("adds a tag on blur", () => {
    const onChange = vi.fn();
    render(<TagsSectionEditor section={section} onChange={onChange} />);

    const draftInputs = screen.getAllByPlaceholderText("+ Add");
    fireEvent.change(draftInputs[0], { target: { value: "Rust" } });
    fireEvent.blur(draftInputs[0]);

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      categories: [
        { ...section.categories[0], items: ["TypeScript", "Python", "Rust"] },
        section.categories[1],
      ],
    });
  });

  it("does not add an empty tag", () => {
    const onChange = vi.fn();
    render(<TagsSectionEditor section={section} onChange={onChange} />);

    const draftInputs = screen.getAllByPlaceholderText("+ Add");
    fireEvent.keyDown(draftInputs[0], { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a tag from the correct category, preserving order", () => {
    const onChange = vi.fn();
    render(<TagsSectionEditor section={section} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove TypeScript" }));

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      categories: [
        { ...section.categories[0], items: ["Python"] },
        section.categories[1],
      ],
    });
  });

  it("removes a category, preserving the order of the rest", () => {
    const onChange = vi.fn();
    render(<TagsSectionEditor section={section} onChange={onChange} />);

    const removeCategoryButtons = screen.getAllByRole("button", {
      name: "Remove category",
    });
    fireEvent.click(removeCategoryButtons[0]);

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      categories: [section.categories[1]],
    });
  });
});
