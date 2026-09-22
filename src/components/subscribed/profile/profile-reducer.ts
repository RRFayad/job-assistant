import type {
  Profile,
  ProfileHeader,
  ProfileSection,
} from "@/lib/backend/profile";

export type ProfileAction =
  | { type: "UPDATE_HEADER"; header: ProfileHeader }
  | { type: "ADD_SECTION"; sectionType: ProfileSection["type"] }
  | { type: "REMOVE_SECTION"; sectionId: string }
  | { type: "RENAME_SECTION"; sectionId: string; title: string }
  | { type: "UPDATE_SECTION"; section: ProfileSection }
  | { type: "MOVE_SECTION"; sectionId: string; direction: "up" | "down" };

const createSection = (sectionType: ProfileSection["type"]): ProfileSection => {
  const id = crypto.randomUUID();
  const title = "New Section";

  switch (sectionType) {
    case "text":
      return { id, type: "text", title, body: "" };
    case "tags":
      return { id, type: "tags", title, categories: [] };
    case "entries":
      return { id, type: "entries", title, entries: [] };
    case "list":
      return { id, type: "list", title, items: [] };
    case "pairs":
      return { id, type: "pairs", title, pairs: [] };
  }
};

const moveSection = (
  sections: ProfileSection[],
  sectionId: string,
  direction: "up" | "down",
): ProfileSection[] => {
  const index = sections.findIndex((section) => section.id === sectionId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || targetIndex < 0 || targetIndex >= sections.length) {
    return sections;
  }

  const next = [...sections];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
};

export const profileReducer = (
  state: Profile,
  action: ProfileAction,
): Profile => {
  switch (action.type) {
    case "UPDATE_HEADER":
      return { ...state, header: action.header };

    case "ADD_SECTION":
      return {
        ...state,
        sections: [...state.sections, createSection(action.sectionType)],
      };

    case "REMOVE_SECTION":
      return {
        ...state,
        sections: state.sections.filter(
          (section) => section.id !== action.sectionId,
        ),
      };

    case "RENAME_SECTION":
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === action.sectionId
            ? { ...section, title: action.title }
            : section,
        ),
      };

    case "UPDATE_SECTION":
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === action.section.id ? action.section : section,
        ),
      };

    case "MOVE_SECTION": {
      const sections = moveSection(
        state.sections,
        action.sectionId,
        action.direction,
      );
      return sections === state.sections ? state : { ...state, sections };
    }

    default:
      return state;
  }
};
