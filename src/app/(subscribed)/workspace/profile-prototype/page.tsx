import { Suspense } from "react";

// PROTOTYPE ONLY — the merged Profile flow at /workspace/profile-prototype.
// ?entry= simulates starting as a new candidate (empty state) vs a
// returning one (lands straight in the edit view) — it's not a layout
// variant, just which starting point you want to click through.

import { PrototypeSwitcher } from "@/components/prototype/prototype-switcher";

import { ProfileFlow } from "./_prototype/profile-flow";

const variants = [
  { key: "returning", label: "Returning candidate" },
  { key: "new", label: "New candidate" },
];

type ProfilePrototypePageProps = {
  searchParams: Promise<{ entry?: string }>;
};

const ProfilePrototypePage = async ({
  searchParams,
}: ProfilePrototypePageProps) => {
  const { entry } = await searchParams;
  const simulateReturningCandidate = entry !== "new";

  return (
    <>
      <ProfileFlow
        key={entry ?? "returning"}
        simulateReturningCandidate={simulateReturningCandidate}
      />
      <Suspense fallback={null}>
        <PrototypeSwitcher tag="Entry" paramName="entry" variants={variants} />
      </Suspense>
    </>
  );
};

export default ProfilePrototypePage;
