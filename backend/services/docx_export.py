import base64
import copy
import io
import re
from dataclasses import dataclass
from pathlib import Path

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image

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
_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"
RESUME_TEMPLATE_PATH = _TEMPLATES_DIR / "resume_template.docx"
# Same header content, minus the picture column — used whenever the Profile
# has no picture, so the header content takes the full width rather than
# leaving an empty colored gap where a photo would have been.
HEADER_NO_PIC_TEMPLATE_PATH = _TEMPLATES_DIR / "header_without_pic.docx"

_LINK_RELATIONSHIP = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"
)
_BODY_LINK_COLOR = "0563C1"
_HEADER_TEXT_COLOR = "E8E8E8"
_PICTURE_DATA_URL_RE = re.compile(r"^data:image/[^;]+;base64,(?P<data>.+)$", re.DOTALL)
_PICTURE_EXPORT_DPI = 300


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

    header_table_with_picture: object
    header_table_no_picture: object
    section_heading: object
    body_paragraph: object
    job_title: object
    job_dates: object
    bullet_item: object
    tags_line: object


def _cloned_paragraph_without_div_id(paragraph):
    """Deep-copies a paragraph, stripping `w:divId` — leftover metadata from
    this template having been authored via an HTML/web paste. Word links a
    `divId` to a border definition in word/webSettings.xml (not the
    paragraph's own `w:pBdr`, which is why grep-ing the paragraph alone
    finds nothing); left in place, every cloned occurrence of these
    paragraphs would silently grow that div's border, invisible until
    opened in Word and impossible to recolor per Profile.
    """
    element = copy.deepcopy(paragraph._p)
    pPr = element.find(qn("w:pPr"))
    if pPr is not None:
        div_id = pPr.find(qn("w:divId"))
        if div_id is not None:
            pPr.remove(div_id)
    return element


def _load_snippets(template: Document) -> _Snippets:
    paragraphs = template.paragraphs
    no_pic_document = Document(HEADER_NO_PIC_TEMPLATE_PATH)
    return _Snippets(
        header_table_with_picture=copy.deepcopy(template.tables[0]._tbl),
        header_table_no_picture=copy.deepcopy(no_pic_document.tables[0]._tbl),
        section_heading=_cloned_paragraph_without_div_id(paragraphs[1]),
        body_paragraph=_cloned_paragraph_without_div_id(paragraphs[2]),
        job_title=_cloned_paragraph_without_div_id(paragraphs[8]),
        job_dates=_cloned_paragraph_without_div_id(paragraphs[9]),
        bullet_item=_cloned_paragraph_without_div_id(paragraphs[11]),
        tags_line=_cloned_paragraph_without_div_id(paragraphs[5]),
    )


