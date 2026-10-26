import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role"); // 'pharmacy', 'lab', or null for all

    // 1. Fetch providers
    let providerQuery = supabaseAdmin
      .from("provider")
      .select("*")
      .order("created_at", { ascending: false });

    if (roleFilter && roleFilter !== "all") {
      providerQuery = providerQuery.eq("role", roleFilter);
    }

    const { data: providers, error: provErr } = await providerQuery;

    if (provErr) {
      return NextResponse.json({ error: provErr.message }, { status: 500 });
    }

    // 2. Fetch all pharmacy documents and lab documents
    const { data: pharmacyDocs, error: pDocErr } = await supabaseAdmin
      .from("pharmacy_documents")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (pDocErr) {
      console.warn("Could not fetch pharmacy_documents:", pDocErr.message);
    }

    const { data: labDocs, error: lDocErr } = await supabaseAdmin
      .from("lab_documents")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (lDocErr) {
      console.warn("Could not fetch lab_documents (table may need creation):", lDocErr.message);
    }

    // Map documents by provider_id
    const docsByProvider = new Map<string, any[]>();
    (pharmacyDocs || []).forEach((doc) => {
      if (!doc.provider_id) return;
      const existing = docsByProvider.get(doc.provider_id) || [];
      existing.push(doc);
      docsByProvider.set(doc.provider_id, existing);
    });

    (labDocs || []).forEach((doc) => {
      if (!doc.provider_id) return;
      const existing = docsByProvider.get(doc.provider_id) || [];
      existing.push(doc);
      docsByProvider.set(doc.provider_id, existing);
    });

    // 3. Assemble combined payload
    const enrichedProviders = (providers || []).map((p) => {
      const pDocs = docsByProvider.get(p.provider_id) || [];

      // Determine verification status:
      // If provider has an explicit status in db, use it.
      // Otherwise check pharmacy_documents status.
      // Legacy seed providers without pending docs default to 'approved'.
      let computedStatus = p.status;
      if (!computedStatus) {
        if (pDocs.some((d) => d.verification_status === "pending")) {
          computedStatus = "pending";
        } else if (pDocs.some((d) => d.verification_status === "rejected")) {
          computedStatus = "rejected";
        } else if (pDocs.length > 0 && pDocs.every((d) => d.verification_status === "approved")) {
          computedStatus = "approved";
        } else {
          computedStatus = "approved"; // existing verified system providers
        }
      }

      return {
        ...p,
        status: computedStatus,
        documents: pDocs,
        documents_count: pDocs.length,
      };
    });

    return NextResponse.json({
      success: true,
      providers: enrichedProviders,
      total: enrichedProviders.length,
      pharmacies_count: enrichedProviders.filter((p) => p.role === "pharmacy").length,
      labs_count: enrichedProviders.filter((p) => p.role === "lab").length,
      pending_requests_count: enrichedProviders.filter((p) => p.status === "pending").length,
    });
  } catch (error: any) {
    console.error("GET /api/smc/providers error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load providers" },
      { status: 500 }
    );
  }
}
