import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  profileSchema,
  type Profile,
  type SuggestionTarget,
} from "@app/shared/schemas";
import { getEnvVar } from "@app/shared/utils";
import type { MultipartFile } from "@fastify/multipart";
import type { FastifyReply } from "fastify";

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
  reply: FastifyReply,
): Promise<Profile | undefined> => {
  // Mocked extraction: ignores the uploaded file's actual content and
  // returns canned data for the Candidate to review — no real parsing or
  // AI yet (see #9).
  await file.toBuffer(); // Drains the stream; content is intentionally unused.

  if (file.file.truncated) {
    reply.code(413).send({ detail: "File is too large (max 10MB)" });
    return undefined;
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

// ---------- Export (proxied to the docx-service sidecar) ----------

export const exportProfileDocxHandler = async (
  profile: Profile,
  reply: FastifyReply,
): Promise<void> => {
  const docxServiceUrl = getEnvVar("DOCX_SERVICE_URL");
  const internalApiKey = getEnvVar("INTERNAL_API_KEY");

  const response = await fetch(`${docxServiceUrl}/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Api-Key": internalApiKey,
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    reply.code(502).send({ detail: "Failed to export Profile" });
    return;
  }

  // Buffered, not streamed: a generated .docx is at most a few hundred KB,
  // and fetch()'s response.body is a WHATWG ReadableStream, which
  // reply.send() silently turns into a 0-byte body instead of erroring —
  // buffering sidesteps that Node/Fastify stream-interop gap entirely.
  const body = Buffer.from(await response.arrayBuffer());

  reply
    .code(200)
    .header(
      "content-type",
      response.headers.get("content-type") ?? "application/octet-stream",
    )
    .header(
      "content-disposition",
      response.headers.get("content-disposition") ?? "attachment",
    )
    .send(body);
};
