from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor
from docx.text.paragraph import Paragraph

from schemas.profile import (
    EntriesSection,
    ListSection,
    PairsSection,
    Profile,
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

_LINK_RELATIONSHIP = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"
)
_LINK_COLOR = "0563C1"


def _color(hex_value: str) -> RGBColor:
    return RGBColor.from_string(hex_value.lstrip("#").upper())


def add_hyperlink_run(
    paragraph: Paragraph,
    text: str,
    url: str,
    bold: bool = False,
    italic: bool = False,
) -> None:
    """python-docx has no native hyperlink support; this builds the
    `w:hyperlink` element directly, the documented low-level approach.

    Checked here (not just by callers) so every hyperlink in the document —
    header links included — goes through the same scheme allowlist as
    Markdown-lite body links, rather than relying on each call site to
    remember the check.
    """
    if not is_safe_url(url):
        run = paragraph.add_run(text)
        run.bold = bold or None
        run.italic = italic or None
        return

    part = paragraph.part
    r_id = part.relate_to(url, _LINK_RELATIONSHIP, is_external=True)

    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), r_id)

    run = OxmlElement("w:r")
    run_properties = OxmlElement("w:rPr")

    color = OxmlElement("w:color")
    color.set(qn("w:val"), _LINK_COLOR)
    run_properties.append(color)

    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    run_properties.append(underline)

    if bold:
        run_properties.append(OxmlElement("w:b"))
    if italic:
        run_properties.append(OxmlElement("w:i"))

    run.append(run_properties)

    text_element = OxmlElement("w:t")
    text_element.set(qn("xml:space"), "preserve")
    text_element.text = text
    run.append(text_element)

    hyperlink.append(run)
    paragraph._p.append(hyperlink)


def add_inline_segment(paragraph: Paragraph, segment: InlineSegment) -> None:
    if segment.url:
        add_hyperlink_run(
            paragraph,
            segment.text,
            segment.url,
            bold=segment.bold,
            italic=segment.italic,
        )
        return

    run = paragraph.add_run(segment.text)
    if segment.bold:
        run.bold = True
    if segment.italic:
        run.italic = True
    if segment.underline:
        run.underline = True


def render_markdown_lite(document: Document, text: str) -> None:
    for block in parse_blocks(text):
        if block.kind == "bullet_list":
            for line in block.lines:
                paragraph = document.add_paragraph(style="List Bullet")
                for segment in parse_inline(line):
                    add_inline_segment(paragraph, segment)
        else:
            paragraph = document.add_paragraph()
            for segment in parse_inline(block.lines[0]):
                add_inline_segment(paragraph, segment)


def render_section_body(document: Document, section: ProfileSection) -> None:
    if isinstance(section, TextSection):
        render_markdown_lite(document, section.body)

    elif isinstance(section, EntriesSection):
        for entry in section.entries:
            heading = document.add_paragraph()
            heading_run = heading.add_run(entry.heading)
            heading_run.bold = True
            if entry.dates:
                dates_run = heading.add_run(f"  ({entry.dates})")
                dates_run.italic = True
            render_markdown_lite(document, entry.body)

    elif isinstance(section, ListSection):
        for item in section.items:
            render_markdown_lite(document, item)

    elif isinstance(section, TagsSection):
        for category in section.categories:
            paragraph = document.add_paragraph()
            label_run = paragraph.add_run(f"{category.label}: ")
            label_run.bold = True
            paragraph.add_run(", ".join(category.items))

    elif isinstance(section, PairsSection):
        for pair in section.pairs:
            document.add_paragraph(f"{pair.left}: {pair.right}")


def build_resume_document(profile: Profile) -> Document:
    document = Document()
    header = profile.header

    name_paragraph = document.add_paragraph()
    name_run = name_paragraph.add_run(header.full_name)
    name_run.bold = True
    name_run.font.size = Pt(20)
    name_run.font.color.rgb = _color(header.primary_color)

    if header.career_title:
        document.add_paragraph(header.career_title)

    contact_line = " | ".join(
        part for part in (header.email, header.phone, header.location) if part
    )
    if contact_line:
        document.add_paragraph(contact_line)

    if header.links:
        links_paragraph = document.add_paragraph()
        for index, link in enumerate(header.links):
            if index > 0:
                links_paragraph.add_run("  |  ")
            add_hyperlink_run(links_paragraph, link.label, link.url)

    for section in profile.sections:
        heading_paragraph = document.add_paragraph()
        heading_run = heading_paragraph.add_run(section.title)
        heading_run.bold = True
        heading_run.font.size = Pt(14)
        heading_run.font.color.rgb = _color(header.secondary_color)

        render_section_body(document, section)

    return document
