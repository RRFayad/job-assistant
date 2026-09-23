import copy
from dataclasses import dataclass
from pathlib import Path

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from schemas.profile import (
    EntriesSection,
    ListSection,
    PairsSection,
    Profile,
    ProfileHeader,
    ProfileSection,
    TagsSection,
    TextSection,
)
from services.markdown_lite import (
    InlineSegment,
    is_safe_url,
    parse_blocks,
    parse_inline,
)

# The document this module builds from is the validated design reference
# (docs/adr/0007-collapse-baseline-into-profile.md's prototype), not a
# fixed-layout template filled in place — the flexible, variable-length
# sections model doesn't fit a fixed template. Instead, small reusable
# pieces (a section heading, a job title line, a bullet item, ...) are
# cloned directly from its Word XML and refilled, so their typography
# (fonts, sizes, colors, spacing) always matches the source design exactly
# rather than being hand-picked in Python and drifting from it over time.
TEMPLATE_PATH = (
    Path(__file__).resolve().parent.parent / "templates" / "resume_template.docx"
)

_LINK_RELATIONSHIP = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"
)
_BODY_LINK_COLOR = "0563C1"
_HEADER_TEXT_COLOR = "E8E8E8"


@dataclass(frozen=True)
class _TextStyle:
    """A reusable run-formatting recipe, so freshly-generated runs (for
    variable-shape content like Markdown-lite text or a variable number of
    header links) match the template's typography without re-deriving it."""

    font: str | None = "Calibri"
    color: str = "333333"
    bold: bool = False


_BODY_STYLE = _TextStyle(color="333333")
_HEADER_TEXT_STYLE = _TextStyle(color=_HEADER_TEXT_COLOR)


@dataclass(frozen=True)
class _Snippets:
    """Deep copies of representative elements from the template, extracted
    once per export so each piece's formatting can be cloned per occurrence
    (e.g. one section can have any number of bullet items) instead of being
    limited to however many the template's own example content happens to
    have."""

    header_table: object
    section_heading: object
    body_paragraph: object
    job_title: object
    job_dates: object
    bullet_item: object
    tags_line: object


def _load_snippets(template: Document) -> _Snippets:
    paragraphs = template.paragraphs
    return _Snippets(
        header_table=copy.deepcopy(template.tables[0]._tbl),
        section_heading=copy.deepcopy(paragraphs[1]._p),
        body_paragraph=copy.deepcopy(paragraphs[2]._p),
        job_title=copy.deepcopy(paragraphs[8]._p),
        job_dates=copy.deepcopy(paragraphs[9]._p),
        bullet_item=copy.deepcopy(paragraphs[11]._p),
        tags_line=copy.deepcopy(paragraphs[5]._p),
    )


def _clear_body(document: Document) -> None:
    body = document.element.body
    sect_pr = body.find(qn("w:sectPr"))
    for child in list(body):
        if child is not sect_pr:
            body.remove(child)

    # The template's own example hyperlinks (e.g. "github.com/yourusername")
    # lived in the body just removed above, so their relationship entries
    # are now orphaned — nothing left in the document references them.
    for r_id in [
        rid for rid, rel in document.part.rels.items() if "hyperlink" in rel.reltype
    ]:
        document.part.drop_rel(r_id)


def _append_element(document: Document, element) -> None:
    document.element.body.find(qn("w:sectPr")).addprevious(element)


def _clear_runs(paragraph_element) -> None:
    """Removes a cloned paragraph's placeholder text (runs and hyperlinks)
    while keeping its pPr (spacing, indent, bullet numbering) intact."""
    for child in list(paragraph_element):
        if child.tag in (qn("w:r"), qn("w:hyperlink")):
            paragraph_element.remove(child)


def _set_run_text(run_element, text: str) -> None:
    t = run_element.find(qn("w:t"))
    if t is None:
        t = OxmlElement("w:t")
        run_element.append(t)
    t.set(qn("xml:space"), "preserve")
    t.text = text


