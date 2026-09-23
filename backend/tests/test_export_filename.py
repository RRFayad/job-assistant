from routers.profile import _build_export_filename, _content_disposition
from schemas.profile import Profile, ProfileHeader


def _profile(full_name: str, name: str = "My Profile") -> Profile:
    return Profile(
        id="1",
        name=name,
        header=ProfileHeader(
            full_name=full_name,
            career_title="",
            email="",
            phone="",
            location="",
            links=[],
            primary_color="#000000",
            secondary_color="#000000",
        ),
        sections=[],
    )


def test_combines_full_name_and_profile_name_hyphen_joined() -> None:
    # Recruiter-friendly and legible in a downloads folder or inbox, e.g.
    # "Jane-Doe_Full-Stack-Engineer_CV.docx" rather than a bare name.
    assert (
        _build_export_filename(_profile("Jane Doe", name="Full Stack Engineer"))
        == "Jane-Doe_Full-Stack-Engineer_CV.docx"
    )


def test_falls_back_to_profile_name_when_full_name_is_blank() -> None:
    assert _build_export_filename(_profile("")) == "My-Profile_CV.docx"


def test_falls_back_to_profile_name_when_full_name_is_whitespace_only() -> None:
    assert _build_export_filename(_profile("   ")) == "My-Profile_CV.docx"


def test_falls_back_to_resume_when_everything_is_blank() -> None:
    assert _build_export_filename(_profile("", name="  ")) == "resume.docx"


def test_strips_filesystem_unsafe_characters() -> None:
    assert (
        _build_export_filename(_profile('John/Doe:"Test"'))
        == "JohnDoeTest_My-Profile_CV.docx"
    )


def test_content_disposition_ascii_fallback_does_not_crash_on_non_latin1_names() -> (
    None
):
    header_value = _content_disposition("田中太郎.docx")
    # Must not raise — this is the actual failure mode being guarded against.
    header_value.encode("latin-1")
    assert 'filename="' in header_value
    assert "filename*=UTF-8''" in header_value


def test_content_disposition_preserves_the_real_name_in_the_utf8_parameter() -> None:
    header_value = _content_disposition("田中太郎.docx")
    assert "filename*=UTF-8''%E7%94%B0%E4%B8%AD%E5%A4%AA%E9%83%8E.docx" in (
        header_value
    )
