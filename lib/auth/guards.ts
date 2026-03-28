import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/clients";
import type { AppRole, AuthContext } from "@/types/domain";

export async function requireAuth(allowedRoles?: AppRole[]): Promise<AuthContext | NextResponse> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in required." } }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ ok: false, error: { code: "PROFILE_MISSING", message: "Profile not found." } }, { status: 403 });
  }

  const role = profile.role as AppRole;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "Insufficient role." } }, { status: 403 });
  }

  return { profileId: profile.id, role, email: profile.email as string };
}

export function requireCronToken(request: Request): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Missing cron authorization." } }, { status: 401 });
  }

  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader !== expected) {
    return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Invalid cron authorization." } }, { status: 401 });
  }

  return null;
}
