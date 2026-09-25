"use client";

import {
  ImageIcon,
  MailIcon,
  MapPinIcon,
  PaletteIcon,
  PhoneIcon,
  PlusIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type Dispatch } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProfileHeader, ProfileLink } from "@/lib/backend/profile";
import { cn, tw } from "@/lib/utils";

import { AskAiPanel } from "./ask-ai-panel";
import { bareInputClass, iconButtonClass } from "./editor-field-styles";
import {
  MAX_PICTURE_UPLOAD_BYTES,
  readAndResizePicture,
} from "./picture-upload";
import type { ProfileAction } from "./profile-reducer";

const MAX_LINKS = 5;
// The length of "Full Stack AI Engineer | TypeScript, React, Next.js,
// Python, FastAPI" (68 chars) + 10 — long enough for a real title, short
// enough that it stays on one line instead of wrapping in the header.
const MAX_CAREER_TITLE_LENGTH = 78;

// Curated presets for a quick pick; the trailing native color input in each
// row keeps exact custom colors available for anyone who wants one.
// The header-block/section-title colors most resume templates actually
// offer: navy, charcoal, burgundy, and forest green for the header; a
// muted slate, gold, teal, or terracotta accent alongside it.
const PRIMARY_COLOR_PRESETS = ["#1f3a5f", "#1f2937", "#6b1e2e", "#14532d"];
const SECONDARY_COLOR_PRESETS = ["#475569", "#b8860b", "#0f766e", "#b5533c"];

type ProfileHeaderFormProps = {
  header: ProfileHeader;
  dispatch: Dispatch<ProfileAction>;
};

const styles = {
  card: tw("overflow-hidden rounded-xl border bg-card shadow-sm"),
  banner: tw("relative h-21 border-b-4"),
  bannerActions: tw("absolute top-3 right-3 flex items-center gap-1"),
  bannerIconButton: tw(
    "flex size-7 cursor-pointer items-center justify-center rounded-md bg-white/20 text-white hover:bg-white/30",
  ),
  bannerIconButtonActive: tw("bg-white/30"),
  colorPanel: tw(
    "absolute top-11 right-3 z-10 w-64 space-y-4 rounded-xl border bg-card p-4 shadow-md",
  ),
  colorRow: tw("space-y-1.5"),
  colorRowLabel: tw("text-xs font-medium"),
  colorRowCaption: tw("font-normal text-muted-foreground"),
  swatchRow: tw("flex items-center gap-2"),
  swatch: tw("size-5.5 shrink-0 cursor-pointer rounded-full border-2"),
  customSwatch: tw("size-5.5 shrink-0 cursor-pointer rounded-full border p-0"),
  body: tw("px-8 pb-6"),
  // relative + z-10: the banner above is also `relative` (for its absolute
  // children), which alone would make it paint over this avatar's overlap
  // region despite coming first in the DOM — see the CSS stacking-context
  // gotcha this mirrors in the Profile Form Redesign artifact's mockup.
  avatarButton: tw(
    "group relative z-10 -mt-11 flex size-22 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-card bg-muted text-muted-foreground shadow-sm",
  ),
  avatarImg: tw("size-full object-cover"),
  avatarOverlay: tw(
    "absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100",
  ),
  avatarOverlayLabel: tw("text-[10px] font-semibold"),
  removePictureButton: tw(
    "mt-2 cursor-pointer text-[11px] text-muted-foreground underline hover:text-foreground",
  ),
  hiddenInput: tw("hidden"),
  identity: tw("mt-3.5"),
  nameInput: tw(
    "w-full rounded-none border-0 border-b bg-transparent px-0 py-1 text-2xl font-medium focus-visible:ring-0",
  ),
  titleInput: tw(
    "mt-0.5 w-full rounded-none border-0 border-b bg-transparent px-0 py-1 text-sm text-muted-foreground focus-visible:ring-0",
  ),
  contactRow: tw("mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1"),
  contactField: tw("flex items-center gap-1.5 text-muted-foreground"),
  contactIcon: tw("size-3.5 shrink-0"),
  // Width is set inline per-field (contactFieldWidth) since a plain <input>
  // won't grow to fit its own value from Tailwind's `w-auto` alone.
  contactInput: tw(
    "border-0 bg-transparent px-0 py-1 text-[13px] text-foreground focus-visible:ring-0",
  ),
  linksBlock: tw("mt-3.5 space-y-2"),
  linksLabel: tw("text-xs font-medium text-muted-foreground"),
  linkRow: tw("flex items-center gap-2"),
  linkLabelInput: tw(
    "w-32 shrink-0 rounded-none border-0 border-b bg-transparent py-1 pr-0 pl-1 text-sm focus-visible:ring-0",
  ),
  bareInput: bareInputClass,
  iconButton: iconButtonClass,
};

