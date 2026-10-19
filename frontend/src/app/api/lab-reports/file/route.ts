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

  const userRole = (user.role || "").toLowerCase().trim();
  const accessRole = (user.access_role || "").toLowerCase().trim();
  const isAdmin =
    userRole === "admin" ||
    userRole === "hospital_admin" ||
    userRole === "smc_admin" ||
    accessRole === "smc_admin" ||
    accessRole === "admin";
  const isMedicalStaff =
    userRole === "doctor" ||
    userRole === "nurse" ||
    userRole === "lab_staff" ||
    userRole === "technician";
  const canViewReports =
    isAdmin ||
    isMedicalStaff ||
    hasPermission(user.role, "lab-reports.view") ||
    hasPermission(user.role, "patients.view");

  if (!canViewReports) {
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
    .select("report_id, hospital_id, provider_id, report_file_url")
    .eq("report_id", body.reportId)
    .single();

  if (reportError || !report) {
    return NextResponse.json({ success: false, error: "Lab report not found" }, { status: 404 });
  }

  // Access control rules:
  // 1. Administrators have full system-wide access to view/download reports.
  // 2. Clinical staff (doctors/nurses) evaluating patients can review reports across providers.
  // 3. External laboratory reports (hospital_id is null/empty or provider_id is set) are accessible by authorized staff.
  // 4. Other facility-specific staff are restricted to their own hospital records.
  const isExternalLabReport = !report.hospital_id || Boolean(report.provider_id);
  const isSameHospital = Boolean(
    user.hospital_id && report.hospital_id && user.hospital_id === report.hospital_id
  );

  if (!isAdmin && !isMedicalStaff && !isExternalLabReport && !isSameHospital) {
    return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
  }

  if (!report.report_file_url) {
    return NextResponse.json({ success: false, error: "No report file available" }, { status: 404 });
  }

  const action = body.action === "download" ? "download" : "view";
  const fileName = report.report_file_url.split("/").pop() || "lab-report";

  // If already an external HTTP/HTTPS URL, return directly
  if (report.report_file_url.startsWith("http://") || report.report_file_url.startsWith("https://")) {
    return NextResponse.json({
      success: true,
      url: report.report_file_url,
      fileName,
    });
  }

  // Generate signed URL from lab_reports storage bucket
  const { data: signedUrlData, error: signedUrlError } = await supabaseServer.storage
    .from("lab_reports")
    .createSignedUrl(report.report_file_url, 60, {
      download: action === "download" ? fileName : false,
    });

  if (signedUrlError || !signedUrlData?.signedUrl) {
    // Graceful fallback to lab_document bucket if not in lab_reports
    const { data: fbData } = await supabaseServer.storage
      .from("lab_document")
      .createSignedUrl(report.report_file_url, 60, {
        download: action === "download" ? fileName : false,
      });

    if (fbData?.signedUrl) {
      return NextResponse.json({
        success: true,
        url: fbData.signedUrl,
        fileName,
      });
    }

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
