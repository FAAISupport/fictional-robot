export const CHURCH_MODULES = [
  "member_wellness_checkins",
  "prayer_request_intake",
  "volunteer_dispatch",
  "pastoral_follow_up",
  "absence_detection",
  "small_group_tracking",
  "missed_sunday_trigger",
  "devotional_checkins"
] as const;

export type ChurchModule = (typeof CHURCH_MODULES)[number];

export function churchDemoTier(memberCount: number) {
  if (memberCount <= 75) return { tier: "Starter", monthlyPrice: 79 };
  if (memberCount <= 250) return { tier: "Growth", monthlyPrice: 199 };
  return { tier: "Ministry Enterprise", monthlyPrice: 499 };
}

export function toChurchDemoSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 55);
}
