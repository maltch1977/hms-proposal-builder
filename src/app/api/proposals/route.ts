import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, client_name, client_address, rfp_requirements, deadline, collaborator_ids } = body;

  if (!title || !client_name) {
    return NextResponse.json(
      { error: "Title and client name are required" },
      { status: 400 }
    );
  }

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      organization_id: profile.organization_id,
      created_by: user.id,
      title,
      client_name,
      client_address: client_address || "",
      ...(deadline ? { deadline } : {}),
      ...(rfp_requirements ? { metadata: { rfp_requirements } } : {}),
    })
    .select()
    .single();

  if (error || !proposal) {
    return NextResponse.json(
      { error: error?.message || "Failed to create proposal" },
      { status: 500 }
    );
  }

  const { error: sectionsError } = await supabase.rpc(
    "create_proposal_sections",
    {
      p_proposal_id: proposal.id,
      p_org_id: profile.organization_id,
    }
  );

  if (sectionsError) {
    console.error("Sections RPC error:", sectionsError);
  }

  // Insert collaborators
  const COLLABORATOR_COLORS = [
    "#FFEB3B", "#FF9100", "#FF4081", "#AA00FF",
    "#00E676", "#00B0FF", "#FF6E40", "#E040FB",
  ];

  // Always add the creator as owner
  const collaboratorInserts: { proposal_id: string; profile_id: string; role: "owner" | "editor" | "viewer"; added_by: string; color: string }[] = [
    {
      proposal_id: proposal.id,
      profile_id: user.id,
      role: "owner" as const,
      added_by: user.id,
      color: COLLABORATOR_COLORS[0],
    },
  ];

  // Add selected collaborators as editors
  if (collaborator_ids && Array.isArray(collaborator_ids)) {
    for (const pid of collaborator_ids) {
      if (pid === user.id) continue; // Skip creator (already added as owner)
      const colorIdx = collaboratorInserts.length % COLLABORATOR_COLORS.length;
      collaboratorInserts.push({
        proposal_id: proposal.id,
        profile_id: pid,
        role: "editor" as const,
        added_by: user.id,
        color: COLLABORATOR_COLORS[colorIdx],
      });
    }
  }

  await supabase.from("proposal_collaborators").insert(collaboratorInserts);

  // Populate cover page section with client info from the proposal
  if (client_name || client_address) {
    const { data: coverSection } = await supabase
      .from("proposal_sections")
      .select("id, content, section_type_id, section_types!inner(slug)")
      .eq("proposal_id", proposal.id)
      .eq("section_types.slug", "cover_page")
      .single();

    if (coverSection) {
      const existingContent = (coverSection.content || {}) as Record<string, unknown>;
      await supabase
        .from("proposal_sections")
        .update({
          content: {
            ...existingContent,
            client_name: client_name || "",
            client_address: client_address || "",
          },
        })
        .eq("id", coverSection.id);
    }
  }

  return NextResponse.json({ id: proposal.id });
}
