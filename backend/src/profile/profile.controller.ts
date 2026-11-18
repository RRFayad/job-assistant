import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  profileSchema,
  type Profile,
  type SuggestionTarget,
} from "@app/shared/schemas";
import type { MultipartFile } from "@fastify/multipart";
import type { FastifyReply } from "fastify";

import { HttpError } from "../errors";
import {
  buildExportFilename,
  buildResumeDocument,
  contentDisposition,
} from "./docx-export/docx-export";
import { suggest } from "./suggestions";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// Optional, gitignored, developer-local seed data — e.g. a real resume for
// visually comparing the real implementation against a prototype. Falls
// back to an empty list (no fake placeholder data ships in the repo) when
// absent, which also exercises the zero-Profile onboarding flow on a fresh
// clone. Relative to process.cwd() (backend/, per the dev/build scripts),
// not import.meta.url — the latter doesn't resolve to a real file: URL
// under every bundler/test-runner transform.
const DEV_SEED_PATH = join(process.cwd(), "dev_seed_profiles.json");

const loadSeedProfiles = (): Profile[] => {
  if (!existsSync(DEV_SEED_PATH)) {
    return [];
  }

  const raw: unknown = JSON.parse(readFileSync(DEV_SEED_PATH, "utf-8"));
  return profileSchema.array().parse(raw);
};

export const SEED_PROFILES: Profile[] = loadSeedProfiles();

export const getProfilesHandler = async (): Promise<Profile[]> => {
  return SEED_PROFILES;
};

export const saveProfileHandler = async (
  _profile: Profile,
  reply: FastifyReply,
): Promise<void> => {
  // Accepts and discards the payload — no persistence yet (see #4).
  return reply.code(204).send();
};

export const suggestEditHandler = async (
  target: SuggestionTarget,
): Promise<SuggestionTarget> => {
  return suggest(target);
};

export const extractProfileHandler = async (
  file: MultipartFile,
): Promise<Profile> => {
  // Mocked extraction: ignores the uploaded file's actual content and
  // returns canned data for the Candidate to review — no real parsing or
  // AI yet (see #9).
  await file.toBuffer(); // Drains the stream; content is intentionally unused.

  if (file.file.truncated) {
    throw new HttpError(413, "File is too large (max 10MB)");
  }

  return {
    id: crypto.randomUUID(),
    name: "Uploaded Resume",
    header: {
      fullName: "Alex Rivera",
      careerTitle: "Product Manager",
      email: "alex.rivera@example.com",
      phone: "+1 555-0199",
      location: "New York, NY",
      links: [
        {
          id: crypto.randomUUID(),
          label: "LinkedIn",
          url: "https://linkedin.com",
        },
      ],
      primaryColor: "#059669",
      secondaryColor: "#d97706",
    },
    sections: [
      {
        id: crypto.randomUUID(),
        type: "text",
        title: "Summary",
        body: "Product Manager with **6 years** of experience leading cross-functional teams from discovery to launch.",
      },
      {
        id: crypto.randomUUID(),
        type: "entries",
        title: "Experience",
        entries: [
          {
            id: crypto.randomUUID(),
            heading: "Senior Product Manager, Globex Inc",
            dates: "2021 - Present",
            body: "Owned the roadmap for a B2B SaaS platform.",
          },
        ],
      },
    ],
  };
};

// ---------- Export (.docx, generated locally — see ./docx-export) ----------

export const exportProfileDocxHandler = async (
  profile: Profile,
  reply: FastifyReply,
): Promise<void> => {
  const body = await buildResumeDocument(profile);
  const filename = buildExportFilename(profile);

  reply
    .code(200)
    .header(
      "content-type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    .header("content-disposition", contentDisposition(filename))
    .send(body);
};
