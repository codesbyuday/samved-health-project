import { USER_SESSION_KEY } from "@/lib/auth";

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  return "http://localhost:8000";
};

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const baseUrl = getBaseUrl();
    const url = endpoint.startsWith("/")
      ? `${baseUrl}/api/v1${endpoint}`
      : `${baseUrl}/api/v1/${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Attach Bearer token if available in local storage session or cookie
    if (typeof window !== "undefined") {
      const storedUser = window.localStorage.getItem(USER_SESSION_KEY);
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.token) {
            headers["Authorization"] = `Bearer ${parsed.token}`;
          }
        } catch {
          // ignore
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          if (typeof errorData.detail === "string") {
            errorMessage = errorData.detail;
          } else if (errorData.detail?.error?.message) {
            errorMessage = errorData.detail.error.message;
          }
        } else if (errorData?.error) {
          errorMessage = typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error);
        }
      } catch {
        // use default HTTP error
      }
      return { data: null, error: errorMessage };
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      console.error(`apiFetch Error [${endpoint}]:`, err?.message || err);
    }
    return {
      data: null,
      error: err?.message || "Failed to communicate with backend server",
    };
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, params?: Record<string, string>) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params).toString();
      if (searchParams) {
        url += `?${searchParams}`;
      }
    }
    return apiFetch<T>(url, { method: "GET" });
  },

  post: <T = any>(endpoint: string, body?: any) => {
    return apiFetch<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch: <T = any>(endpoint: string, body?: any) => {
    return apiFetch<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete: <T = any>(endpoint: string) => {
    return apiFetch<T>(endpoint, { method: "DELETE" });
  },
};
