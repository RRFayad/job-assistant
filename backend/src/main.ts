import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { getEnvVar } from "@app/shared/utils";
import { authenticate } from "./auth/authenticate";
import { requireSubscriptionPlan } from "./auth/subscription";
import { healthcheckRoutes } from "./healthcheck/healthcheck.route";
import { profileRoutes } from "./profile/profile.route";
import { clerkPlugin } from "@clerk/fastify";
import { SubscriptionPlan } from "@app/shared/types";
import type { Subscription, User } from "@app/shared/db/schema";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

declare module "fastify" {
  interface FastifyRequest {
    user: User; // Set by authenticate on protected routes.
    subscription: Subscription; // Set by requireSubscriptionPlan.
  }
}

const app = Fastify({ logger: true });

app.register(fastifyCors, { origin: getEnvVar("FRONTEND_URL") });
app.register(fastifyMultipart);
app.register(clerkPlugin);

app.decorateRequest("user");
app.decorateRequest("subscription");

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Job Assistant API",
      version: process.env["npm_package_version"] ?? "dev",
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  transform: jsonSchemaTransform,
});
app.register(fastifySwaggerUi, { routePrefix: "/docs" });

// ---------- Public routes ----------
app.register(async (publicApp) => {
  publicApp.register(healthcheckRoutes);
});

// ---------- Protected, subscription-gated routes ----------
app.register(async (protectedApp) => {
  protectedApp.addHook("preHandler", authenticate);

  protectedApp.register(async (subscribedApp) => {
    subscribedApp.addHook(
      "preHandler",
      requireSubscriptionPlan(SubscriptionPlan.Basic),
    );
    subscribedApp.register(profileRoutes);
  });
});

const main = async () => {
  const port = Number(getEnvVar("PORT", false) ?? 8000);
  const host = getEnvVar("HOST", false) ?? "localhost";

  try {
    await app.listen({ port, host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

main();
