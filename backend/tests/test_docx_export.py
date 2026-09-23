import io

from docx import Document
from docx.oxml.ns import qn

from schemas.profile import (
    EntriesSection,
    Entry,
    ListSection,
    Pair,
    PairsSection,
    Profile,
    ProfileHeader,
    ProfileLink,
    TagCategory,
    TagsSection,
    TextSection,
)
from services.docx_export import build_resume_document


def _make_profile(**overrides) -> Profile:
    defaults = dict(
        id="1",
        name="Test Profile",
        header=ProfileHeader(
            full_name="Jane Doe",
            career_title="AI Engineer",
            email="jane@example.com",
            phone="555-0100",
            location="Remote",
            links=[ProfileLink(id="l1", label="GitHub", url="https://github.com")],
            primary_color="#2563eb",
            secondary_color="#7c3aed",
        ),
        sections=[],
    )
    defaults.update(overrides)
    return Profile(**defaults)


def _reload(document: Document) -> Document:
    """Round-trips through bytes, the way the real export endpoint would
    serve it, to make sure the generated XML is actually valid."""
    buffer = io.BytesIO()
    document.save(buffer)
    buffer.seek(0)
    return Document(buffer)


def _paragraph_texts(document: Document) -> list[str]:
    return [p.text for p in document.paragraphs]


def test_includes_header_fields() -> None:
    profile = _make_profile()
    document = _reload(build_resume_document(profile))

    texts = _paragraph_texts(document)
    assert "Jane Doe" in texts
    assert "AI Engineer" in texts
    assert any("jane@example.com" in t for t in texts)


def test_header_name_uses_the_primary_color() -> None:
    profile = _make_profile()
    document = build_resume_document(profile)

    name_paragraph = document.paragraphs[0]
    assert name_paragraph.runs[0].font.color.rgb is not None
    assert str(name_paragraph.runs[0].font.color.rgb) == "2563EB"


def test_header_link_is_a_real_hyperlink() -> None:
    profile = _make_profile()
    document = _reload(build_resume_document(profile))

    links_paragraph = next(p for p in document.paragraphs if "GitHub" in p.text)
    hyperlinks = links_paragraph._p.findall(qn("w:hyperlink"))
    assert len(hyperlinks) == 1


def test_header_link_with_an_unsafe_scheme_is_not_a_hyperlink() -> None:
    profile = _make_profile(
        header=ProfileHeader(
            full_name="Jane Doe",
            career_title="AI Engineer",
            email="jane@example.com",
            phone="555-0100",
            location="Remote",
            links=[ProfileLink(id="l1", label="Evil", url="javascript:alert(1)")],
            primary_color="#2563eb",
            secondary_color="#7c3aed",
        )
    )
    document = _reload(build_resume_document(profile))

    links_paragraph = next(p for p in document.paragraphs if "Evil" in p.text)
    hyperlinks = links_paragraph._p.findall(qn("w:hyperlink"))
    assert len(hyperlinks) == 0


def test_text_section_renders_bold_run_from_markdown_lite() -> None:
    profile = _make_profile(
        sections=[
            TextSection(id="s1", type="text", title="Summary", body="**Bold** text"),
        ]
    )
    document = _reload(build_resume_document(profile))

    body_paragraph = next(p for p in document.paragraphs if "Bold" in p.text)
    bold_run = next(r for r in body_paragraph.runs if r.text == "Bold")
    assert bold_run.bold is True


def test_text_section_link_becomes_a_real_hyperlink() -> None:
    profile = _make_profile(
        sections=[
            TextSection(
                id="s1",
                type="text",
                title="Summary",
                body="See [my site](https://example.com)",
            ),
        ]
    )
    document = _reload(build_resume_document(profile))

    body_paragraph = next(p for p in document.paragraphs if "my site" in p.text)
    hyperlinks = body_paragraph._p.findall(qn("w:hyperlink"))
    assert len(hyperlinks) == 1


def test_entries_section_renders_heading_dates_and_body() -> None:
    profile = _make_profile(
        sections=[
            EntriesSection(
                id="s1",
                type="entries",
                title="Experience",
                entries=[
                    Entry(
                        id="e1",
                        heading="Engineer, Acme",
                        dates="2020 - 2022",
                        body="Did the work.",
                    ),
                ],
            ),
        ]
    )
    document = _reload(build_resume_document(profile))
    texts = _paragraph_texts(document)

    assert any("Engineer, Acme" in t and "2020 - 2022" in t for t in texts)
    assert any(t == "Did the work." for t in texts)


def test_list_section_renders_each_item_as_its_own_paragraph() -> None:
    profile = _make_profile(
        sections=[
            ListSection(id="s1", type="list", title="Projects", items=["A", "B"]),
        ]
    )
    document = _reload(build_resume_document(profile))
    texts = _paragraph_texts(document)

    assert "A" in texts
    assert "B" in texts


def test_tags_section_renders_category_and_joined_tags() -> None:
    profile = _make_profile(
        sections=[
            TagsSection(
                id="s1",
                type="tags",
                title="Skills",
                categories=[
                    TagCategory(id="c1", label="Languages", items=["Python", "TS"]),
                ],
            ),
        ]
    )
    document = _reload(build_resume_document(profile))
    texts = _paragraph_texts(document)

    assert any("Languages" in t and "Python, TS" in t for t in texts)


def test_pairs_section_renders_label_colon_value() -> None:
    profile = _make_profile(
        sections=[
            PairsSection(
                id="s1",
                type="pairs",
                title="Languages",
                pairs=[Pair(id="p1", left="English", right="Fluent")],
            ),
        ]
    )
    document = _reload(build_resume_document(profile))
    texts = _paragraph_texts(document)

    assert "English: Fluent" in texts


def test_section_title_uses_the_secondary_color() -> None:
    profile = _make_profile(
        sections=[
            TextSection(id="s1", type="text", title="Summary", body="hi"),
        ]
    )
    document = build_resume_document(profile)

    heading_paragraph = next(p for p in document.paragraphs if p.text == "Summary")
    assert str(heading_paragraph.runs[0].font.color.rgb) == "7C3AED"
