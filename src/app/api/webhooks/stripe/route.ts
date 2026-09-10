import Stripe from "stripe";

import { NextRequest, NextResponse } from "next/server";
import { getEnvVar } from "@/lib/utils";
import { handleSubscriptionUpsert } from "@/lib/stripe/webhook-handlers";

const WEBHOOK_SECRET = getEnvVar("STRIPE_WEBHOOK_SECRET");

export async function POST(req: NextRequest) {
  const payload = await req.text();

  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed." },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
    case "customer.subscription.deleted":
      await handleSubscriptionUpsert(event);
      break;

    default:
      console.warn(`Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
