"use client";

import {
  BoldIcon,
  EyeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  UnderlineIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { tw } from "@/lib/utils";

import { renderMarkdownLite } from "./markdown-lite";
import { wrapSelection } from "./wrap-selection";

const MAX_HEIGHT_PX = 340;

type RichTextFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const styles = {
  wrapper: tw("space-y-2"),
  toolbar: tw("flex items-center gap-1"),
  textarea: tw(
    "w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  ),
  preview: tw(
    "rounded-lg border border-dashed p-3 text-sm [&_ul]:list-disc [&_ul]:pl-5",
  ),
};

export const RichTextField = ({
  value,
  onChange,
  placeholder,
}: RichTextFieldProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasManualResize = useRef(false);
  // The height we last set programmatically, so the ResizeObserver below can
  // tell "we caused this" apart from a real user drag on the resize handle —
  // including a width-only reflow (e.g. the sidebar toggling) that leaves
  // height unchanged and must not be mistaken for a manual resize.
  const lastSetHeight = useRef<number | null>(null);

  const [showPreview, setShowPreview] = useState(false);

  const autoGrow = () => {
    const textarea = textareaRef.current;
    if (!textarea || hasManualResize.current) return;

    textarea.style.height = "auto";

    const computed = getComputedStyle(textarea);
    const borderHeight =
      parseFloat(computed.borderTopWidth) +
      parseFloat(computed.borderBottomWidth);
    const nextHeight = Math.min(
      textarea.scrollHeight + borderHeight,
      MAX_HEIGHT_PX,
    );
    lastSetHeight.current = nextHeight;
    textarea.style.height = `${nextHeight}px`;
  };

  useEffect(() => {
    autoGrow();
  }, [value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const observedHeight =
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;

      if (
        lastSetHeight.current !== null &&
        Math.abs(observedHeight - lastSetHeight.current) < 1
      ) {
        return;
      }
      hasManualResize.current = true;
    });
    observer.observe(textarea);

    return () => observer.disconnect();
  }, []);

  const applyMarker = (marker: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const result = wrapSelection(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      marker,
    );
    onChange(result.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.start, result.end);
    });
  };

  const insertBullet = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const before = value.slice(0, start);
    const after = value.slice(start);
    const prefix = before.length > 0 && !before.endsWith("\n") ? "\n- " : "- ";
    const nextValue = before + prefix + after;

    onChange(nextValue);
    const cursor = start + prefix.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const rawLabel = value.slice(start, end) || "link text";
    // Strip characters that would break the [label](url) syntax itself.
    const label = rawLabel.replace(/[[\]()]/g, "");
    const before = value.slice(0, start);
    const after = value.slice(end);
    const insertion = `[${label}](url)`;

    onChange(before + insertion + after);
    const urlStart = before.length + label.length + 3;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(urlStart, urlStart + 3);
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bold"
          onClick={() => applyMarker("**")}
        >
          <BoldIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Italic"
          onClick={() => applyMarker("*")}
        >
          <ItalicIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Underline"
          onClick={() => applyMarker("++")}
        >
          <UnderlineIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Link"
          onClick={insertLink}
        >
          <LinkIcon />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={insertBullet}>
          <ListIcon />+ Bullet
        </Button>
        <Button
          type="button"
          variant={showPreview ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label="Toggle preview"
          onClick={() => setShowPreview((prev) => !prev)}
        >
          <EyeIcon />
        </Button>
      </div>

      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />

      {showPreview && (
        <div
          className={styles.preview}
          dangerouslySetInnerHTML={{ __html: renderMarkdownLite(value) }}
        />
      )}
    </div>
  );
};