def _clear_body(document: Document) -> None:
    body = document.element.body
    sect_pr = body.find(qn("w:sectPr"))
    for child in list(body):
        if child is not sect_pr:
            body.remove(child)

    # The template's own example hyperlinks and placeholder headshot lived
    # in the body just removed above, so their relationship entries are now
    # orphaned — nothing left in the document references them. (The header
    # table snippet was already deep-copied before this runs, and either
    # gets its picture relationship freshly created or never had one, so
    # dropping these here can't break it — see _build_header/_embed_picture.)
    for r_id in [
        rid
        for rid, rel in document.part.rels.items()
        if "hyperlink" in rel.reltype or "image" in rel.reltype
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


def _set_bottom_border(paragraph_element, hex_value: str) -> None:
    """A thin rule under a section heading, colored to match its text —
    the divider line under "Profile & Career", "Skills", etc."""
    pPr = paragraph_element.find(qn("w:pPr"))
    if pPr is None:
        pPr = OxmlElement("w:pPr")
        paragraph_element.insert(0, pPr)

    p_bdr = pPr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        # w:pBdr must precede w:spacing/w:jc/etc. in CT_PPrBase's schema
        # order, so it goes first among pPr's children, not appended last.
        pPr.insert(0, p_bdr)

    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    # Matches the thickness/spacing of the template's own (now-removed,
    # fixed-color) divId-linked border — see _cloned_paragraph_without_div_id.
    bottom.set(qn("w:sz"), "8")
    bottom.set(qn("w:space"), "3")
    bottom.set(qn("w:color"), hex_value.lstrip("#").upper())
    p_bdr.append(bottom)


def _recolor_table_fill(table_element, hex_value: str) -> None:
    fill = hex_value.lstrip("#").upper()
    for shd in table_element.iter(qn("w:shd")):
        shd.set(qn("w:fill"), fill)


def _text_run(paragraph_element):
    """The first run that actually carries text — as opposed to, say, the
    picture template's name paragraph, whose *first* run anchors the
    headshot image and has no `w:t` of its own."""
    for run in paragraph_element.findall(qn("w:r")):
        if run.find(qn("w:t")) is not None:
            return run
    return None


def _decode_picture_data_url(data_url: str) -> bytes:
    match = _PICTURE_DATA_URL_RE.match(data_url)
    if not match:
        raise ValueError("Unsupported picture data URL")
    return base64.b64decode(match.group("data"))


def _crop_and_resize_picture(
    image_bytes: bytes, target_cx: int, target_cy: int
) -> bytes:
    """Center-crops to the picture frame's exact aspect ratio, then resizes
    to it at print resolution — so the frame in the generated document is
    filled edge to edge with no stretching or distortion, regardless of the
    uploaded photo's own dimensions."""
    target_ratio = target_cx / target_cy

    with Image.open(io.BytesIO(image_bytes)) as image:
        image = image.convert("RGB")
        width, height = image.size
        current_ratio = width / height

        if current_ratio > target_ratio:
            cropped_width = round(height * target_ratio)
            left = (width - cropped_width) // 2
            image = image.crop((left, 0, left + cropped_width, height))
        elif current_ratio < target_ratio:
            cropped_height = round(width / target_ratio)
            top = (height - cropped_height) // 2
            image = image.crop((0, top, width, top + cropped_height))

        out_width = round(target_cx / 914400 * _PICTURE_EXPORT_DPI)
        out_height = round(target_cy / 914400 * _PICTURE_EXPORT_DPI)
        image = image.resize((out_width, out_height), Image.LANCZOS)

        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()


def _embed_picture(document: Document, table_element, data_url: str) -> None:
    drawing = next(table_element.iter(qn("w:drawing")))
    extent = next(drawing.iter(qn("wp:extent")))
    target_cx = int(extent.get("cx"))
    target_cy = int(extent.get("cy"))

    png_bytes = _crop_and_resize_picture(
        _decode_picture_data_url(data_url), target_cx, target_cy
    )
    r_id, _ = document.part.get_or_add_image(io.BytesIO(png_bytes))

    blip = next(drawing.iter(qn("a:blip")))
    blip.set(qn("r:embed"), r_id)

    blip_fill = blip.getparent()
    src_rect = blip_fill.find(qn("a:srcRect"))
    if src_rect is not None:
        # The template's crop percentages are tuned to its own placeholder
        # photo; the image above is already cropped to the right aspect
        # ratio, so re-applying them here would crop it a second time.
        blip_fill.remove(src_rect)


def _run_properties(
    style: _TextStyle,
    *,
    bold: bool = False,
    italic: bool = False,
    underline: bool = False,
) -> object:
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

    return rPr


def _new_run(
    text: str,
    style: _TextStyle,
    *,
    bold: bool = False,
    italic: bool = False,
    underline: bool = False,
) -> object:
    run = OxmlElement("w:r")
    run.append(_run_properties(style, bold=bold, italic=italic, underline=underline))

    t = OxmlElement("w:t")
    t.set(qn("xml:space"), "preserve")
    t.text = text
    run.append(t)
    return run


def _new_line_break(style: _TextStyle) -> object:
    run = OxmlElement("w:r")
    run.append(_run_properties(style))
    run.append(OxmlElement("w:br"))
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
    """Matches the template's own contact line: email/phone on one line,
    then a real line break, then location on its own line below — not all
    three run together on one line separated by "|"."""
    _clear_runs(paragraph_element)
    top_line = " | ".join(part for part in (header.email, header.phone) if part)
    location = header.location.strip()

    if top_line:
        paragraph_element.append(_new_run(top_line, _HEADER_TEXT_STYLE))
    if top_line and location:
        paragraph_element.append(_new_line_break(_HEADER_TEXT_STYLE))
    if location:
        paragraph_element.append(_new_run(location, _HEADER_TEXT_STYLE))


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
    has_picture = bool(header.picture)
    if has_picture:
        table_el = copy.deepcopy(snippets.header_table_with_picture)
        _embed_picture(document, table_el, header.picture)
    else:
        table_el = copy.deepcopy(snippets.header_table_no_picture)
    _recolor_table_fill(table_el, header.primary_color)

    # The picture layout has a picture column before the text column; the
    # no-picture layout is a single full-width cell.
    cells = table_el.findall(qn("w:tr"))[0].findall(qn("w:tc"))
    cell = cells[1] if has_picture else cells[0]
    cell_paragraphs = cell.findall(qn("w:p"))

    _set_run_text(_text_run(cell_paragraphs[0]), header.full_name)
    _set_run_text(_text_run(cell_paragraphs[1]), header.career_title)
    _rebuild_contact_paragraph(cell_paragraphs[2], header)
    _rebuild_links_paragraph(document, cell_paragraphs[3], header.links)

    _append_element(document, table_el)
    _append_element(document, OxmlElement("w:p"))  # spacer, matches the template


def build_resume_document(profile: Profile) -> Document:
    document = Document(RESUME_TEMPLATE_PATH)
    snippets = _load_snippets(document)
    _clear_body(document)

    _build_header(document, snippets, profile.header)

    for section in profile.sections:
        heading_el = copy.deepcopy(snippets.section_heading)
        heading_run = heading_el.find(qn("w:r"))
        _set_run_text(heading_run, section.title)
        _set_run_color(heading_run, profile.header.secondary_color)
        _set_bottom_border(heading_el, profile.header.secondary_color)
        _append_element(document, heading_el)

        _render_section_body(document, snippets, section)

    return document