def _set_run_color(run_element, hex_value: str) -> None:
    rPr = run_element.find(qn("w:rPr"))
    if rPr is None:
        return
    color_el = rPr.find(qn("w:color"))
    if color_el is None:
        color_el = OxmlElement("w:color")
        rPr.append(color_el)
    color_el.set(qn("w:val"), hex_value.lstrip("#").upper())
    theme_color = color_el.get(qn("w:themeColor"))
    if theme_color is not None:
        del color_el.attrib[qn("w:themeColor")]


def _recolor_table_fill(table_element, hex_value: str) -> None:
    fill = hex_value.lstrip("#").upper()
    for shd in table_element.iter(qn("w:shd")):
        shd.set(qn("w:fill"), fill)


def _new_run(
    text: str,
    style: _TextStyle,
    *,
    bold: bool = False,
    italic: bool = False,
    underline: bool = False,
) -> object:
    run = OxmlElement("w:r")
    rPr = OxmlElement("w:rPr")

    if style.font:
        r_fonts = OxmlElement("w:rFonts")
        r_fonts.set(qn("w:ascii"), style.font)
        r_fonts.set(qn("w:hAnsi"), style.font)
        r_fonts.set(qn("w:cs"), style.font)
        rPr.append(r_fonts)
    if bold or style.bold:
        rPr.append(OxmlElement("w:b"))
    if italic:
        rPr.append(OxmlElement("w:i"))
    if underline:
        u = OxmlElement("w:u")
        u.set(qn("w:val"), "single")
        rPr.append(u)

    color_el = OxmlElement("w:color")
    color_el.set(qn("w:val"), style.color)
    rPr.append(color_el)

    run.append(rPr)

    t = OxmlElement("w:t")
    t.set(qn("xml:space"), "preserve")
    t.text = text
    run.append(t)
    return run


def _new_hyperlink(
    document: Document,
    text: str,
    url: str,
    style: _TextStyle,
    *,
    bold: bool = False,
    italic: bool = False,
) -> object:
    """python-docx has no native hyperlink support; this builds the
    `w:hyperlink` element directly, the documented low-level approach.

    Checked here (not just by callers) so every hyperlink in the document —
    header links included — goes through the same scheme allowlist as
    Markdown-lite body links, rather than relying on each call site to
    remember the check.
    """
    if not is_safe_url(url):
        return _new_run(text, style, bold=bold, italic=italic)

    r_id = document.part.relate_to(url, _LINK_RELATIONSHIP, is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), r_id)
    hyperlink.append(_new_run(text, style, bold=bold, italic=italic, underline=True))
    return hyperlink


def _append_segment(
    document: Document,
    paragraph_element,
    segment: InlineSegment,
    style: _TextStyle,
) -> None:
    if segment.url:
        link_style = _TextStyle(font=style.font, color=_BODY_LINK_COLOR)
        paragraph_element.append(
            _new_hyperlink(
                document,
                segment.text,
                segment.url,
                link_style,
                bold=segment.bold,
                italic=segment.italic,
            )
        )
        return

    paragraph_element.append(
        _new_run(
            segment.text,
            style,
            bold=segment.bold,
            italic=segment.italic,
            underline=segment.underline,
        )
    )


def _render_markdown_lite(document: Document, snippets: _Snippets, text: str) -> None:
    for block in parse_blocks(text):
        if block.kind == "bullet_list":
            for line in block.lines:
                el = copy.deepcopy(snippets.bullet_item)
                _clear_runs(el)
                for segment in parse_inline(line):
                    _append_segment(document, el, segment, _BODY_STYLE)
                _append_element(document, el)
        else:
            el = copy.deepcopy(snippets.body_paragraph)
            _clear_runs(el)
            for segment in parse_inline(block.lines[0]):
                _append_segment(document, el, segment, _BODY_STYLE)
            _append_element(document, el)


