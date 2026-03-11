export type AppRole =
  | "senior"
  | "caregiver"
  | "guardian"
  | "agency_staff"
  | "agency_admin"
  | "platform_admin"
  | "waitlist_only";

export type CheckinStatus =
  | "scheduled"
  | "pending"
  | "in_progress"
  | "responded"
  | "missed"
  | "cancelled";

export type CheckinChannel = "sms" | "voice" | "app";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AuthContext {
  profileId: string;
  role: AppRole;
  email: string;
}
