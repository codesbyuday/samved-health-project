import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || formData.get("contact_number") || "").trim();
    const wardIdRaw = formData.get("ward_id");
    const ward_id = wardIdRaw ? Number(wardIdRaw) : null;
    const address = String(formData.get("address") || "").trim();
    const license = String(formData.get("license") || "").trim();
    const password = String(formData.get("admin_password") || formData.get("password") || "").trim();
    const latitude = formData.get("latitude") ? parseFloat(String(formData.get("latitude"))) : null;
    const longitude = formData.get("longitude") ? parseFloat(String(formData.get("longitude"))) : null;

    if (!name || !email || !phone || !license || !password) {
      return NextResponse.json(
        { error: "All required laboratory details (Name, Email, Phone, License, Password) must be provided." },
        { status: 400 }
      );
    }

    // 1. Check if email is already registered in auth_users
    const { data: existingUsers, error: userCheckErr } = await supabaseAdmin
      .from("auth_users")
      .select("id, email")
      .eq("email", email);

    if (userCheckErr) {
      console.warn("auth_users check warning:", userCheckErr.message);
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "An account with this email address is already registered in the system." },
        { status: 400 }
      );
    }

    // 2. Generate unique IDs
    const userId = crypto.randomUUID();
    const hex = Math.floor(100 + Math.random() * 900);
    const providerId = `PROV-LAB-0${hex}`;

    // 3. Create Auth User
    const { error: authInsertErr } = await supabaseAdmin.from("auth_users").insert({
      id: userId,
      email: email,
      phone: phone,
      role: "provider",
      password_hash: password,
    });

    if (authInsertErr) {
      console.error("Failed to insert auth_user:", authInsertErr);
      return NextResponse.json(
        { error: `Failed to create authentication user: ${authInsertErr.message}` },
        { status: 500 }
      );
    }

    // 4. Create Provider Record in `provider` table
    const providerRecord: any = {
      provider_id: providerId,
      user_id: userId,
      ward_id: ward_id,
      name: name,
      role: "lab",
      address: address || "Solapur, Maharashtra",
      email: email,
      phone: phone,
      license: license,
    };

    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      providerRecord.location = `POINT(${longitude} ${latitude})`;
    }

    // Insert with status: "pending"
    let { error: provErr } = await supabaseAdmin.from("provider").insert({
      ...providerRecord,
      status: "pending",
    });

    if (provErr && provErr.message?.includes("status")) {
      const fallback = await supabaseAdmin.from("provider").insert(providerRecord);
      provErr = fallback.error;
    }

    if (provErr) {
      console.error("Provider insert error:", provErr);
      // Rollback auth_users
      await supabaseAdmin.from("auth_users").delete().eq("id", userId);
      return NextResponse.json(
        { error: `Failed to register laboratory provider: ${provErr.message}` },
        { status: 500 }
      );
    }

    // 5. Upload Mandatory Diagnostic Lab Documents to Storage
    const documentTypes = [
      { key: "file_license", label: "Clinical Establishment Registration (CEA / SMC)" },
      { key: "file_pathologist", label: "Supervising Pathologist MMC Registration Certificate" },
      { key: "file_bmw", label: "Bio-Medical Waste (BMW) Disposal Authorization" },
      { key: "file_gst", label: "Establishment License (Gumasta / GST Certificate)" },
    ];

    const uploadedDocuments: any[] = [];
    const targetBucket = "lab_document";

    for (const doc of documentTypes) {
      const file = formData.get(doc.key) as File | null;
      if (!file || typeof file === "string") continue;

      const fileExt = file.name.split(".").pop() || "pdf";
      const cleanType = doc.label.replace(/[^a-zA-Z0-9]/g, "_");
      const storagePath = `${providerId}/${cleanType}_${Date.now()}.${fileExt}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload document to 'lab_document' bucket
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(targetBucket)
        .upload(storagePath, buffer, {
          contentType: file.type || "application/pdf",
          upsert: true,
        });

      if (uploadErr) {
        console.warn(`Storage upload to ${targetBucket} error:`, uploadErr.message);
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(targetBucket)
        .getPublicUrl(storagePath);

      const fileUrl = publicUrlData?.publicUrl || storagePath;

      // Insert record into lab_documents
      const docPayload = {
        document_id: `DOC-LAB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        provider_id: providerId,
        lab_name: name,
        document_type: doc.label,
        document_url: fileUrl,
        verification_status: "pending",
        submitted_at: new Date().toISOString(),
      };

      const { error: docDbErr } = await supabaseAdmin.from("lab_documents").insert(docPayload);
      if (docDbErr) {
        console.warn("lab_documents DB insert error (table may need creation):", docDbErr.message);
      } else {
        uploadedDocuments.push(docPayload);
      }
    }

    return NextResponse.json({
      success: true,
      provider_id: providerId,
      user_id: userId,
      message: "Laboratory registration submitted successfully. Application is pending SMC official review.",
      documents_count: uploadedDocuments.length,
    });
  } catch (error: any) {
    console.error("Laboratory registration exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during laboratory registration" },
      { status: 500 }
    );
  }
}
