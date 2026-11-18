from services.markdown_lite import InlineSegment, TextBlock, parse_blocks, parse_inline


def test_parses_bold() -> None:
    assert parse_inline("**bold**") == [InlineSegment(text="bold", bold=True)]


def test_parses_italic() -> None:
    assert parse_inline("*italic*") == [InlineSegment(text="italic", italic=True)]


def test_parses_underline() -> None:
    assert parse_inline("++underline++") == [
        InlineSegment(text="underline", underline=True)
    ]


def test_parses_link() -> None:
    assert parse_inline("[Google](https://google.com)") == [
        InlineSegment(text="Google", url="https://google.com")
    ]


def test_bold_and_italic_in_the_same_line_do_not_cross_match() -> None:
    assert parse_inline("**bold** and *italic*") == [
        InlineSegment(text="bold", bold=True),
        InlineSegment(text=" and "),
        InlineSegment(text="italic", italic=True),
    ]


def test_a_link_nested_inside_bold_is_still_a_real_link() -> None:
    assert parse_inline("**[Bold Link](https://a.com)**") == [
        InlineSegment(text="Bold Link", bold=True, url="https://a.com")
    ]


def test_a_link_nested_inside_italic_is_still_a_real_link() -> None:
    assert parse_inline("*[Italic Link](https://a.com)*") == [
        InlineSegment(text="Italic Link", italic=True, url="https://a.com")
    ]


def test_preserves_plain_text_around_formatted_segments() -> None:
    assert parse_inline("Hello **world**!") == [
        InlineSegment(text="Hello "),
        InlineSegment(text="world", bold=True),
        InlineSegment(text="!"),
    ]


def test_preserves_a_url_with_a_nested_parenthesis() -> None:
    assert parse_inline(
        "[Wiki](https://en.wikipedia.org/wiki/C_(programming_language))"
    ) == [
        InlineSegment(
            text="Wiki",
            url="https://en.wikipedia.org/wiki/C_(programming_language)",
        )
    ]


def test_does_not_merge_two_separate_links_on_the_same_line() -> None:
    assert parse_inline("[A](https://a.com) and [B](https://b.com)") == [
        InlineSegment(text="A", url="https://a.com"),
        InlineSegment(text=" and "),
        InlineSegment(text="B", url="https://b.com"),
    ]


def test_does_not_treat_a_javascript_link_as_a_hyperlink() -> None:
    result = parse_inline("[Click here](javascript:alert(1))")
    assert result == [InlineSegment(text="Click here")]


def test_allows_relative_and_hash_links() -> None:
    assert parse_inline("[Home](/home)") == [InlineSegment(text="Home", url="/home")]


def test_groups_consecutive_bullet_lines_into_one_block() -> None:
    assert parse_blocks("- one\n- two") == [
        TextBlock(kind="bullet_list", lines=("one", "two"))
    ]


def test_separates_bullet_groups_from_surrounding_paragraphs() -> None:
    assert parse_blocks("intro\n- one\n- two\noutro") == [
        TextBlock(kind="paragraph", lines=("intro",)),
        TextBlock(kind="bullet_list", lines=("one", "two")),
        TextBlock(kind="paragraph", lines=("outro",)),
    ]


def test_skips_blank_lines() -> None:
    assert parse_blocks("one\n\ntwo") == [
        TextBlock(kind="paragraph", lines=("one",)),
        TextBlock(kind="paragraph", lines=("two",)),
    ]
