import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch changes with author profile info and section info
  const { data: changes, error } = await supabase
    .from("proposal_changes")
    .select(`
      id,
      section_id,
      author_id,
      field,
      old_value,
      new_value,
      change_type,
      summary,
      created_at,
      profiles:author_id (full_name, avatar_url, email),
      proposal_sections!inner (
        id,
        section_types!inner (slug, display_name)
      )
    `)
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch collaborator colors
  const { data: collaborators } = await supabase
    .from("proposal_collaborators")
    .select("profile_id, color")
    .eq("proposal_id", proposalId);

  const colorMap: Record<string, string> = {};
  if (collaborators) {
    for (const c of collaborators) {
      colorMap[c.profile_id] = c.color;
    }
  }

  // Flatten the response
  const result = (changes || []).map((c) => {
    const sectionInfo = c.proposal_sections as unknown as {
      id: string;
      section_types: { slug: string; display_name: string };
    };
    const authorProfile = c.profiles as unknown as {
      full_name: string;
      avatar_url: string | null;
      email: string;
    } | null;

    return {
      id: c.id,
      section_id: c.section_id,
      section_slug: sectionInfo.section_types.slug,
      section_name: sectionInfo.section_types.display_name,
      field: c.field,
      old_value: c.old_value,
      new_value: c.new_value,
      change_type: c.change_type,
      summary: c.summary,
      created_at: c.created_at,
      author: c.author_id
        ? {
            id: c.author_id,
            name: authorProfile?.full_name || "Unknown",
            avatar_url: authorProfile?.avatar_url || null,
            email: authorProfile?.email || "",
            color: colorMap[c.author_id] || null,
          }
        : null,
    };
  });

  return NextResponse.json(result);
}
