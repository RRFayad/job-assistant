import { z } from "zod";

// API contract shared by the backend and the frontend. The backend attaches
// these schemas to routes (request/response validation and Swagger docs);
// the frontend uses the inferred types for the data it sends and receives.
// None of this maps to a DB table — Profile isn't persisted yet (see #4).

// ---------- Errors ----------

// Body of every error the API sends (401, 403, 404, 413).
export const errorResponseSchema = z.object({
  detail: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// ---------- System ----------

export const healthcheckResponseSchema = z.object({
  status: z.string(),
});

export type HealthcheckResponse = z.infer<typeof healthcheckResponseSchema>;

// ---------- Profile ----------

export const profileLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
});

export type ProfileLink = z.infer<typeof profileLinkSchema>;

export const profileHeaderSchema = z.object({
  fullName: z.string(),
  careerTitle: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  links: z.array(profileLinkSchema),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  // A data URL, or null/undefined for the no-picture export layout.
  picture: z.string().nullable().optional(),
});

export type ProfileHeader = z.infer<typeof profileHeaderSchema>;

export const textSectionSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  title: z.string(),
  body: z.string(),
});

export type TextSection = z.infer<typeof textSectionSchema>;

export const tagCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  items: z.array(z.string()),
});

export type TagCategory = z.infer<typeof tagCategorySchema>;

export const tagsSectionSchema = z.object({
  id: z.string(),
  type: z.literal("tags"),
  title: z.string(),
  categories: z.array(tagCategorySchema),
});

export type TagsSection = z.infer<typeof tagsSectionSchema>;

export const entrySchema = z.object({
  id: z.string(),
  heading: z.string(),
  dates: z.string(),
  body: z.string(),
});

export type Entry = z.infer<typeof entrySchema>;

export const entriesSectionSchema = z.object({
  id: z.string(),
  type: z.literal("entries"),
  title: z.string(),
  entries: z.array(entrySchema),
});

export type EntriesSection = z.infer<typeof entriesSectionSchema>;

export const listSectionSchema = z.object({
  id: z.string(),
  type: z.literal("list"),
  title: z.string(),
  items: z.array(z.string()),
});

export type ListSection = z.infer<typeof listSectionSchema>;

export const pairSchema = z.object({
  id: z.string(),
  left: z.string(),
  right: z.string(),
});

export type Pair = z.infer<typeof pairSchema>;

export const pairsSectionSchema = z.object({
  id: z.string(),
  type: z.literal("pairs"),
  title: z.string(),
  pairs: z.array(pairSchema),
});

export type PairsSection = z.infer<typeof pairsSectionSchema>;

export const profileSectionSchema = z.discriminatedUnion("type", [
  textSectionSchema,
  tagsSectionSchema,
  entriesSectionSchema,
  listSectionSchema,
  pairsSectionSchema,
]);

export type ProfileSection = z.infer<typeof profileSectionSchema>;

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  header: profileHeaderSchema,
  sections: z.array(profileSectionSchema),
});

export type Profile = z.infer<typeof profileSchema>;

export const suggestHeaderTargetSchema = z.object({
  kind: z.literal("header"),
  header: profileHeaderSchema,
});

export type SuggestHeaderTarget = z.infer<typeof suggestHeaderTargetSchema>;

export const suggestSectionTargetSchema = z.object({
  kind: z.literal("section"),
  section: profileSectionSchema,
});

export type SuggestSectionTarget = z.infer<typeof suggestSectionTargetSchema>;

export const suggestionTargetSchema = z.discriminatedUnion("kind", [
  suggestHeaderTargetSchema,
  suggestSectionTargetSchema,
]);

export type SuggestionTarget = z.infer<typeof suggestionTargetSchema>;
