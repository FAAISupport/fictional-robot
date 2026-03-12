import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/domain";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, { status });
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiResponse<never>>(
    { ok: false, error: { code, message, details } },
    { status }
  );
}
