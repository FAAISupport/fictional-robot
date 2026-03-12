import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2024-06-20" });

const planPriceMap = {
  family: process.env.STRIPE_PRICE_FAMILY,
  caregiver: process.env.STRIPE_PRICE_CAREGIVER,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE
} as const;

export async function createCheckoutSession(input: {
  profileId: string;
  email: string;
  plan: "family" | "caregiver" | "enterprise";
}) {
  const price = planPriceMap[input.plan];
  if (!price) throw new Error("missing_price_id");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?cancel=1`,
    customer_email: input.email,
    metadata: { profileId: input.profileId, plan: input.plan }
  });

  return { url: session.url };
}

export async function createBillingPortalSession(input: { stripeCustomerId: string }) {
  const session = await stripe.billingPortal.sessions.create({
    customer: input.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`
  });

  return { url: session.url };
}

export async function processStripeWebhook(signature: string | null, rawBody: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) throw new Error("stripe_signature_missing");

  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  const supabase = createSupabaseAdminClient();

  await supabase.from("billing_events").upsert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event,
    processed_at: new Date().toISOString()
  });

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription;
    const profileId = subscription.metadata.profileId;
    const planCode = (subscription.metadata.plan as "family" | "caregiver" | "enterprise") ?? "family";

    if (profileId) {
      await supabase.from("subscriptions").upsert(
        {
          profile_id: profileId,
          stripe_customer_id: String(subscription.customer),
          stripe_subscription_id: subscription.id,
          plan_code: planCode,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        },
        { onConflict: "stripe_subscription_id" }
      );
    }
  }

  return { received: true, eventType: event.type };
}
