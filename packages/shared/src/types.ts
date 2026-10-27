// Shared domain types that don't belong to a schema file. Types inferred from
// a schema live next to it, in db/schema.ts.

// ---------- Subscription ----------

export enum SubscriptionPlan {
  Basic = "basic",
  Premium = "premium",
  AllIn = "all_in",
}
