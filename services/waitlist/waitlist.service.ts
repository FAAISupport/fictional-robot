import { createSupabaseAdminClient } from "@/lib/supabase/clients";

function createReferralCode(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "member";
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`;
}

async function uniqueReferralCode(name: string) {
  const supabase = createSupabaseAdminClient();
  for (let i = 0; i < 10; i += 1) {
    const code = createReferralCode(name);
    const { data } = await supabase
      .from("waitlist_users")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();

    if (!data) return code;
  }

  return `${Date.now().toString(36)}${Math.floor(Math.random() * 9999)}`;
}

function deriveBetaEligibility(referralCount: number) {
  if (referralCount >= 25) return "founder_reward";
  if (referralCount >= 10) return "guaranteed_beta";
  if (referralCount >= 3) return "early_beta";
  return "standard";
}

export async function joinWaitlist(input: {
  name: string;
  email: string;
  phone?: string;
  relationshipType: string;
  city?: string;
  state?: string;
  referralCode?: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("waitlist_users")
    .select("id, email, referral_code, joined_at, referral_count, spots_gained, beta_eligibility")
    .eq("email", input.email)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const ownCode = await uniqueReferralCode(input.name);
  let referredBy: string | null = null;

  if (input.referralCode) {
    const { data: referrer } = await supabase
      .from("waitlist_users")
      .select("id")
      .eq("referral_code", input.referralCode)
      .maybeSingle();
    referredBy = referrer?.id ?? null;
  }

  const { data: user, error } = await supabase
    .from("waitlist_users")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      relationship_type: input.relationshipType,
      city: input.city ?? null,
      state: input.state ?? null,
      referral_code: ownCode,
      referred_by_waitlist_user_id: referredBy
    })
    .select("id, email, referral_code, joined_at, referral_count, spots_gained, beta_eligibility")
    .single();

  if (error || !user) {
    throw new Error(`waitlist_join_failed:${error?.message}`);
  }

  if (referredBy && input.referralCode) {
    await supabase.from("referrals").insert({
      referrer_waitlist_user_id: referredBy,
      referred_waitlist_user_id: user.id,
      referral_code: input.referralCode,
      status: "qualified"
    });

    const { data: referrer } = await supabase
      .from("waitlist_users")
      .select("id, referral_count")
      .eq("id", referredBy)
      .single();

    if (referrer) {
      const newCount = (referrer.referral_count ?? 0) + 1;
      const spotsGained = newCount * 5;
      await supabase
        .from("waitlist_users")
        .update({
          referral_count: newCount,
          spots_gained: spotsGained,
          beta_eligibility: deriveBetaEligibility(newCount)
        })
        .eq("id", referredBy);
    }
  }

  return user;
}

export async function waitlistDashboard(email: string) {
  const supabase = createSupabaseAdminClient();
  const { data: user } = await supabase
    .from("waitlist_users")
    .select("id, name, email, city, state, referral_code, referral_count, spots_gained, beta_eligibility, joined_at")
    .eq("email", email)
    .single();

  if (!user) return null;

  const { count: aheadCount } = await supabase
    .from("waitlist_users")
    .select("id", { count: "exact", head: true })
    .lt("joined_at", user.joined_at);

  const { data: allRanks } = await supabase
    .from("leaderboard_snapshots")
    .select("rank")
    .eq("snapshot_type", "all_time")
    .eq("waitlist_user_id", user.id)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: inviteHistory } = await supabase
    .from("referrals")
    .select("created_at, referred_waitlist_user_id")
    .eq("referrer_waitlist_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL}/waitlist?ref=${user.referral_code}`;

  return {
    ...user,
    waitlistPosition: Math.max(1, (aheadCount ?? 0) + 1 - (user.spots_gained ?? 0)),
    leaderboardRank: allRanks?.rank ?? null,
    referralUrl,
    inviteHistory: inviteHistory ?? [],
    nextMilestone:
      user.referral_count < 1
        ? "1 referral = move up 5 spots"
        : user.referral_count < 3
          ? "3 referrals = early beta"
          : user.referral_count < 5
            ? "5 referrals = free month"
            : user.referral_count < 10
              ? "10 referrals = guaranteed beta"
              : "25 referrals = founder reward"
  };
}

