import { processStripeWebhook } from "@/services/billing/billing.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  try {
    const result = await processStripeWebhook(signature, body);
    return ok(result);
  } catch (error) {
    return fail("STRIPE_WEBHOOK_ERROR", "Stripe webhook processing failed", 400, String(error));
  }
}
