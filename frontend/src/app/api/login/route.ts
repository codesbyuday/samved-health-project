import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, encodeSession } from "@/lib/auth";
import { apiClient } from "@/services/apiClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await apiClient.post<any>("/auth/login", body);

    if (res.error || !res.data || !res.data.success) {
      return NextResponse.json(
        { success: false, error: res.error || res.data?.error || "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = res.data.user;
    const token = res.data.token;

    const response = NextResponse.json({
      success: true,
      token,
      user,
    });

    if (user) {
      response.cookies.set(
        AUTH_COOKIE_NAME,
        encodeSession({ user_id: user.user_id, role: user.access_role }),
        {
          httpOnly: false,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        }
      );
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Authentication error" },
      { status: 500 }
    );
  }
}
