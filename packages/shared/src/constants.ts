import { SubscriptionPlan } from "./types";

// ---------- Subscription ----------

// Access level per plan: a plan grants access to everything at or below its level.
export const SUBSCRIPTION_PLAN_LEVELS: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.Basic]: 1,
  [SubscriptionPlan.Premium]: 2,
  [SubscriptionPlan.AllIn]: 3,
};

// Stripe subscription statuses that grant access.
export const ACTIVE_SUBSCRIPTION_STATUSES: readonly string[] = [
  "active",
  "trialing",
];
