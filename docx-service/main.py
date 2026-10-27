import io
import re
from typing import Annotated
from urllib.parse import quote

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from starlette import status

from schemas.profile import Profile
from services.docx_export import build_resume_document
from utils import get_env_var

app = FastAPI()

_internal_api_key = get_env_var("INTERNAL_API_KEY")

_UNSAFE_FILENAME_CHARS = re.compile(r'[\\/:*?"<>|]')


def _require_internal_api_key(
    x_internal_api_key: Annotated[str | None, Header()] = None,
) -> None:
    """Not a user-facing auth layer — the Fastify backend already verified
    the Clerk session and the subscription plan before ever calling here.
    This just stops the sidecar's one endpoint from being open to anyone who
    finds its URL, since it has no auth of its own."""
    if x_internal_api_key != _internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal API key",
        )


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


@app.get("/healthy")
def health_check():
    return {"status": "Healthy"}


@app.post("/export", dependencies=[Depends(_require_internal_api_key)])
def export_profile_docx(profile: Profile) -> StreamingResponse:
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
