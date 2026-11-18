import { z } from "zod";

// Schemas shared by every feature: error bodies and system routes.

// ---------- Errors ----------

// Body of every error the API sends (401, 403, 404, 413) — see backend/src/errors.ts.
export const errorResponseSchema = z.object({
  detail: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// ---------- System ----------

export const healthcheckResponseSchema = z.object({
  status: z.string(),
});

export type HealthcheckResponse = z.infer<typeof healthcheckResponseSchema>;
