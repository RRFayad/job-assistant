import { tw } from "@/lib/utils";

// Shared by every Profile editor surface (header, sections) that renders a
// borderless underline text field or a small square icon-only button, so a
// future visual tweak to either only needs to happen once. Import into each
// file's own local `styles` object rather than using these directly, per
// AGENTS.md's "local styles object" convention.
//
// Width, horizontal padding, and text size deliberately aren't part of this
// shape — they vary per field (a name field wants even px-0 padding; a field
// following an icon wants pr-0 pl-1; a link label is a fixed w-32 while a
// name wants full width) — so a field composes this with its own classes (a
// plain template string, not cn(): AGENTS.md reserves cn() for
// runtime-conditional merging, and this is a fixed composition) instead of
// repeating the whole underline shape.
export const underlineFieldClass = tw(
  "rounded-none border-0 border-b bg-transparent py-1 focus-visible:ring-0",
);

// The common case: full width, body text size, padding for a field that
// follows an icon.
export const bareInputClass = tw(
  `w-full ${underlineFieldClass} pr-0 pl-1 text-sm`,
);

export const iconButtonClass = tw(
  "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
);
