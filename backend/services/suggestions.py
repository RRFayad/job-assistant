import uuid

from schemas.profile import (
    EntriesSection,
    ListSection,
    Pair,
    PairsSection,
    ProfileHeader,
    SuggestHeaderTarget,
    SuggestionTarget,
    SuggestSectionTarget,
    TagsSection,
    TextSection,
)

# Every suggestion here is a hardcoded, obviously-canned transformation —
# no real AI. The contract this stands in for (propose a full replacement
# object, never mutate silently) is what a real integration gets built
# against later; see ADR-0005 (Grounding) and ADR-0006 (AI suggestions never
# silently overwrite data).


def _suggest_header(header: ProfileHeader) -> ProfileHeader:
    # TODO: replace with a real AI-generated suggestion.
    return header.model_copy(
        update={"career_title": f"{header.career_title} — results-driven professional"}
    )


def suggest(target: SuggestionTarget) -> SuggestionTarget:
    if isinstance(target, SuggestHeaderTarget):
        return SuggestHeaderTarget(kind="header", header=_suggest_header(target.header))

    section = target.section

    if isinstance(section, TextSection):
        # TODO: replace with a real AI-generated suggestion.
        suggested = section.model_copy(
            update={
                "body": f"{section.body} This work consistently delivered measurable impact."
            }
        )
    elif isinstance(section, EntriesSection):
        # TODO: replace with a real AI-generated suggestion.
        if not section.entries:
            suggested = section
        else:
            updated = list(section.entries)
            last = updated[-1]
            updated[-1] = last.model_copy(
                update={"body": f"{last.body} Delivered measurable impact."}
            )
            suggested = section.model_copy(update={"entries": updated})
    elif isinstance(section, ListSection):
        # TODO: replace with a real AI-generated suggestion.
        suggested = section.model_copy(
            update={"items": [*section.items, "AI-suggested addition"]}
        )
    elif isinstance(section, TagsSection):
        # TODO: replace with a real AI-generated suggestion.
        if not section.categories:
            suggested = section
        else:
            categories = list(section.categories)
            first = categories[0]
            categories[0] = first.model_copy(
                update={"items": [*first.items, "AI-suggested skill"]}
            )
            suggested = section.model_copy(update={"categories": categories})
    else:
        # TODO: replace with a real AI-generated suggestion.
        suggested = section.model_copy(
            update={
                "pairs": [
                    *section.pairs,
                    Pair(id=str(uuid.uuid4()), left="AI Suggested", right="Value"),
                ]
            }
        )

    return SuggestSectionTarget(kind="section", section=suggested)
