import type { MultipartFile } from "@fastify/multipart";
import type { FastifyReply } from "fastify";
import { describe, expect, it, vi } from "vitest";

import {
  extractProfileHandler,
  getProfilesHandler,
  saveProfileHandler,
} from "./profile.controller";

const fakeReply = (): FastifyReply => {
  const reply = {
    code: vi.fn(() => reply),
    send: vi.fn(() => reply),
  };
  return reply as unknown as FastifyReply;
};

const fakeMultipartFile = (truncated: boolean): MultipartFile =>
  ({
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("fake pdf bytes")),
    file: { truncated },
  }) as unknown as MultipartFile;

describe("getProfilesHandler", () => {
  it("returns an empty list when no dev seed file is present", async () => {
    // No backend/dev_seed_profiles.json in this (or any CI) environment.
    await expect(getProfilesHandler()).resolves.toEqual([]);
  });
});

describe("saveProfileHandler", () => {
  it("accepts and discards the payload, replying 204", async () => {
    const reply = fakeReply();

    await saveProfileHandler(
      {
        id: "1",
        name: "p",
        header: {
          fullName: "",
          careerTitle: "",
          email: "",
          phone: "",
          location: "",
          links: [],
          primaryColor: "#000",
          secondaryColor: "#000",
        },
        sections: [],
      },
      reply,
    );

    expect(reply.code).toHaveBeenCalledWith(204);
  });
});

describe("extractProfileHandler", () => {
  it("returns a populated Profile for a file under the size limit", async () => {
    const reply = fakeReply();

    const profile = await extractProfileHandler(
      fakeMultipartFile(false),
      reply,
    );

    expect(profile?.header.fullName).toBeTruthy();
    expect(profile?.sections.length).toBeGreaterThan(0);
    expect(reply.code).not.toHaveBeenCalled();
  });

  it("replies 413 for a file over the size limit", async () => {
    const reply = fakeReply();

    const profile = await extractProfileHandler(fakeMultipartFile(true), reply);

    expect(profile).toBeUndefined();
    expect(reply.code).toHaveBeenCalledWith(413);
  });
});
