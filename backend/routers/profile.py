import io
import re
import uuid
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
    TextSection,
)
from services.docx_export import build_resume_document

router = APIRouter(prefix="/profile", tags=["profile"])

_MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB

_UNSAFE_FILENAME_CHARS = re.compile(r'[\\/:*?"<>|]')


def _build_export_filename(profile: Profile) -> str:
    base = profile.header.full_name.strip() or profile.name.strip() or "resume"
    base = _UNSAFE_FILENAME_CHARS.sub("", base)
    base = "_".join(base.split()) or "resume"
    return f"{base}.docx"


def _content_disposition(filename: str) -> str:
    # A non-Latin-1 filename crashes ASGI's header encoding outright, so the
    # plain `filename=` parameter always gets an ASCII-safe fallback; the
    # RFC 6266 `filename*=` parameter carries the real name for the (near-
    # universal) clients that support it.
    ascii_filename = filename.encode("ascii", "replace").decode("ascii")
    return (
        f'attachment; filename="{ascii_filename}"; '
        f"filename*=UTF-8''{quote(filename)}"
    )


SEED_PROFILES: list[Profile] = [
    Profile(
        id="1",
        name="AI Engineer",
        header=ProfileHeader(
            full_name="Jane Doe",
            career_title="AI Engineer",
            email="jane.doe@example.com",
            phone="+1 555-0100",
            location="Remote",
            links=[
                ProfileLink(id="1", label="LinkedIn", url="https://linkedin.com"),
                ProfileLink(id="2", label="GitHub", url="https://github.com"),
            ],
            primary_color="#2563eb",
            secondary_color="#7c3aed",
        ),
        sections=[
            TextSection(
                id="1",
                type="text",
                title="Summary",
                body="AI Engineer with a background in building production ML systems.",
            ),
            EntriesSection(
                id="2",
                type="entries",
                title="Experience",
                entries=[
                    Entry(
                        id="1",
                        heading="Senior AI Engineer, Acme Corp",
                        dates="2023 - Present",
                        body="Built and shipped applied ML features.",
                    ),
                ],
            ),
        ],
    ),
]


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
