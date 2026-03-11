import { ok } from "@/utils/api";
import { waitlistPublicStats } from "@/services/waitlist/waitlist.service";

export async function GET() {
  const stats = await waitlistPublicStats();
  return ok({ stats });
}
