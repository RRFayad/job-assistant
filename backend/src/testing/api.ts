import type { AddressInfo } from "node:net";

import { subscriptions, users } from "@app/shared/db/schema";
import type { SubscriptionPlan } from "@app/shared/types";
import axios from "axios";
import type { FastifyInstance } from "fastify";

import { createApp } from "../create-app";
import { db } from "../db";

// Starts the real API (or `app`, a test-only app) on a free port. Tests call
// it over HTTP with axios, so headers and bodies behave like production.
export const startApi = async (testApp?: FastifyInstance) => {
  const app = testApp ?? (await createApp({ logger: false }));

  await app.listen({ port: 0, host: "127.0.0.1" });

  const { port } = app.server.address() as AddressInfo;
  const baseURL = `http://127.0.0.1:${port}`;

  // A client signed in as `clerkId` (or signed out). Every status resolves,
  // so tests assert on it directly.
  const as = (clerkId?: string) =>
    axios.create({
      baseURL,
      headers: clerkId ? { "x-test-user": clerkId } : {},
      validateStatus: () => true,
    });

  return { as, close: () => app.close() };
};

// The users row the Clerk webhook would have created on sign-up.
export const createUser = async (clerkId: string) => {
  const [user] = await db
    .insert(users)
    .values({ clerkId, email: `${clerkId}@example.com` })
    .returning();

  return user;
};

// The subscriptions row the Stripe webhook would have created on checkout.
export const createSubscription = async (
  userId: number,
  plan: SubscriptionPlan,
  status = "active",
) => {
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      userId,
      plan,
      status,
      stripeEventId: `evt_${userId}`,
      stripeEventCreatedAt: new Date(),
      stripeSubscriptionId: `sub_${userId}`,
      stripePriceId: `price_${plan}`,
      recurringInterval: "month",
    })
    .returning();

  return subscription;
};