// A plain <input> ignores its own value's length when sizing itself — even
// with `w-auto`, it keeps a fixed intrinsic (browser-default) width and
// clips/scrolls anything past it instead of growing. Sizing by the longer
// of the current value or placeholder, in `ch` units, is what makes it grow
// with what's actually typed.
const contactFieldWidth = (value: string, placeholder: string): string =>
  `${Math.max(value.length, placeholder.length, 6) + 1}ch`;

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
  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const pictureInputRef = useRef<HTMLInputElement>(null);

  const updateHeader = (patch: Partial<ProfileHeader>) => {
    dispatch({ type: "UPDATE_HEADER", header: { ...header, ...patch } });
  };

  const handlePictureSelected = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_PICTURE_UPLOAD_BYTES) {
      toast.error("That photo is too large (max 10MB).");
      return;
    }

    try {
      const resized = await readAndResizePicture(file);
      updateHeader({ picture: resized });
    } catch {
      toast.error("Couldn't use that photo — try a different file.");
    }
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
        className={styles.banner}
        style={{
          backgroundColor: header.primaryColor,
          borderBottomColor: header.secondaryColor,
        }}
      >
        <div className={styles.bannerActions}>
          <button
            type="button"
            className={cn(
              styles.bannerIconButton,
              askAiOpen && styles.bannerIconButtonActive,
            )}
            aria-label="Ask AI about your Header"
            title="Ask AI about your Header"
            onClick={() => {
              setColorPanelOpen(false);
              setAskAiOpen((current) => !current);
            }}
          >
            <SparklesIcon className="size-3.5" />
          </button>
          <button
            type="button"
            className={cn(
              styles.bannerIconButton,
              colorPanelOpen && styles.bannerIconButtonActive,
            )}
            aria-label="Customize colors"
            title="Customize colors"
            onClick={() => {
              setAskAiOpen(false);
              setColorPanelOpen((current) => !current);
            }}
          >
            <PaletteIcon className="size-3.5" />
          </button>
        </div>

        {colorPanelOpen && (
          <div className={styles.colorPanel}>
            <div className={styles.colorRow}>
              <span className={styles.colorRowLabel}>
                Primary{" "}
                <span className={styles.colorRowCaption}>· Header block</span>
              </span>
              <div className={styles.swatchRow}>
                {PRIMARY_COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className={styles.swatch}
                    style={{
                      backgroundColor: hex,
                      borderColor:
                        header.primaryColor.toLowerCase() === hex
                          ? hex
                          : "transparent",
                    }}
                    aria-label={`Use ${hex} as the primary color`}
                    onClick={() => updateHeader({ primaryColor: hex })}
                  />
                ))}
                <input
                  type="color"
                  className={styles.customSwatch}
                  aria-label="Custom primary color"
                  value={header.primaryColor}
                  onChange={(e) =>
                    updateHeader({ primaryColor: e.target.value })
                  }
                />
              </div>
            </div>
            <div className={styles.colorRow}>
              <span className={styles.colorRowLabel}>
                Secondary{" "}
                <span className={styles.colorRowCaption}>· Section titles</span>
              </span>
              <div className={styles.swatchRow}>
                {SECONDARY_COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className={styles.swatch}
                    style={{
                      backgroundColor: hex,
                      borderColor:
                        header.secondaryColor.toLowerCase() === hex
                          ? hex
                          : "transparent",
                    }}
                    aria-label={`Use ${hex} as the secondary color`}
                    onClick={() => updateHeader({ secondaryColor: hex })}
                  />
                ))}
                <input
                  type="color"
                  className={styles.customSwatch}
                  aria-label="Custom secondary color"
                  value={header.secondaryColor}
                  onChange={(e) =>
                    updateHeader({ secondaryColor: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <button
          type="button"
          className={styles.avatarButton}
          aria-label={header.picture ? "Change photo" : "Upload photo"}
          onClick={() => pictureInputRef.current?.click()}
        >
          {header.picture ? (
            // A preview of a local data URL — next/image's optimization
            // (CDN, srcset, lazy load) doesn't apply here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={header.picture} alt="" className={styles.avatarImg} />
          ) : (
            <ImageIcon className="size-6" />
          )}
          {header.picture && (
            <span className={styles.avatarOverlay}>
              <ImageIcon className="size-4" />
              <span className={styles.avatarOverlayLabel}>Change</span>
            </span>
          )}
        </button>
        <input
          ref={pictureInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={handlePictureSelected}
        />
        {header.picture && (
          <button
            type="button"
            className={styles.removePictureButton}
            onClick={() => updateHeader({ picture: null })}
          >
            Remove photo
          </button>
        )}

        <div className={styles.identity}>
          <Input
            className={styles.nameInput}
            placeholder="[Full Name]"
            value={header.fullName}
            onChange={(e) => updateHeader({ fullName: e.target.value })}
          />
          <Input
            className={styles.titleInput}
            placeholder="Full Stack Engineer | React, Node.js, PostgreSQL"
            maxLength={MAX_CAREER_TITLE_LENGTH}
            value={header.careerTitle}
            onChange={(e) => updateHeader({ careerTitle: e.target.value })}
          />

          <div className={styles.contactRow}>
            <span className={styles.contactField}>
              <MailIcon className={styles.contactIcon} />
              <Input
                aria-label="Email"
                type="email"
                className={styles.contactInput}
                style={{
                  width: contactFieldWidth(header.email, "email@example.com"),
                }}
                placeholder="email@example.com"
                value={header.email}
                onChange={(e) => updateHeader({ email: e.target.value })}
              />
            </span>
            <span className={styles.contactField}>
              <PhoneIcon className={styles.contactIcon} />
              <Input
                aria-label="Phone"
                className={styles.contactInput}
                style={{
                  width: contactFieldWidth(header.phone, "+1 (000) 000-0000"),
                }}
                placeholder="+1 (000) 000-0000"
                value={header.phone}
                onChange={(e) => updateHeader({ phone: e.target.value })}
              />
            </span>
            <span className={styles.contactField}>
              <MapPinIcon className={styles.contactIcon} />
              <Input
                aria-label="Location"
                className={styles.contactInput}
                style={{
                  width: contactFieldWidth(header.location, "Country, City"),
                }}
                placeholder="Country, City"
                value={header.location}
                onChange={(e) => updateHeader({ location: e.target.value })}
              />
            </span>
          </div>

          <div className={styles.linksBlock}>
            <span className={styles.linksLabel}>
              Websites (LinkedIn, GitHub, portfolio — up to 5)
            </span>
            {header.links.map((link) => (
              <div key={link.id} className={styles.linkRow}>
                <Input
                  aria-label="Website label"
                  className={styles.linkLabelInput}
                  placeholder="Label"
                  value={link.label}
                  onChange={(e) =>
                    updateLink(link.id, { label: e.target.value })
                  }
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLink}
              >
                <PlusIcon />
                Add website
              </Button>
            )}
          </div>
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
    </div>
  );
};
