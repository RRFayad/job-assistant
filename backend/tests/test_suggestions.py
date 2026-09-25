from schemas.profile import (
    EntriesSection,
    Entry,
    ListSection,
    Pair,
    PairsSection,
    ProfileHeader,
    SuggestHeaderTarget,
    SuggestSectionTarget,
    TagCategory,
    TagsSection,
    TextSection,
)
from services.suggestions import suggest


def _header(**overrides) -> ProfileHeader:
    defaults = dict(
        full_name="Jane Doe",
        career_title="AI Engineer",
        email="jane@example.com",
        phone="",
        location="",
        links=[],
        primary_color="#000000",
        secondary_color="#000000",
    )
    defaults.update(overrides)
    return ProfileHeader(**defaults)


def test_suggests_a_header_change_without_mutating_the_input() -> None:
    header = _header()

    result = suggest(SuggestHeaderTarget(kind="header", header=header))

    assert isinstance(result, SuggestHeaderTarget)
    assert result.header.career_title != header.career_title
    assert result.header.career_title.startswith("AI Engineer")
    assert result.header is not header
    assert header.career_title == "AI Engineer"  # original untouched


def test_suggests_appending_to_a_text_section_body() -> None:
    section = TextSection(id="s1", type="text", title="Summary", body="Original.")

    result = suggest(SuggestSectionTarget(kind="section", section=section))

    assert isinstance(result, SuggestSectionTarget)
    assert result.section.body.startswith("Original.")
    assert result.section.body != section.body
    assert section.body == "Original."  # original untouched


def test_suggests_appending_to_the_last_entry_of_an_entries_section() -> None:
    section = EntriesSection(
        id="s1",
        type="entries",
        title="Experience",
        entries=[
            Entry(id="e1", heading="Old role", dates="2019", body="Did old things."),
            Entry(id="e2", heading="New role", dates="2023", body="Did new things."),
        ],
    )

    result = suggest(SuggestSectionTarget(kind="section", section=section))

    assert result.section.entries[0].body == "Did old things."
    assert result.section.entries[1].body != "Did new things."
    assert result.section.entries[1].body.startswith("Did new things.")


def test_entries_section_with_no_entries_is_unchanged() -> None:
    section = EntriesSection(id="s1", type="entries", title="Experience", entries=[])

    result = suggest(SuggestSectionTarget(kind="section", section=section))

    assert result.section.entries == []


def test_suggests_a_new_list_item() -> None:
    section = ListSection(id="s1", type="list", title="Projects", items=["A"])

    result = suggest(SuggestSectionTarget(kind="section", section=section))

    assert result.section.items == ["A", "AI-suggested addition"]


def test_suggests_a_new_tag_in_the_first_category() -> None:
    section = TagsSection(
        id="s1",
        type="tags",
        title="Skills",
        categories=[TagCategory(id="c1", label="Languages", items=["Python"])],
    )

    result = suggest(SuggestSectionTarget(kind="section", section=section))

    assert result.section.categories[0].items == ["Python", "AI-suggested skill"]


def test_tags_section_with_no_categories_is_unchanged() -> None:
    section = TagsSection(id="s1", type="tags", title="Skills", categories=[])

    result = suggest(SuggestSectionTarget(kind="section", section=section))

    assert result.section.categories == []


def test_suggests_a_new_pair() -> None:
    section = PairsSection(
        id="s1",
        type="pairs",
        title="Languages",
        pairs=[Pair(id="p1", left="English", right="Fluent")],
    )

    result = suggest(SuggestSectionTarget(kind="section", section=section))

    assert len(result.section.pairs) == 2
    assert result.section.pairs[0] == section.pairs[0]
    assert result.section.pairs[1].left == "AI Suggested"
