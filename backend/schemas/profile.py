from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


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
