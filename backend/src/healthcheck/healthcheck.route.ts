import { healthcheckResponseSchema } from "@app/shared/schemas";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export const healthcheckRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/healthy",
    {
      schema: {
        tags: ["healthcheck"],
        summary: "Liveness check",
        response: { 200: healthcheckResponseSchema },
      },
    },
    async () => ({ status: "Healthy" }),
  );
};
