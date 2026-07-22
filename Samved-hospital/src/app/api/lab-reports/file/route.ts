import { NextRequest, NextResponse } from "next/server";
import { hasHospitalAccess, hasPermission } from "@/lib/rbac";
import { getAuthenticatedStaffProfile, getSessionUserId } from "@/lib/server-auth";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { user, error } = await getAuthenticatedStaffProfile(userId);

  if (!user || error) {
    return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(user.role, "lab-reports.view")) {
    return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
  }

  const body = (await request.json()) as {
    reportId?: string;
    action?: "view" | "download";
  };

  if (!body.reportId) {
    return NextResponse.json({ success: false, error: "Report ID is required" }, { status: 400 });
  }

  const { data: report, error: reportError } = await supabaseServer
    .from("diagnostic_reports")
    .select("report_id, hospital_id, report_file_url")
    .eq("report_id", body.reportId)
    .single();

  if (reportError || !report) {
    return NextResponse.json({ success: false, error: "Lab report not found" }, { status: 404 });
  }

  if (!hasHospitalAccess(user.hospital_id, report.hospital_id)) {
    return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
  }

  if (!report.report_file_url) {
    return NextResponse.json({ success: false, error: "No report file available" }, { status: 404 });
  }

  const action = body.action === "download" ? "download" : "view";
  const fileName = report.report_file_url.split("/").pop() || "lab-report";

  const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
    .from("lab_reports")
    .createSignedUrl(report.report_file_url, 60, {
      download: action === "download" ? fileName : false,
    });

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.json(
      { success: false, error: signedUrlError?.message || "Failed to access report file" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    url: signedUrlData.signedUrl,
    fileName,
  });
}
