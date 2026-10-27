import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const defaultUrl = 'https://yxknckhlzcjybjbdqnbg.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4a25ja2hsemNqeWJqYmRxbmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTY4MTYsImV4cCI6MjA4ODg5MjgxNn0.MA64InqN_hkdrLHPDP3WCigPkTJFlk-mhKEdNa5MPSk';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultKey;

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );

            response = NextResponse.next({
              request,
            });

            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    await supabase.auth.getUser();
  } catch (error) {
    // Gracefully handle edge runtime or missing environment variable issues
    console.error("SMC middleware session error:", error);
  }

  return response;
}

