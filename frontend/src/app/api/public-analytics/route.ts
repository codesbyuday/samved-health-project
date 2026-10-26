import { NextResponse } from "next/server";
import { apiClient } from "@/services/apiClient";

export async function GET() {
  try {
    const res = await apiClient.get<any>("/disease-surveillance/public-analytics");

    if (res.data) {
      return NextResponse.json({ success: true, data: res.data });
    }

    return NextResponse.json({ success: false, error: res.error || "Failed to load analytics" }, { status: 500 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load public health analytics.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
