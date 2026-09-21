"use client";

// PROTOTYPE ONLY — a small Markdown-lite rich text field: a plain textarea
// with a toolbar that wraps (or un-wraps, toggle-style) the current
// selection in Bold/Italic/Underline/Link syntax, an optional preview, and
// a textarea that auto-grows to fit its content up to a reasonable cap
// (beyond that, it scrolls). Storage format is deliberately simple text so
// it maps cleanly onto real Word run formatting later: **bold**, *italic*,
// ++underline++, [text](url).

import { useEffect, useState, useRef } from "react";
import {
  BoldIcon,
  EyeIcon,
  EyeOffIcon,
  ItalicIcon,
  Link2Icon,
  UnderlineIcon,
} from "lucide-react";

import { cn, tw } from "@/lib/utils";

type RichTextFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

const styles = {
  wrap: tw("space-y-1.5"),
  toolbar: tw("flex items-center gap-0.5"),
  toolButton: tw(
    "flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
  ),
  toolButtonActive: tw("bg-muted text-foreground"),
  textarea: tw(
    "min-h-16 w-full resize-y overflow-y-auto rounded-md border bg-background p-2 text-sm",
  ),
  preview: tw(
    "rounded-md border border-dashed bg-muted/30 p-2 text-sm leading-relaxed",
  ),
  previewLabel: tw(
    "mb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase",
  ),
};

// ~140% of a fully-written Experience entry (e.g. the Helios AI one in
// mock-data.ts: a paragraph + 4 bullets). Past this, growth stops and the
// user can drag the resize handle further themselves.
const AUTO_GROW_CAP_PX = 340;

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const renderMarkdownLite = (value: string): string => {
  const escaped = escapeHtml(value);
  const lines = escaped.split("\n").map((line) => {
    const formatted = line
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer" style="text-decoration: underline;">$1</a>',
      )
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\+\+([^+]+)\+\+/g, "<u>$1</u>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

    const bulletMatch = formatted.match(/^-\s+(.*)$/);
    if (bulletMatch) {
      return `<div style="padding-left: 1em; text-indent: -1em;">• ${bulletMatch[1]}</div>`;
    }
    return formatted ? `<div>${formatted}</div>` : "<div>&nbsp;</div>";
  });

  return lines.join("");
};

export const RichTextField = ({
  value,
  onChange,
  placeholder,
  rows = 3,
}: RichTextFieldProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const isAutoResizing = useRef(false);
  const manuallyResized = useRef(false);

  // Once the user drags the resize handle themselves, stop overriding their
  // chosen height on every keystroke.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const observer = new ResizeObserver(() => {
      if (isAutoResizing.current) {
        isAutoResizing.current = false;
        return;
      }
      manuallyResized.current = true;
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || manuallyResized.current) return;

    // box-sizing is border-box, but scrollHeight excludes the border, so
    // setting height = scrollHeight alone leaves a permanent few-px scroll
    // gap equal to the border width. Add it back.
    const { borderTopWidth, borderBottomWidth } =
      window.getComputedStyle(textarea);
    const borderHeight =
      parseFloat(borderTopWidth) + parseFloat(borderBottomWidth);

    isAutoResizing.current = true;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight + borderHeight, AUTO_GROW_CAP_PX)}px`;
  }, [value]);

  // Toggle-style: wrapping already-wrapped text un-wraps it instead of
  // nesting markers (fixes **text** -> click Bold again -> ****text****).
  const wrapSelection = (marker: string, closingMarker: string = marker) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    const outsideStart = value.slice(Math.max(0, start - marker.length), start);
    const outsideEnd = value.slice(end, end + closingMarker.length);
    if (selected && outsideStart === marker && outsideEnd === closingMarker) {
      const next =
        value.slice(0, start - marker.length) +
        selected +
        value.slice(end + closingMarker.length);
      onChange(next);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start - marker.length,
          start - marker.length + selected.length,
        );
      });
      return;
    }

    if (
      selected.length >= marker.length + closingMarker.length &&
      selected.startsWith(marker) &&
      selected.endsWith(closingMarker)
    ) {
      const inner = selected.slice(
        marker.length,
        selected.length - closingMarker.length,
      );
      const next = value.slice(0, start) + inner + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + inner.length);
      });
      return;
    }

    const content = selected || "text";
    const next =
      value.slice(0, start) +
      marker +
      content +
      closingMarker +
      value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + marker.length,
        start + marker.length + content.length,
      );
    });
  };

  const insertLink = () => {
    const url = window.prompt("Link URL");
    if (!url) return;
    wrapSelection("[", `](${url})`);
  };

  const appendBulletLine = () => {
    onChange(value ? `${value}\n- ` : "- ");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <button
          className={styles.toolButton}
          onClick={() => wrapSelection("**")}
          title="Bold"
          type="button"
        >
          <BoldIcon className="size-3.5" />
        </button>
        <button
          className={styles.toolButton}
          onClick={() => wrapSelection("*")}
          title="Italic"
          type="button"
        >
          <ItalicIcon className="size-3.5" />
        </button>
        <button
          className={styles.toolButton}
          onClick={() => wrapSelection("++")}
          title="Underline"
          type="button"
        >
          <UnderlineIcon className="size-3.5" />
        </button>
        <button
          className={styles.toolButton}
          onClick={insertLink}
          title="Link"
          type="button"
        >
          <Link2Icon className="size-3.5" />
        </button>
        <button
          className={tw(
            "ml-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          onClick={appendBulletLine}
          title="Add bullet line"
          type="button"
        >
          + Bullet
        </button>
        <button
          className={cn(
            styles.toolButton,
            "ml-auto",
            showPreview && styles.toolButtonActive,
          )}
          onClick={() => setShowPreview((current) => !current)}
          title={showPreview ? "Hide preview" : "Show preview"}
          type="button"
        >
          {showPreview ? (
            <EyeOffIcon className="size-3.5" />
          ) : (
            <EyeIcon className="size-3.5" />
          )}
        </button>
      </div>
      <textarea
        className={styles.textarea}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        ref={textareaRef}
        rows={rows}
        value={value}
      />
      {showPreview && value && (
        <div className={styles.preview}>
          <p className={styles.previewLabel}>Preview</p>
          <div
            dangerouslySetInnerHTML={{ __html: renderMarkdownLite(value) }}
          />
        </div>
      )}
    </div>
  );
};
