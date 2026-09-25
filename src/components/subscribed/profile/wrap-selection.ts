export type WrapResult = {
  value: string;
  start: number;
  end: number;
};

// Guards against a shorter marker (e.g. "*") false-matching as a boundary of
// a longer marker built from the same character (e.g. "**"), which would
// otherwise let toggling italic on already-bold text corrupt it instead of
// leaving it alone.
const endsWithExactMarker = (text: string, marker: string): boolean => {
  if (!text.endsWith(marker)) return false;
  const charBefore = text[text.length - marker.length - 1];
  return charBefore !== marker[marker.length - 1];
};

const startsWithExactMarker = (text: string, marker: string): boolean => {
  if (!text.startsWith(marker)) return false;
  const charAfter = text[marker.length];
  return charAfter !== marker[0];
};

export const wrapSelection = (
  value: string,
  start: number,
  end: number,
  marker: string,
): WrapResult => {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  // Markers sit just outside the selection — toggle off by removing them.
  if (
    endsWithExactMarker(before, marker) &&
    startsWithExactMarker(after, marker)
  ) {
    return {
      value:
        before.slice(0, before.length - marker.length) +
        selected +
        after.slice(marker.length),
      start: start - marker.length,
      end: end - marker.length,
    };
  }

  // The selection itself includes the markers — toggle off by stripping them.
  if (
    selected.length >= marker.length * 2 &&
    startsWithExactMarker(selected, marker) &&
    endsWithExactMarker(selected, marker)
  ) {
    const unwrapped = selected.slice(
      marker.length,
      selected.length - marker.length,
    );
    return {
      value: before + unwrapped + after,
      start,
      end: start + unwrapped.length,
    };
  }

  // Otherwise, wrap.
  return {
    value: before + marker + selected + marker + after,
    start: start + marker.length,
    end: end + marker.length,
  };
};
