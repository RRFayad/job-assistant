import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PairsSection } from "@/lib/backend/profile";

import { PairsSectionEditor } from "./pairs-section-editor";

const section: PairsSection = {
  id: "s1",
  type: "pairs",
  title: "Languages",
  pairs: [
    { id: "p1", left: "Portuguese", right: "Native" },
    { id: "p2", left: "English", right: "Fluent" },
  ],
};

describe("PairsSectionEditor", () => {
  it("appends a blank pair when Add is clicked", () => {
    const onChange = vi.fn();
    render(<PairsSectionEditor section={section} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    const call = onChange.mock.calls[0][0] as PairsSection;
    expect(call.pairs).toHaveLength(3);
    expect(call.pairs[2]).toMatchObject({ left: "", right: "" });
    expect(call.pairs[0]).toBe(section.pairs[0]);
    expect(call.pairs[1]).toBe(section.pairs[1]);
  });

  it("updates only the edited pair's value", () => {
    const onChange = vi.fn();
    render(<PairsSectionEditor section={section} onChange={onChange} />);

    const values = screen.getAllByLabelText("Value");
    fireEvent.change(values[0], { target: { value: "Native speaker" } });

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      pairs: [
        { ...section.pairs[0], right: "Native speaker" },
        section.pairs[1],
      ],
    });
  });

  it("removes a pair, preserving the order of the rest", () => {
    const onChange = vi.fn();
    render(<PairsSectionEditor section={section} onChange={onChange} />);

    const removeButtons = screen.getAllByRole("button", {
      name: "Remove pair",
    });
    fireEvent.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith({
      ...section,
      pairs: [section.pairs[1]],
    });
  });
});
