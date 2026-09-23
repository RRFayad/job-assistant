"use client";

import { PlusIcon, SparklesIcon, XIcon } from "lucide-react";
import { useState, type Dispatch } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProfileHeader, ProfileLink } from "@/lib/backend/profile";
import { cn, tw } from "@/lib/utils";

import { AskAiPanel } from "./ask-ai-panel";
import { bareInputClass, iconButtonClass } from "./editor-field-styles";
import type { ProfileAction } from "./profile-reducer";

const MAX_LINKS = 5;

type ProfileHeaderFormProps = {
  header: ProfileHeader;
  dispatch: Dispatch<ProfileAction>;
};

const styles = {
  card: tw("rounded-xl border bg-card p-5 shadow-sm"),
  accentStrip: tw("-mx-5 -mt-5 mb-4 h-2 rounded-t-xl"),
  head: tw("flex items-center justify-between gap-2"),
  heading: tw(
    "text-xs font-semibold tracking-wide text-muted-foreground uppercase",
  ),
  iconButton: iconButtonClass,
  iconButtonActive: tw("bg-muted text-foreground"),
  fields: tw("mt-4 grid gap-3 sm:grid-cols-2"),
  fieldGroup: tw("block space-y-1"),
  fieldLabel: tw("text-xs font-medium text-muted-foreground"),
  bareInput: bareInputClass,
  linksBlock: tw("mt-4 space-y-2"),
  linkRow: tw("flex items-center gap-2"),
  linkLabelInput: tw(
    "w-32 shrink-0 border-0 border-b bg-transparent py-1 pr-0 pl-1 text-sm focus-visible:ring-0",
  ),
  themeBlock: tw("mt-4 flex flex-wrap gap-6 border-t pt-4"),
  themeField: tw("flex items-center gap-2"),
  colorSwatch: tw("size-8 shrink-0 cursor-pointer rounded-md border p-0"),
  colorLabelGroup: tw("flex flex-col"),
  colorLabel: tw("text-xs font-medium text-muted-foreground"),
  colorValue: tw("text-xs text-muted-foreground/70"),
};

const createLink = (): ProfileLink => ({
  id: crypto.randomUUID(),
  label: "",
  url: "",
});

export const ProfileHeaderForm = ({
  header,
  dispatch,
}: ProfileHeaderFormProps) => {
  const [askAiOpen, setAskAiOpen] = useState(false);

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
    <div className={styles.card}>
      <div
        className={styles.accentStrip}
        style={{ backgroundColor: header.primaryColor }}
      />
      <div className={styles.head}>
        <h2 className={styles.heading}>Header</h2>
        <button
          type="button"
          className={cn(
            styles.iconButton,
            askAiOpen && styles.iconButtonActive,
          )}
          aria-label="Ask AI about your Header"
          title="Ask AI about your Header"
          onClick={() => setAskAiOpen((current) => !current)}
        >
          <SparklesIcon className="size-3.5 text-primary" />
        </button>
      </div>

      <div className={styles.fields}>
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Full name</span>
          <Input
            className={styles.bareInput}
            placeholder="[Full Name]"
            value={header.fullName}
            onChange={(e) => updateHeader({ fullName: e.target.value })}
          />
        </label>
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>
            Career title (include your key skills here if you want them shown)
          </span>
          <Input
            className={styles.bareInput}
            placeholder="Full Stack Engineer | React, Node.js, PostgreSQL"
            value={header.careerTitle}
            onChange={(e) => updateHeader({ careerTitle: e.target.value })}
          />
        </label>
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Email</span>
          <Input
            className={styles.bareInput}
            type="email"
            placeholder="email@example.com"
            value={header.email}
            onChange={(e) => updateHeader({ email: e.target.value })}
          />
        </label>
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Phone</span>
          <Input
            className={styles.bareInput}
            placeholder="+1 (000) 000-0000"
            value={header.phone}
            onChange={(e) => updateHeader({ phone: e.target.value })}
          />
        </label>
        <label className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Location</span>
          <Input
            className={styles.bareInput}
            placeholder="Country, City"
            value={header.location}
            onChange={(e) => updateHeader({ location: e.target.value })}
          />
        </label>
      </div>

      <div className={styles.linksBlock}>
        <span className={styles.fieldLabel}>
          Websites (LinkedIn, GitHub, portfolio — up to 5)
        </span>
        {header.links.map((link) => (
          <div key={link.id} className={styles.linkRow}>
            <Input
              aria-label="Website label"
              className={styles.linkLabelInput}
              placeholder="Label"
              value={link.label}
              onChange={(e) => updateLink(link.id, { label: e.target.value })}
            />
            <Input
              aria-label="Website URL"
              className={styles.bareInput}
              placeholder="https://…"
              value={link.url}
              onChange={(e) => updateLink(link.id, { url: e.target.value })}
            />
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Remove website"
              onClick={() => removeLink(link.id)}
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ))}
        {header.links.length < MAX_LINKS && (
          <Button type="button" variant="outline" size="sm" onClick={addLink}>
            <PlusIcon />
            Add website
          </Button>
        )}
      </div>

      <div className={styles.themeBlock}>
        <label className={styles.themeField}>
          <input
            type="color"
            className={styles.colorSwatch}
            value={header.primaryColor}
            onChange={(e) => updateHeader({ primaryColor: e.target.value })}
          />
          <div className={styles.colorLabelGroup}>
            <span className={styles.colorLabel}>Resume primary color</span>
            <span className={styles.colorValue}>
              Header block · {header.primaryColor}
            </span>
          </div>
        </label>
        <label className={styles.themeField}>
          <input
            type="color"
            className={styles.colorSwatch}
            value={header.secondaryColor}
            onChange={(e) => updateHeader({ secondaryColor: e.target.value })}
          />
          <div className={styles.colorLabelGroup}>
            <span className={styles.colorLabel}>2nd color</span>
            <span className={styles.colorValue}>
              Section titles · {header.secondaryColor}
            </span>
          </div>
        </label>
      </div>

      {askAiOpen && (
        <AskAiPanel
          target={{ kind: "header", header }}
          onClose={() => setAskAiOpen(false)}
          onAccept={(suggestion) =>
            suggestion.kind === "header" &&
            dispatch({ type: "UPDATE_HEADER", header: suggestion.header })
          }
        />
      )}
    </div>
  );
};
