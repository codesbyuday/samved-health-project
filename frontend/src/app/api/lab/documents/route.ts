import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("provider_id");

    if (!providerId) {
      return NextResponse.json(
        { error: "provider_id parameter is required" },
        { status: 400 }
      );
    }

    // 1. Fetch provider details
    const { data: provider, error: provErr } = await supabaseAdmin
      .from("provider")
      .select("*")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (provErr) {
      console.warn("Could not query provider:", provErr.message);
    }

    // 2. Fetch all documents for this laboratory
    const { data: documents, error: docErr } = await supabaseAdmin
      .from("lab_documents")
      .select("*")
      .eq("provider_id", providerId)
      .order("submitted_at", { ascending: false });

    if (docErr) {
      console.warn("Could not query lab_documents:", docErr.message);
    }

    const docList = documents || [];

    // 3. Compute verification status
    let computedStatus = provider?.status || "approved";
    if (provider?.status === "pending" || provider?.status === "rejected") {
      computedStatus = provider.status;
    } else if (docList.some((d) => d.verification_status === "pending")) {
      computedStatus = "pending";
    } else if (docList.some((d) => d.verification_status === "rejected")) {
      computedStatus = "rejected";
    } else if (docList.length > 0 && docList.every((d) => d.verification_status === "approved")) {
      computedStatus = "approved";
    } else {
      computedStatus = provider?.status || "approved";
    }

    return NextResponse.json({
      success: true,
      provider: provider || null,
      status: computedStatus,
      documents: docList,
    });
  } catch (error: any) {
    console.error("GET /api/lab/documents error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load laboratory documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = (formData.get("document_type") as string || "").trim();
    const providerId = (formData.get("provider_id") as string || "").trim();
    const labName = (formData.get("lab_name") as string || "").trim();

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No document file was uploaded." },
        { status: 400 }
      );
    }

    if (!documentType || !providerId) {
      return NextResponse.json(
        { error: "document_type and provider_id are required fields." },
        { status: 400 }
      );
    }

    // 1. Upload to Supabase storage bucket 'lab_document'
    const fileExt = file.name.split(".").pop() || "pdf";
    const cleanType = documentType.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const storagePath = `${providerId}/${cleanType}_${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("lab_document")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadErr.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("lab_document")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl || storagePath;

    // 2. Check if a document record already exists for this provider and document_type
    const { data: existingDocs } = await supabaseAdmin
      .from("lab_documents")
      .select("document_id")
      .eq("provider_id", providerId)
      .eq("document_type", documentType);

    const now = new Date().toISOString();
    let savedDoc: any = null;

    if (existingDocs && existingDocs.length > 0) {
      const docId = existingDocs[0].document_id;
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("lab_documents")
        .update({
          document_url: publicUrl,
          verification_status: "pending",
          rejection_reason: null,
          submitted_at: now,
          reviewed_by: null,
          reviewed_at: null,
        })
        .eq("document_id", docId)
        .select()
        .single();

      if (updateErr) {
        console.error("Document update error:", updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      savedDoc = updated;
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const docId = `DOC-LAB-${Date.now().toString().slice(-4)}${randomSuffix}`;

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("lab_documents")
        .insert({
          document_id: docId,
          provider_id: providerId,
          lab_name: labName || "Solapur Diagnostic Lab",
          document_type: documentType,
          document_url: publicUrl,
          verification_status: "pending",
          submitted_at: now,
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Document insert error:", insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      savedDoc = inserted;
    }

    return NextResponse.json({
      success: true,
      message: `${documentType} uploaded successfully. Pending SMC verification.`,
      document: savedDoc,
    });
  } catch (error: any) {
    console.error("POST /api/lab/documents error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}
