export const AUTH_SESSION_KEY = "smc-health-session";
export const AUTH_COOKIE_NAME = "smc_health_session";

export interface StaffProfile {
  user_id: string;
  auth_role: string;
  name: string | null;
  designation: string | null;
  department: string | null;
  hospital_id: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
}

export interface SessionPayload {
  user_id: string;
  role: string;
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
