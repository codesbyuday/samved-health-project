import { NextResponse } from "next/server";
import { fetchPublicLandingData } from "@/components/landing/public-data";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const data = await fetchPublicLandingData(supabaseServer);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load public health analytics.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
