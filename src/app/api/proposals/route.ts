import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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

  const body = await request.json();
  const { title, client_name, client_address, rfp_requirements, deadline, collaborator_ids, build_mode } = body;

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
      metadata: {
        ...(rfp_requirements ? { rfp_requirements } : {}),
        ...(build_mode ? { build_mode } : {}),
      },
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
            // For manual proposals, default label to "PROPOSAL" instead of "RESPONSE TO RFP"
            ...(build_mode === "manual" ? { project_label: "PROPOSAL" } : {}),
          },
        })
        .eq("id", coverSection.id);
    }
  }

  // ── Manual-mode enhancements ─────────────────────────────────────────────
  if (build_mode === "manual") {
    // 1. Pre-populate library default content into sections so they aren't blank
    const { data: sectionsWithLibrary } = await supabase
      .from("proposal_sections")
      .select("id, library_item_id, content, section_type_id, section_types!inner(slug)")
      .eq("proposal_id", proposal.id)
      .not("library_item_id", "is", null);

    if (sectionsWithLibrary && sectionsWithLibrary.length > 0) {
      const libraryIds = sectionsWithLibrary.map((s) => s.library_item_id).filter(Boolean) as string[];
      const { data: libraryItems } = await supabase
        .from("library_items")
        .select("id, content")
        .in("id", libraryIds);

      if (libraryItems) {
        const libraryContentMap = new Map(libraryItems.map((li) => [li.id, li.content]));
        for (const section of sectionsWithLibrary) {
          const libContent = libraryContentMap.get(section.library_item_id!);
          if (libContent && (!section.content || Object.keys(section.content as object).length === 0)) {
            await supabase
              .from("proposal_sections")
              .update({ content: libContent })
              .eq("id", section.id);
          }
        }
      }
    }

    // 2. Disable optional sections: closeout, interview_panel
    const { data: optionalSections } = await supabase
      .from("proposal_sections")
      .select("id, section_types!inner(slug)")
      .eq("proposal_id", proposal.id)
      .in("section_types.slug", ["closeout", "interview_panel"]);

    if (optionalSections && optionalSections.length > 0) {
      const optionalIds = optionalSections.map((s) => s.id);
      await supabase
        .from("proposal_sections")
        .update({ is_enabled: false })
        .in("id", optionalIds);
    }

    // 3. Reorder executive_summary to after key_personnel (canonical PDF position)
    //    Default order: cover(1), intro(2), toc(3), firm(4), personnel(5), schedule(6),
    //    logistics(7), qaqc(8), closeout(9), ref(10), interview(11), cost(12), exec(13)
    //    Target:  cover(1), intro(2), toc(3), firm(4), personnel(5), exec_summary(6),
    //             schedule(7), logistics(8), qaqc(9), closeout(10), ref(11), interview(12), cost(13)
    const { data: allSections } = await supabase
      .from("proposal_sections")
      .select("id, order_index, section_types!inner(slug)")
      .eq("proposal_id", proposal.id)
      .order("order_index", { ascending: true });

    if (allSections) {
      const execSection = allSections.find(
        (s) => (s.section_types as unknown as { slug: string }).slug === "executive_summary"
      );
      if (execSection && execSection.order_index > 6) {
        // Shift sections that are between position 6 and exec's current position up by 1
        const toShift = allSections.filter(
          (s) => s.order_index >= 6 && s.order_index < execSection.order_index && s.id !== execSection.id
        );
        for (const s of toShift) {
          await supabase
            .from("proposal_sections")
            .update({ order_index: s.order_index + 1 })
            .eq("id", s.id);
        }
        // Place executive_summary at position 6
        await supabase
          .from("proposal_sections")
          .update({ order_index: 6 })
          .eq("id", execSection.id);
      }
    }
  }

  return NextResponse.json({ id: proposal.id });
}
