import { NextResponse } from "next/server";
import { requireUserContext } from "@/smc/lib/auth/session";
import { createClient } from "@/smc/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireUserContext("/smc/hospitals");
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: docs, error } = await supabase
    .from("hospital_documents")
    .select("*")
    .eq("hospital_id", id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Generate accessible URLs for officers to view or download
  const resolved = await Promise.all(
    (docs ?? []).map(async (doc) => {
      let downloadUrl = doc.file_url;
      if (doc.file_url && !doc.file_url.startsWith("http")) {
        try {
          const { data: signed } = await supabase.storage
            .from("hospital_documents")
            .createSignedUrl(doc.file_url, 3600);
          if (signed?.signedUrl) {
            downloadUrl = signed.signedUrl;
          }
        } catch {
          // fallback to public or original url
        }
      }
      return {
        ...doc,
        file_url: downloadUrl,
      };
    })
  );

  return NextResponse.json({ success: true, documents: resolved });
}
