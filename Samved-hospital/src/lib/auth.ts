export const USER_SESSION_KEY = "user_session";
export const AUTH_COOKIE_NAME = "smc_health_session";

export interface UserProfile {
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  hospital_id: string | null;
  hospital_name: string | null;
  staff_uuid: string | null;
  staff_id: string | null;
  designation: string | null;
  department: string | null;
  phone: string | null;
  address: string | null;
  joined_at: string | null;
}

export interface SessionPayload {
  user_id: string;
  role: string;
}

export interface AuthenticatedUser extends UserProfile {
  access_role: string;
}

export function encodeSession(payload: SessionPayload) {
  return encodeURIComponent(JSON.stringify(payload));
}

export function decodeSession(value: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as SessionPayload;

    if (!parsed?.user_id || !parsed?.role) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
