import io
import json
import re
import uuid
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from starlette import status

from auth.auth import current_user_dependency
from schemas.profile import (
    EntriesSection,
    Entry,
    Profile,
    ProfileHeader,
    ProfileLink,
    SuggestionTarget,
    TextSection,
)
from services.docx_export import build_resume_document
from services.suggestions import suggest

router = APIRouter(prefix="/profile", tags=["profile"])

_MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB

_UNSAFE_FILENAME_CHARS = re.compile(r'[\\/:*?"<>|]')


def _build_export_filename(profile: Profile) -> str:
    """A recruiter-friendly name, e.g. "Jane-Doe_Frontend-Engineer_CV.docx" —
    legible at a glance in a downloads folder or an inbox attachment list,
    rather than a bare name or a generic "resume.docx"."""
    name_part = "-".join(profile.header.full_name.split())
    profile_part = "-".join(profile.name.split())

    parts = [part for part in (name_part, profile_part) if part]
    base = "_".join([*parts, "CV"]) if parts else "resume"

    base = _UNSAFE_FILENAME_CHARS.sub("", base)
    return f"{base}.docx"


def _content_disposition(filename: str) -> str:
    """A non-Latin-1 filename crashes ASGI's header encoding outright, so the
    plain `filename=` parameter always gets an ASCII-safe fallback; the
    RFC 6266 `filename*=` parameter carries the real name for the (near-
    universal) clients that support it."""
    ascii_filename = filename.encode("ascii", "replace").decode("ascii")
    return (
        f'attachment; filename="{ascii_filename}"; '
        f"filename*=UTF-8''{quote(filename)}"
    )


# Optional, gitignored, developer-local seed data — e.g. a real resume for
# visually comparing the real implementation against a prototype. Falls back
# to an empty list (no fake placeholder data ships in the repo) when absent,
# which also exercises the zero-Profile onboarding flow on a fresh clone.
_DEV_SEED_PATH = Path(__file__).resolve().parent.parent / "dev_seed_profiles.json"


def _load_seed_profiles() -> list[Profile]:
    if not _DEV_SEED_PATH.exists():
        return []
    raw = json.loads(_DEV_SEED_PATH.read_text())
    return [Profile.model_validate(item) for item in raw]


SEED_PROFILES: list[Profile] = _load_seed_profiles()


@router.get("/", response_model=list[Profile], status_code=status.HTTP_200_OK)
def get_profiles(user: current_user_dependency) -> list[Profile]:
    return SEED_PROFILES


@router.put("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def save_profile(
    profile_id: str, profile: Profile, user: current_user_dependency
) -> None:
    """Accepts and discards the payload — no persistence yet (see #4)."""
    return None


@router.post("/extract", response_model=Profile, status_code=status.HTTP_200_OK)
async def extract_profile(
    user: current_user_dependency,
    file: UploadFile = File(...),
) -> Profile:
    """Mocked extraction: ignores the uploaded file's actual content and
    returns canned data for the Candidate to review — no real parsing or AI
    yet (see #9)."""
    content = await file.read()  # Content is intentionally unused beyond this.
    if len(content) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="File is too large (max 10MB)",
        )

    return Profile(
        id=str(uuid.uuid4()),
        name="Uploaded Resume",
        header=ProfileHeader(
            full_name="Alex Rivera",
            career_title="Product Manager",
            email="alex.rivera@example.com",
            phone="+1 555-0199",
            location="New York, NY",
            links=[
                ProfileLink(
                    id=str(uuid.uuid4()),
                    label="LinkedIn",
                    url="https://linkedin.com",
                ),
            ],
            primary_color="#059669",
            secondary_color="#d97706",
        ),
        sections=[
            TextSection(
                id=str(uuid.uuid4()),
                type="text",
                title="Summary",
                body=(
                    "Product Manager with **6 years** of experience leading"
                    " cross-functional teams from discovery to launch."
                ),
            ),
            EntriesSection(
                id=str(uuid.uuid4()),
                type="entries",
                title="Experience",
                entries=[
                    Entry(
                        id=str(uuid.uuid4()),
                        heading="Senior Product Manager, Globex Inc",
                        dates="2021 - Present",
                        body="Owned the roadmap for a B2B SaaS platform.",
                    ),
                ],
            ),
        ],
    )


@router.post("/suggest", response_model=SuggestionTarget)
def suggest_edit(
    target: SuggestionTarget, user: current_user_dependency
) -> SuggestionTarget:
    """Mocked "Ask AI": a hardcoded, obviously-canned transformation — no
    real AI yet (see #10). Never applied by this endpoint; the frontend
    always requires an explicit Accept before it reaches the reducer."""
    return suggest(target)


@router.post("/export")
def export_profile_docx(
    profile: Profile, user: current_user_dependency
) -> StreamingResponse:
    """Stateless: renders whatever Profile the frontend sends, since no real
    persistence exists yet to look one up by id (see #11)."""
    document = build_resume_document(profile)

    buffer = io.BytesIO()
    document.save(buffer)
    buffer.seek(0)

    filename = _build_export_filename(profile)

    return StreamingResponse(
        buffer,
        media_type=(
            "application/vnd.openxmlformats-officedocument" ".wordprocessingml.document"
        ),
        headers={"Content-Disposition": _content_disposition(filename)},
    )
