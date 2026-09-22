"use client";

import { useReducer } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  Profile,
  ProfileHeader,
  ProfileLink,
} from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { profileReducer } from "./profile-reducer";
import { useAutosaveProfile } from "./use-autosave-profile";

const MAX_LINKS = 5;

type ProfileHeaderFormProps = {
  profile: Profile;
};

const styles = {
  card: tw("space-y-6 rounded-xl border border-t-4 p-6"),
  statusRow: tw("flex items-center justify-between"),
  heading: tw("text-lg font-semibold"),
  status: tw("text-sm text-muted-foreground"),
  fields: tw("grid gap-4 sm:grid-cols-2"),
  field: tw("flex flex-col gap-1.5 text-sm"),
  label: tw("font-medium text-foreground"),
  colorInput: tw("h-8 w-16 rounded-lg border border-input bg-transparent p-1"),
  links: tw("space-y-3"),
  linksHeader: tw("flex items-center justify-between"),
  linkRow: tw("flex items-center gap-2"),
  sections: tw(
    "list-disc space-y-1 rounded-r-lg border-l-4 py-2 pr-2 pl-6 text-sm text-muted-foreground",
  ),
};

const createLink = (): ProfileLink => ({
  id: crypto.randomUUID(),
  label: "",
  url: "",
});

export const ProfileHeaderForm = ({
  profile: initialProfile,
}: ProfileHeaderFormProps) => {
  const [profile, dispatch] = useReducer(profileReducer, initialProfile);
  const saveStatus = useAutosaveProfile(profile);
  const { header } = profile;

  const updateHeader = (patch: Partial<ProfileHeader>) => {
    dispatch({ type: "UPDATE_HEADER", header: { ...header, ...patch } });
  };

  const updateLink = (id: string, patch: Partial<ProfileLink>) => {
    updateHeader({
      links: header.links.map((link) =>
        link.id === id ? { ...link, ...patch } : link,
      ),
    });
  };

  const addLink = () => {
    if (header.links.length >= MAX_LINKS) return;
    updateHeader({ links: [...header.links, createLink()] });
  };

  const removeLink = (id: string) => {
    updateHeader({ links: header.links.filter((link) => link.id !== id) });
  };

  return (
    <>
      <section
        className={styles.card}
        style={{ borderTopColor: header.primaryColor }}
      >
        <div className={styles.statusRow}>
          <h2 className={styles.heading}>Header</h2>
          <p className={styles.status}>
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" && "All changes saved"}
          </p>
        </div>

        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.label}>Full name</span>
            <Input
              value={header.fullName}
              onChange={(e) => updateHeader({ fullName: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Career title</span>
            <Input
              value={header.careerTitle}
              onChange={(e) => updateHeader({ careerTitle: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <Input
              type="email"
              value={header.email}
              onChange={(e) => updateHeader({ email: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Phone</span>
            <Input
              value={header.phone}
              onChange={(e) => updateHeader({ phone: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Location</span>
            <Input
              value={header.location}
              onChange={(e) => updateHeader({ location: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Primary color</span>
            <input
              type="color"
              className={styles.colorInput}
              value={header.primaryColor}
              onChange={(e) => updateHeader({ primaryColor: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Secondary color</span>
            <input
              type="color"
              className={styles.colorInput}
              value={header.secondaryColor}
              onChange={(e) => updateHeader({ secondaryColor: e.target.value })}
            />
          </label>
        </div>

        <div className={styles.links}>
          <div className={styles.linksHeader}>
            <span className={styles.label}>Links</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLink}
              disabled={header.links.length >= MAX_LINKS}
            >
              Add link
            </Button>
          </div>
          {header.links.map((link) => (
            <div key={link.id} className={styles.linkRow}>
              <Input
                placeholder="Label"
                value={link.label}
                onChange={(e) => updateLink(link.id, { label: e.target.value })}
              />
              <Input
                placeholder="URL"
                value={link.url}
                onChange={(e) => updateLink(link.id, { url: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLink(link.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      {profile.sections.length > 0 && (
        <ul
          className={styles.sections}
          style={{ borderLeftColor: header.secondaryColor }}
        >
          {profile.sections.map((section) => (
            <li key={section.id}>{section.title}</li>
          ))}
        </ul>
      )}
    </>
  );
};
