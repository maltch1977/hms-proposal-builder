import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { analyzeImage, analyzeDocument, downloadStorageFile, stripCodeFences } from "@/lib/ai/client";
import { RFP_PARSE_SYSTEM } from "@/lib/ai/prompts";

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { bucket, path } = await request.json();
  if (!bucket || !path) {
    return NextResponse.json({ error: "Bucket and path required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    console.log("[parse-rfp] Downloading file from storage...");
    const { base64, contentType } = await downloadStorageFile(supabase, bucket, path);
    console.log(`[parse-rfp] File downloaded: ${contentType}, ${Math.round(base64.length / 1024)}KB base64. Calling AI...`);

    let parsed: string;

    if (contentType.includes("pdf")) {
      parsed = await analyzeDocument(
        base64,
        "application/pdf",
        "Analyze this RFP document and extract all requirements and project details.",
        { system: RFP_PARSE_SYSTEM, model: "claude-sonnet-4-5-20250929", maxTokens: 8192 }
      );
    } else {
      const mediaType = contentType.includes("png") ? "image/png" : "image/jpeg";
      parsed = await analyzeImage(
        base64,
        mediaType as "image/png" | "image/jpeg",
        "Analyze this RFP document and extract all requirements and project details.",
        { system: RFP_PARSE_SYSTEM, model: "claude-sonnet-4-5-20250929", maxTokens: 8192 }
      );
    }

    let rfpData;
    try {
      rfpData = JSON.parse(stripCodeFences(parsed));
    } catch {
      console.error("JSON parse failed. Raw AI response:", parsed.substring(0, 500));
      return NextResponse.json({ error: "Failed to parse RFP data" }, { status: 500 });
    }

    // Smart Library Matching
    const orgId = profile.organization_id;

    const [libraryRes, personnelRes, referencesRes, projectsRes] = await Promise.all([
      supabase.from("library_items").select("id, name, section_type_id, metadata").eq("organization_id", orgId),
      supabase.from("personnel").select("id, full_name, role_type, specialties").eq("organization_id", orgId).eq("is_active", true),
      supabase.from("references").select("id, contact_name, company, category").eq("organization_id", orgId),
      supabase.from("past_projects").select("id, project_name, project_type, building_type, client_name").eq("organization_id", orgId),
    ]);

    const { data: sectionTypes } = await supabase
      .from("section_types")
      .select("id, slug")
      .eq("organization_id", orgId);

    const slugToSectionTypeId: Record<string, string> = {};
    sectionTypes?.forEach((st) => {
      slugToSectionTypeId[st.slug] = st.id;
    });

    const suggestedLibraryItems: Record<string, string> = {};
    if (libraryRes.data) {
      for (const item of libraryRes.data) {
        const matchingSlug = Object.entries(slugToSectionTypeId).find(
          ([, id]) => id === item.section_type_id
        );
        if (matchingSlug && item.metadata && typeof item.metadata === "object" && (item.metadata as Record<string, unknown>).is_default) {
          suggestedLibraryItems[matchingSlug[0]] = item.id;
        }
      }
    }

    return NextResponse.json({
      ...rfpData,
      suggested_library_items: suggestedLibraryItems,
      suggested_team: personnelRes.data?.slice(0, 6).map((p) => p.id) || [],
      suggested_references: referencesRes.data?.slice(0, 3).map((r) => r.id) || [],
      suggested_case_studies: projectsRes.data?.slice(0, 3).map((p) => p.id) || [],
    });
  } catch (err) {
    console.error("RFP parse error:", err);
    return NextResponse.json({ error: "RFP parsing failed" }, { status: 500 });
  }
}
