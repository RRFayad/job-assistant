from typing import Annotated, Literal, Union

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from starlette import status

from auth.auth import current_user_dependency

router = APIRouter(prefix="/profile", tags=["profile"])


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ProfileLink(CamelModel):
    id: str
    label: str
    url: str


class ProfileHeader(CamelModel):
    full_name: str
    career_title: str
    email: str
    phone: str
    location: str
    links: list[ProfileLink]
    primary_color: str
    secondary_color: str


class TextSection(CamelModel):
    id: str
    type: Literal["text"]
    title: str
    body: str


class TagCategory(CamelModel):
    id: str
    label: str
    items: list[str]


class TagsSection(CamelModel):
    id: str
    type: Literal["tags"]
    title: str
    categories: list[TagCategory]


class Entry(CamelModel):
    id: str
    heading: str
    dates: str
    body: str


class EntriesSection(CamelModel):
    id: str
    type: Literal["entries"]
    title: str
    entries: list[Entry]


class ListSection(CamelModel):
    id: str
    type: Literal["list"]
    title: str
    items: list[str]


class Pair(CamelModel):
    id: str
    left: str
    right: str


class PairsSection(CamelModel):
    id: str
    type: Literal["pairs"]
    title: str
    pairs: list[Pair]


ProfileSection = Annotated[
    Union[TextSection, TagsSection, EntriesSection, ListSection, PairsSection],
    Field(discriminator="type"),
]


class Profile(CamelModel):
    id: str
    name: str
    header: ProfileHeader
    sections: list[ProfileSection]


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
