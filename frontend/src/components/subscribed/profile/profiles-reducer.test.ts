import { describe, expect, it } from "vitest";

import type { Profile } from "@/types/profile";

import { profilesReducer, type ProfilesState } from "./profiles-reducer";

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
  sections: [{ id: `${id}-s1`, type: "text", title: "Summary", body: "hi" }],
});

const oneProfileState: ProfilesState = {
  profiles: [makeProfile("1", "Profile One")],
  selectedId: "1",
};

const twoProfileState: ProfilesState = {
  profiles: [makeProfile("1", "Profile One"), makeProfile("2", "Profile Two")],
  selectedId: "1",
};

const threeProfileState: ProfilesState = {
  profiles: [
    makeProfile("1", "Profile One"),
    makeProfile("2", "Profile Two"),
    makeProfile("3", "Profile Three"),
  ],
  selectedId: "1",
};

describe("profilesReducer", () => {
  describe("CREATE_BLANK", () => {
    it("appends a new blank Profile and selects it", () => {
      const result = profilesReducer(oneProfileState, { type: "CREATE_BLANK" });

      expect(result.profiles).toHaveLength(2);
      const created = result.profiles[1];
      expect(created.header.fullName).toBe("");
      expect(created.sections).toEqual([]);
      expect(result.selectedId).toBe(created.id);
      expect(created.id).not.toBe("1");
    });

    it("is a no-op at the 3-Profile cap", () => {
      const result = profilesReducer(threeProfileState, {
        type: "CREATE_BLANK",
      });

      expect(result).toBe(threeProfileState);
    });

    it("disambiguates the default name when one already exists", () => {
      const withOneBlank = profilesReducer(oneProfileState, {
        type: "CREATE_BLANK",
      });
      const withTwoBlanks = profilesReducer(withOneBlank, {
        type: "CREATE_BLANK",
      });

      expect(withOneBlank.profiles[1].name).toBe("New Profile");
      expect(withTwoBlanks.profiles[2].name).toBe("New Profile 2");
    });
  });

  describe("DUPLICATE", () => {
    it("deep-copies the source Profile with a new id and '{name} copy'", () => {
      const result = profilesReducer(oneProfileState, {
        type: "DUPLICATE",
        profileId: "1",
      });

      expect(result.profiles).toHaveLength(2);
      const duplicate = result.profiles[1];
      expect(duplicate.id).not.toBe("1");
      expect(duplicate.name).toBe("Profile One copy");
      expect(duplicate.header).toEqual(oneProfileState.profiles[0].header);
      expect(duplicate.header).not.toBe(oneProfileState.profiles[0].header);
      expect(duplicate.sections).toEqual(oneProfileState.profiles[0].sections);
      expect(duplicate.sections).not.toBe(oneProfileState.profiles[0].sections);
      expect(result.selectedId).toBe(duplicate.id);
    });

    it("disambiguates the name when duplicating the same Profile twice", () => {
      const once = profilesReducer(oneProfileState, {
        type: "DUPLICATE",
        profileId: "1",
      });
      const twice = profilesReducer(once, {
        type: "DUPLICATE",
        profileId: "1",
      });

      expect(once.profiles[1].name).toBe("Profile One copy");
      expect(twice.profiles[2].name).toBe("Profile One copy 2");
    });

    it("editing the original afterward does not affect the duplicate", () => {
      const afterDuplicate = profilesReducer(oneProfileState, {
        type: "DUPLICATE",
        profileId: "1",
      });
      const duplicateId = afterDuplicate.profiles[1].id;

      // DUPLICATE leaves the new copy selected; select the original back
      // before editing it, since edits apply to the selected Profile.
      const withOriginalSelected = profilesReducer(afterDuplicate, {
        type: "SELECT",
        profileId: "1",
      });
      const afterEditingOriginal = profilesReducer(withOriginalSelected, {
        type: "UPDATE_HEADER",
        header: {
          ...withOriginalSelected.profiles[0].header,
          fullName: "Changed",
        },
      });

      const duplicateProfile = afterEditingOriginal.profiles.find(
        (p) => p.id === duplicateId,
      );
      expect(duplicateProfile?.header.fullName).toBe("Full Name 1");
    });

    it("is a no-op at the 3-Profile cap", () => {
      const result = profilesReducer(threeProfileState, {
        type: "DUPLICATE",
        profileId: "1",
      });

      expect(result).toBe(threeProfileState);
    });
  });

  describe("IMPORT_PROFILE", () => {
    it("appends the given Profile and selects it", () => {
      const imported = makeProfile("imported-1", "Uploaded Resume");

      const result = profilesReducer(oneProfileState, {
        type: "IMPORT_PROFILE",
        profile: imported,
      });

      expect(result.profiles).toHaveLength(2);
      expect(result.profiles[0]).toEqual(oneProfileState.profiles[0]);
      expect(result.profiles[1].name).toBe("Uploaded Resume");
      expect(result.selectedId).toBe(result.profiles[1].id);
    });

    it("assigns a fresh id rather than reusing the imported Profile's own id", () => {
      const imported = makeProfile("imported-1", "Uploaded Resume");

      const result = profilesReducer(oneProfileState, {
        type: "IMPORT_PROFILE",
        profile: imported,
      });

      expect(result.profiles[1].id).not.toBe("imported-1");
    });

    it("is a no-op at the 3-Profile cap", () => {
      const imported = makeProfile("imported-1", "Uploaded Resume");

      const result = profilesReducer(threeProfileState, {
        type: "IMPORT_PROFILE",
        profile: imported,
      });

      expect(result).toBe(threeProfileState);
    });

    it("disambiguates the name when it collides with an existing Profile", () => {
      const imported = makeProfile("imported-1", "Profile One");

      const result = profilesReducer(oneProfileState, {
        type: "IMPORT_PROFILE",
        profile: imported,
      });

      expect(result.profiles[1].name).toBe("Profile One 2");
    });

    it("deep-copies the imported Profile so it doesn't share references", () => {
      const imported = makeProfile("imported-1", "Uploaded Resume");

      const result = profilesReducer(oneProfileState, {
        type: "IMPORT_PROFILE",
        profile: imported,
      });

      expect(result.profiles[1].header).toEqual(imported.header);
      expect(result.profiles[1].header).not.toBe(imported.header);
      expect(result.profiles[1].sections).toEqual(imported.sections);
      expect(result.profiles[1].sections).not.toBe(imported.sections);
    });
  });

  describe("DELETE", () => {
    it("removes the matching Profile", () => {
      const result = profilesReducer(twoProfileState, {
        type: "DELETE",
        profileId: "2",
      });

      expect(result.profiles.map((p) => p.id)).toEqual(["1"]);
    });

    it("selects a remaining Profile if the selected one was deleted", () => {
      const result = profilesReducer(twoProfileState, {
        type: "DELETE",
        profileId: "1",
      });

      expect(result.selectedId).toBe("2");
    });

    it("is a no-op when it would remove the last remaining Profile", () => {
      const result = profilesReducer(oneProfileState, {
        type: "DELETE",
        profileId: "1",
      });

      expect(result).toBe(oneProfileState);
    });
  });

  describe("SELECT", () => {
    it("changes the selected id", () => {
      const result = profilesReducer(twoProfileState, {
        type: "SELECT",
        profileId: "2",
      });

      expect(result.selectedId).toBe("2");
      expect(result.profiles).toBe(twoProfileState.profiles);
    });

    it("is a no-op when selecting the already-active Profile", () => {
      const result = profilesReducer(twoProfileState, {
        type: "SELECT",
        profileId: "1",
      });

      expect(result).toBe(twoProfileState);
    });
  });

  describe("RENAME_PROFILE", () => {
    it("renames the matching Profile without touching others", () => {
      const result = profilesReducer(twoProfileState, {
        type: "RENAME_PROFILE",
        profileId: "1",
        name: "New Name",
      });

      expect(result.profiles[0].name).toBe("New Name");
      expect(result.profiles[1]).toBe(twoProfileState.profiles[1]);
    });
  });

  describe("delegating Profile-editing actions to the selected Profile", () => {
    it("UPDATE_HEADER only changes the selected Profile", () => {
      const result = profilesReducer(twoProfileState, {
        type: "UPDATE_HEADER",
        header: { ...twoProfileState.profiles[0].header, fullName: "New" },
      });

      expect(result.profiles[0].header.fullName).toBe("New");
      expect(result.profiles[1]).toBe(twoProfileState.profiles[1]);
    });
  });
});
