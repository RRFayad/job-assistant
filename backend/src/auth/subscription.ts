import {
  SUBSCRIPTION_PLAN_LEVELS,
  ACTIVE_SUBSCRIPTION_STATUSES,
} from "@app/shared/constants";
import { subscriptions } from "@app/shared/db/schema";
import type { SubscriptionPlan } from "@app/shared/types";
import { eq } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";

import { db } from "../db";

// Returns a preHandler hook that requires an active subscription of at
// least requiredPlan and exposes it as request.subscription. Runs after
// authenticate, which sets request.user.
export const requireSubscriptionPlan =
  (requiredPlan: SubscriptionPlan) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, request.user.id),
    });

    if (
      !subscription ||
      !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)
    ) {
      return reply
        .code(403)
        .send({ detail: "An active subscription is required" });
    }

    if (
      SUBSCRIPTION_PLAN_LEVELS[subscription.plan] <
      SUBSCRIPTION_PLAN_LEVELS[requiredPlan]
    ) {
      return reply
        .code(403)
        .send({ detail: `The ${requiredPlan} plan is required` });
    }

    request.subscription = subscription;
  };
