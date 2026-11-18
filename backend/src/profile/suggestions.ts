import type {
  ProfileHeader,
  ProfileSection,
  SuggestionTarget,
} from "@app/shared/schemas";

// Every suggestion here is a hardcoded, obviously-canned transformation —
// no real AI. The contract this stands in for (propose a full replacement
// object, never mutate silently) is what a real integration gets built
// against later; see ADR-0005 (Grounding) and ADR-0006 (AI suggestions
// never silently overwrite data).

const suggestHeader = (header: ProfileHeader): ProfileHeader => {
  // TODO: replace with a real AI-generated suggestion.
  return {
    ...header,
    careerTitle: `${header.careerTitle} — results-driven professional`,
  };
};

const suggestSection = (section: ProfileSection): ProfileSection => {
  switch (section.type) {
    case "text":
      // TODO: replace with a real AI-generated suggestion.
      return {
        ...section,
        body: `${section.body} This work consistently delivered measurable impact.`,
      };

    case "entries": {
      // TODO: replace with a real AI-generated suggestion.
      if (section.entries.length === 0) return section;
      const lastIndex = section.entries.length - 1;
      return {
        ...section,
        entries: section.entries.map((entry, index) =>
          index === lastIndex
            ? { ...entry, body: `${entry.body} Delivered measurable impact.` }
            : entry,
        ),
      };
    }

    case "list":
      // TODO: replace with a real AI-generated suggestion.
      return {
        ...section,
        items: [...section.items, "AI-suggested addition"],
      };

    case "tags": {
      // TODO: replace with a real AI-generated suggestion.
      if (section.categories.length === 0) return section;
      return {
        ...section,
        categories: section.categories.map((category, index) =>
          index === 0
            ? {
                ...category,
                items: [...category.items, "AI-suggested skill"],
              }
            : category,
        ),
      };
    }

    case "pairs":
      // TODO: replace with a real AI-generated suggestion.
      return {
        ...section,
        pairs: [
          ...section.pairs,
          { id: crypto.randomUUID(), left: "AI Suggested", right: "Value" },
        ],
      };
  }
};

export const suggest = (target: SuggestionTarget): SuggestionTarget => {
  if (target.kind === "header") {
    return { kind: "header", header: suggestHeader(target.header) };
  }

  return { kind: "section", section: suggestSection(target.section) };
};
