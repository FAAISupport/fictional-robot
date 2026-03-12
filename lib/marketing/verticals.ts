export type VerticalSlug =
  | "seniors"
  | "adult-children"
  | "family-caregivers"
  | "recovery"
  | "home-health"
  | "senior-communities"
  | "hoa-neighborhood"
  | "care-coordinators";

export interface VerticalDefinition {
  slug: VerticalSlug;
  title: string;
  summary: string;
  outcomes: string[];
  dashboardHref: string;
}

export const VERTICALS: VerticalDefinition[] = [
  {
    slug: "seniors",
    title: "Seniors Living Alone",
    summary: "No app required. Check in by text or voice with calm, simple routines.",
    outcomes: ["SMS YES check-ins", "Voice press-1 check-ins", "Quiet hours + vacation mode"],
    dashboardHref: "/senior"
  },
  {
    slug: "adult-children",
    title: "Adult Children Monitoring Parents",
    summary: "Know daily status and escalation outcomes without constant manual follow-up.",
    outcomes: ["Real-time status", "Escalation acknowledgment trail", "7/30 day trend summaries"],
    dashboardHref: "/caregiver"
  },
  {
    slug: "family-caregivers",
    title: "Family & Caregivers",
    summary: "Coordinate guardian networks and response plans across multiple contacts.",
    outcomes: ["Guardian invites", "Priority routing", "Incident timelines"],
    dashboardHref: "/caregiver"
  },
  {
    slug: "recovery",
    title: "Recovery Accountability",
    summary: "Use recurring recovery check-ins with transparent nonresponse escalation.",
    outcomes: ["Recovery check-ins", "Missed event alerts", "Behavior trend indicators"],
    dashboardHref: "/caregiver"
  },
  {
    slug: "home-health",
    title: "Home Health Agencies",
    summary: "Monitor residents at scale with high-concern and elevated-concern queues.",
    outcomes: ["Agency queues", "Staff routing", "Weekly safety reports"],
    dashboardHref: "/agency"
  },
  {
    slug: "senior-communities",
    title: "Senior Communities",
    summary: "Support wellness operations in independent living and assisted programs.",
    outcomes: ["Organization-level visibility", "Escalation workflows", "Compliance-style summaries"],
    dashboardHref: "/agency"
  },
  {
    slug: "hoa-neighborhood",
    title: "HOA & Neighborhood Wellness",
    summary: "Coordinate trusted local responders for community-led safety programs.",
    outcomes: ["Local responder roles", "Consent-based contacts", "Emergency event log"],
    dashboardHref: "/agency"
  },
  {
    slug: "care-coordinators",
    title: "Care Coordinators & Social Workers",
    summary: "Track response consistency with clear rationale and auditable thresholds.",
    outcomes: ["Routine stability views", "Threshold crossing alerts", "Intervention tracking"],
    dashboardHref: "/agency"
  }
];

export function getVerticalBySlug(slug: string) {
  return VERTICALS.find((v) => v.slug === slug);
}