def _render_entries(
    document: Document, snippets: _Snippets, section: EntriesSection
) -> None:
    for entry in section.entries:
        title_el = copy.deepcopy(snippets.job_title)
        _set_run_text(title_el.find(qn("w:r")), entry.heading)
        _append_element(document, title_el)

        if entry.dates:
            dates_el = copy.deepcopy(snippets.job_dates)
            _set_run_text(dates_el.find(qn("w:r")), entry.dates)
            _append_element(document, dates_el)

        _render_markdown_lite(document, snippets, entry.body)


def _render_list(document: Document, snippets: _Snippets, section: ListSection) -> None:
    for item in section.items:
        _render_markdown_lite(document, snippets, item)


def _render_tags(document: Document, snippets: _Snippets, section: TagsSection) -> None:
    for category in section.categories:
        el = copy.deepcopy(snippets.tags_line)
        runs = el.findall(qn("w:r"))
        _set_run_text(runs[0], f"{category.label}:")
        _set_run_text(runs[1], f" {', '.join(category.items)}")
        _append_element(document, el)


def _render_pairs(
    document: Document, snippets: _Snippets, section: PairsSection
) -> None:
    for pair in section.pairs:
        el = copy.deepcopy(snippets.body_paragraph)
        _set_run_text(el.find(qn("w:r")), f"{pair.left}: {pair.right}")
        _append_element(document, el)


def _render_section_body(
    document: Document, snippets: _Snippets, section: ProfileSection
) -> None:
    if isinstance(section, TextSection):
        _render_markdown_lite(document, snippets, section.body)
    elif isinstance(section, EntriesSection):
        _render_entries(document, snippets, section)
    elif isinstance(section, ListSection):
        _render_list(document, snippets, section)
    elif isinstance(section, TagsSection):
        _render_tags(document, snippets, section)
    elif isinstance(section, PairsSection):
        _render_pairs(document, snippets, section)


def _rebuild_contact_paragraph(paragraph_element, header: ProfileHeader) -> None:
    _clear_runs(paragraph_element)
    parts = [part for part in (header.email, header.phone, header.location) if part]
    text = " | ".join(parts)
    if text:
        paragraph_element.append(_new_run(text, _HEADER_TEXT_STYLE))


def _rebuild_links_paragraph(
    document: Document, paragraph_element, links: list
) -> None:
    _clear_runs(paragraph_element)
    for index, link in enumerate(links):
        if index > 0:
            paragraph_element.append(_new_run(" | ", _HEADER_TEXT_STYLE))
        paragraph_element.append(
            _new_hyperlink(document, link.label, link.url, _HEADER_TEXT_STYLE)
        )


def _build_header(
    document: Document, snippets: _Snippets, header: ProfileHeader
) -> None:
    table_el = copy.deepcopy(snippets.header_table)
    _recolor_table_fill(table_el, header.primary_color)

    cell = table_el.findall(qn("w:tr"))[0].findall(qn("w:tc"))[1]
    cell_paragraphs = cell.findall(qn("w:p"))

    _set_run_text(cell_paragraphs[0].find(qn("w:r")), header.full_name)
    _set_run_text(cell_paragraphs[1].find(qn("w:r")), header.career_title)
    _rebuild_contact_paragraph(cell_paragraphs[2], header)
    _rebuild_links_paragraph(document, cell_paragraphs[3], header.links)

    _append_element(document, table_el)
    _append_element(document, OxmlElement("w:p"))  # spacer, matches the template


def build_resume_document(profile: Profile) -> Document:
    document = Document(TEMPLATE_PATH)
    snippets = _load_snippets(document)
    _clear_body(document)

    _build_header(document, snippets, profile.header)

    for section in profile.sections:
        heading_el = copy.deepcopy(snippets.section_heading)
        heading_run = heading_el.find(qn("w:r"))
        _set_run_text(heading_run, section.title)
        _set_run_color(heading_run, profile.header.secondary_color)
        _append_element(document, heading_el)

        _render_section_body(document, snippets, section)

    return document
