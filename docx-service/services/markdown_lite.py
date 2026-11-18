import re
from dataclasses import dataclass

# Mirrors src/components/subscribed/profile/markdown-lite.ts, but targets
# structured segments/blocks (for real Word runs) instead of an HTML string.

# Alternation order matters: at a given position, the regex engine tries
# each branch left to right and uses the first that matches. A lone "*" only
# reaches the italic branch once the "**" bold branch has already failed to
# match there, which is what correctly disambiguates "**bold**" from
# "*italic*" without extra bookkeeping.
_INLINE_PATTERN = re.compile(
    r"\[(?P<link_text>.+?)\]\((?P<link_url>(?:[^()]|\([^()]*\))+)\)"
    r"|\*\*(?P<bold>.+?)\*\*"
    r"|\+\+(?P<underline>.+?)\+\+"
    r"|\*(?P<italic>.+?)\*"
)

# Only these schemes (or a relative/hash URL) become a real hyperlink in the
# exported document — mirrors the frontend renderer's isSafeUrl.
_SAFE_URL_SCHEMES = re.compile(r"^(https?:|mailto:|tel:|/|#)", re.IGNORECASE)


@dataclass(frozen=True)
class InlineSegment:
    text: str
    bold: bool = False
    italic: bool = False
    underline: bool = False
    url: str | None = None


@dataclass(frozen=True)
class TextBlock:
    kind: str  # "paragraph" | "bullet_list"
    lines: tuple[str, ...]


def is_safe_url(url: str) -> bool:
    return bool(_SAFE_URL_SCHEMES.match(url))


def _apply_outer_format(
    text: str,
    bold: bool = False,
    italic: bool = False,
    underline: bool = False,
) -> list[InlineSegment]:
    # Recurses so a marker nested inside another (e.g. a link inside
    # "**...**", which the toolbar's wrap-entire-selection behavior can
    # produce) is still recognized, not treated as inert literal text.
    return [
        InlineSegment(
            text=inner.text,
            bold=inner.bold or bold,
            italic=inner.italic or italic,
            underline=inner.underline or underline,
            url=inner.url,
        )
        for inner in parse_inline(text)
    ]


def parse_inline(line: str) -> list[InlineSegment]:
    segments: list[InlineSegment] = []
    last_end = 0

    for match in _INLINE_PATTERN.finditer(line):
        if match.start() > last_end:
            segments.append(InlineSegment(text=line[last_end : match.start()]))

        if match.group("link_text") is not None:
            url = match.group("link_url")
            if is_safe_url(url):
                segments.append(InlineSegment(text=match.group("link_text"), url=url))
            else:
                segments.append(InlineSegment(text=match.group("link_text")))
        elif match.group("bold") is not None:
            segments.extend(_apply_outer_format(match.group("bold"), bold=True))
        elif match.group("underline") is not None:
            segments.extend(
                _apply_outer_format(match.group("underline"), underline=True)
            )
        elif match.group("italic") is not None:
            segments.extend(_apply_outer_format(match.group("italic"), italic=True))

        last_end = match.end()

    if last_end < len(line) or not segments:
        segments.append(InlineSegment(text=line[last_end:]))

    return segments


def parse_blocks(text: str) -> list[TextBlock]:
    blocks: list[TextBlock] = []
    bullet_buffer: list[str] = []

    def flush_bullets() -> None:
        if bullet_buffer:
            blocks.append(TextBlock(kind="bullet_list", lines=tuple(bullet_buffer)))
            bullet_buffer.clear()

    for line in text.split("\n"):
        if line.startswith("- "):
            bullet_buffer.append(line[2:])
            continue

        flush_bullets()
        if line.strip():
            blocks.append(TextBlock(kind="paragraph", lines=(line,)))

    flush_bullets()
    return blocks
