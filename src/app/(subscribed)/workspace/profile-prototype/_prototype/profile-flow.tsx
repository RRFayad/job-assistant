"use client";

// PROTOTYPE ONLY — orchestrates the Profile flow: entry (upload / blank /
// duplicate) -> review (upload path only) -> edit (permanent, with a
// switcher across up to MAX_PROFILES Profiles). Per
// docs/adr/0007-collapse-baseline-into-profile.md, Profiles are independent
// once created — duplicating one is a one-time copy, not an ongoing sync.

import { useState } from "react";

import { ProfileEditView } from "./edit-view";
import { ProfileEntryScreen } from "./entry-screen";
import {
  mockHeader,
  mockProfiles,
  mockSections,
  type Profile,
} from "./mock-data";
import { ProfileReviewScreen } from "./review-screen";

type Stage = "entry" | "review" | "edit";

type ProfileFlowProps = {
  simulateReturningCandidate: boolean;
};

const nextProfileName = (count: number) => `Profile ${count + 1}`;

const createBlankProfile = (name: string): Profile => ({
  id: crypto.randomUUID(),
  name,
  header: {
    fullName: "",
    careerTitle: "",
    email: "",
    phone: "",
    location: "",
    links: [],
    primaryColor: "#2563EB",
    secondaryColor: "#334155",
  },
  sections: [],
});

const duplicateProfile = (source: Profile): Profile => ({
  ...structuredClone(source),
  id: crypto.randomUUID(),
  name: `${source.name} copy`,
});

export const ProfileFlow = ({
  simulateReturningCandidate,
}: ProfileFlowProps) => {
  const [profiles, setProfiles] = useState<Profile[]>(
    simulateReturningCandidate ? mockProfiles : [],
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    simulateReturningCandidate ? (mockProfiles[0]?.id ?? null) : null,
  );
  const [stage, setStage] = useState<Stage>(
    simulateReturningCandidate ? "edit" : "entry",
  );

  const addProfile = (profile: Profile) => {
    setProfiles((current) => [...current, profile]);
    setSelectedProfileId(profile.id);
    setStage("edit");
  };

  if (stage === "entry") {
    return (
      <ProfileEntryScreen
        existingProfiles={profiles}
        onCancel={profiles.length > 0 ? () => setStage("edit") : undefined}
        onDuplicate={(sourceId) => {
          const source = profiles.find((p) => p.id === sourceId);
          if (source) addProfile(duplicateProfile(source));
        }}
        onStartBlank={() =>
          addProfile(createBlankProfile(nextProfileName(profiles.length)))
        }
        onUpload={() => setStage("review")}
      />
    );
  }

  if (stage === "review") {
    return (
      <ProfileReviewScreen
        onBack={() => setStage("entry")}
        onConfirm={() =>
          addProfile({
            id: crypto.randomUUID(),
            name: nextProfileName(profiles.length),
            header: mockHeader,
            sections: mockSections,
          })
        }
      />
    );
  }

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  if (!selectedProfile) {
    // Shouldn't happen, but keeps the state machine total.
    return null;
  }

  return (
    <ProfileEditView
      key={selectedProfile.id}
      onDeleteProfile={(id) => {
        const remaining = profiles.filter((p) => p.id !== id);
        setProfiles(remaining);
        if (id === selectedProfileId) {
          setSelectedProfileId(remaining[0]?.id ?? null);
          if (remaining.length === 0) setStage("entry");
        }
      }}
      onHeaderChange={(header) =>
        setProfiles((current) =>
          current.map((p) =>
            p.id === selectedProfile.id ? { ...p, header } : p,
          ),
        )
      }
      onRequestNewProfile={() => setStage("entry")}
      onSectionsChange={(sections) =>
        setProfiles((current) =>
          current.map((p) =>
            p.id === selectedProfile.id ? { ...p, sections } : p,
          ),
        )
      }
      onSelectProfile={setSelectedProfileId}
      profile={selectedProfile}
      profiles={profiles}
    />
  );
};
