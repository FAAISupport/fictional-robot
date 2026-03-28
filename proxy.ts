import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/caregiver", "/senior", "/agency", "/reports", "/billing"];

export function proxy(request: NextRequest) {
  if (protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    const hasAccessToken = request.cookies.has("sb-access-token") || request.cookies.has("sb:token");

    if (!hasAccessToken) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/caregiver/:path*", "/senior/:path*", "/agency/:path*", "/reports/:path*", "/billing/:path*"]
};
