import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = String(body.status || "approved").toLowerCase(); // 'approved' | 'rejected'
    const rejectionReason = body.rejection_reason || body.reason || null;
    const reviewedBy = body.reviewed_by || "SMC Health Officer";

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value. Must be 'approved', 'rejected', or 'pending'." },
        { status: 400 }
      );
    }

    // 1. Update provider status if column exists
    const updatePayload: any = { status };
    const { error: provErr } = await supabaseAdmin
      .from("provider")
      .update(updatePayload)
      .eq("provider_id", id);

    if (provErr && !provErr.message?.includes("status")) {
      console.warn("Provider update status warning:", provErr.message);
    }

    // 2. Update all associated pharmacy_documents or lab_documents verification_status
    const docUpdatePayload: any = {
      verification_status: status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    };

    if (rejectionReason && status === "rejected") {
      docUpdatePayload.rejection_reason = rejectionReason;
    }

    const { error: pDocErr } = await supabaseAdmin
      .from("pharmacy_documents")
      .update(docUpdatePayload)
      .eq("provider_id", id);

    if (pDocErr) {
      console.warn("pharmacy_documents status update warning:", pDocErr.message);
    }

    const { error: lDocErr } = await supabaseAdmin
      .from("lab_documents")
      .update(docUpdatePayload)
      .eq("provider_id", id);

    if (lDocErr) {
      console.warn("lab_documents status update warning:", lDocErr.message);
    }

    return NextResponse.json({
      success: true,
      provider_id: id,
      status,
      message: `Provider application ${status} successfully.`,
    });
  } catch (error: any) {
    console.error("Provider status update error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update provider status" },
      { status: 500 }
    );
  }
}
