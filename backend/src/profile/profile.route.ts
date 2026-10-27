import {
  errorResponseSchema,
  profileSchema,
  suggestionTargetSchema,
} from "@app/shared/schemas";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import {
  MAX_UPLOAD_BYTES,
  extractProfileHandler,
  exportProfileDocxHandler,
  getProfilesHandler,
  saveProfileHandler,
  suggestEditHandler,
} from "./profile.controller";

export const profileRoutes = async (app: FastifyInstance) => {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/profile/",
    {
      schema: {
        tags: ["profile"],
        summary: "List the Candidate's Profiles",
        security: [{ bearerAuth: [] }],
        response: {
          200: z.array(profileSchema),
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    getProfilesHandler,
  );

  typedApp.put(
    "/profile/:profileId",
    {
      schema: {
        tags: ["profile"],
        summary: "Save a Profile",
        security: [{ bearerAuth: [] }],
        params: z.object({ profileId: z.string() }),
        body: profileSchema,
        response: {
          204: z.void(),
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request, reply) => saveProfileHandler(request.body, reply),
  );

  typedApp.post(
    "/profile/suggest",
    {
      schema: {
        tags: ["profile"],
        summary: 'Mocked "Ask AI" suggestion',
        security: [{ bearerAuth: [] }],
        body: suggestionTargetSchema,
        response: {
          200: suggestionTargetSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request) => suggestEditHandler(request.body),
  );

  typedApp.post(
    "/profile/extract",
    {
      schema: {
        tags: ["profile"],
        summary: "Mocked resume extraction",
        security: [{ bearerAuth: [] }],
        response: {
          200: profileSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          413: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const file = await request.file({
        limits: { fileSize: MAX_UPLOAD_BYTES },
      });

      if (!file) {
        return reply.code(400).send({ detail: "No file uploaded" });
      }

      return extractProfileHandler(file, reply);
    },
  );

  typedApp.post(
    "/profile/export",
    {
      schema: {
        tags: ["profile"],
        summary: "Export a Profile as a .docx file",
        security: [{ bearerAuth: [] }],
        body: profileSchema,
        response: {
          401: errorResponseSchema,
          403: errorResponseSchema,
          502: errorResponseSchema,
        },
      },
    },
    async (request, reply) => exportProfileDocxHandler(request.body, reply),
  );
};