export async function waitlistPublicStats() {
  const supabase = createSupabaseAdminClient();
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: total }, { count: joinedWeek }, { count: referralsWeek }] = await Promise.all([
    supabase.from("waitlist_users").select("id", { count: "exact", head: true }),
    supabase.from("waitlist_users").select("id", { count: "exact", head: true }).gte("joined_at", weekStart),
    supabase.from("referrals").select("id", { count: "exact", head: true }).gte("created_at", weekStart)
  ]);

  return {
    totalPeople: total ?? 0,
    joinedThisWeek: joinedWeek ?? 0,
    referralsThisWeek: referralsWeek ?? 0
  };
}

export async function waitlistPublicLeaderboard(type: "all_time" | "weekly" | "geo", region?: string) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("leaderboard_snapshots")
    .select("waitlist_user_id, rank, referral_count, score, snapshot_date, region_key")
    .eq("snapshot_type", type)
    .order("snapshot_date", { ascending: false })
    .order("rank", { ascending: true })
    .limit(20);

  if (type === "geo" && region) {
    query = query.eq("region_key", region);
  }

  const { data: rows } = await query;
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.waitlist_user_id);
  const { data: users } = await supabase.from("waitlist_users").select("id,name,city,state").in("id", ids);

  const map = new Map((users ?? []).map((u) => [u.id, u]));

  return rows.map((r) => {
    const u = map.get(r.waitlist_user_id);
    const maskedName = u?.name ? `${u.name.split(" ")[0]} ${u.name.split(" ")[1]?.[0] ?? ""}.` : "Member";
    return {
      rank: r.rank,
      referralCount: r.referral_count,
      score: r.score,
      snapshotDate: r.snapshot_date,
      region: r.region_key,
      displayName: maskedName,
      city: u?.city ?? null,
      state: u?.state ?? null
    };
  });
}

export async function refreshLeaderboards(snapshotDate: string) {
  const supabase = createSupabaseAdminClient();

  const { data: users } = await supabase
    .from("waitlist_users")
    .select("id, city, state, referral_count, spots_gained, joined_at")
    .order("referral_count", { ascending: false })
    .order("joined_at", { ascending: true })
    .limit(5000);

  if (!users) return { inserted: 0 };

  const rows: Array<Record<string, unknown>> = [];
  users.forEach((u, i) => {
    rows.push({
      snapshot_type: "all_time",
      region_key: null,
      waitlist_user_id: u.id,
      rank: i + 1,
      referral_count: u.referral_count ?? 0,
      score: (u.referral_count ?? 0) * 10 + (u.spots_gained ?? 0),
      snapshot_date: snapshotDate
    });
  });

  const weeklyUsers = [...users].filter(
    (u) => new Date(u.joined_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
  );
  weeklyUsers.forEach((u, i) => {
    rows.push({
      snapshot_type: "weekly",
      region_key: null,
      waitlist_user_id: u.id,
      rank: i + 1,
      referral_count: u.referral_count ?? 0,
      score: (u.referral_count ?? 0) * 10,
      snapshot_date: snapshotDate
    });
  });

  const geoMap = new Map<string, typeof users>();
  for (const u of users) {
    const key = `${u.city ?? "unknown"},${u.state ?? "unknown"}`;
    if (!geoMap.has(key)) geoMap.set(key, []);
    geoMap.get(key)?.push(u);
  }

  for (const [regionKey, group] of geoMap) {
    group
      .sort((a, b) => (b.referral_count ?? 0) - (a.referral_count ?? 0))
      .slice(0, 100)
      .forEach((u, i) => {
        rows.push({
          snapshot_type: "geo",
          region_key: regionKey,
          waitlist_user_id: u.id,
          rank: i + 1,
          referral_count: u.referral_count ?? 0,
          score: (u.referral_count ?? 0) * 10,
          snapshot_date: snapshotDate
        });
      });
  }

  const { error } = await supabase.from("leaderboard_snapshots").upsert(rows, {
    onConflict: "snapshot_type,region_key_normalized,waitlist_user_id,snapshot_date"
  });

  if (error) throw new Error(`leaderboard_refresh_failed:${error.message}`);
  return { inserted: rows.length };
}
