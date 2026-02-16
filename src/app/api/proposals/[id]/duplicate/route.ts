import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
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

  // Fetch original proposal
  const { data: original, error: fetchError } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (fetchError || !original) {
    return NextResponse.json(
      { error: "Proposal not found" },
      { status: 404 }
    );
  }

  // Create duplicate
  const { data: duplicate, error: createError } = await supabase
    .from("proposals")
    .insert({
      organization_id: original.organization_id,
      created_by: user.id,
      title: `${original.title} (Copy)`,
      client_name: original.client_name,
      client_address: original.client_address,
      project_label: original.project_label,
      status: "draft",
      cover_template: original.cover_template,
      cover_photo_url: original.cover_photo_url,
      metadata: original.metadata,
    })
    .select()
    .single();

  if (createError || !duplicate) {
    return NextResponse.json(
      { error: "Failed to duplicate proposal" },
      { status: 500 }
    );
  }

  // Duplicate sections
  const { data: sections } = await supabase
    .from("proposal_sections")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("order_index");

  if (sections && sections.length > 0) {
    const duplicatedSections = sections.map((s) => ({
      proposal_id: duplicate.id,
      section_type_id: s.section_type_id,
      order_index: s.order_index,
      is_enabled: s.is_enabled,
      content: s.content,
      library_item_id: s.library_item_id,
    }));

    await supabase.from("proposal_sections").insert(duplicatedSections);
  }

  // Duplicate team members
  const { data: teamMembers } = await supabase
    .from("proposal_team_members")
    .select("*")
    .eq("proposal_id", proposalId);

  if (teamMembers && teamMembers.length > 0) {
    const duplicatedMembers = teamMembers.map((m) => ({
      proposal_id: duplicate.id,
      personnel_id: m.personnel_id,
      order_index: m.order_index,
      role_override: m.role_override,
      hierarchy_position: m.hierarchy_position,
    }));

    await supabase.from("proposal_team_members").insert(duplicatedMembers);
  }

  // Duplicate case studies
  const { data: caseStudies } = await supabase
    .from("proposal_case_studies")
    .select("*")
    .eq("proposal_id", proposalId);

  if (caseStudies && caseStudies.length > 0) {
    const duplicatedStudies = caseStudies.map((cs) => ({
      proposal_id: duplicate.id,
      past_project_id: cs.past_project_id,
      order_index: cs.order_index,
    }));

    await supabase.from("proposal_case_studies").insert(duplicatedStudies);
  }

  // Duplicate references
  const { data: refs } = await supabase
    .from("proposal_references")
    .select("*")
    .eq("proposal_id", proposalId);

  if (refs && refs.length > 0) {
    const duplicatedRefs = refs.map((r) => ({
      proposal_id: duplicate.id,
      reference_id: r.reference_id,
      order_index: r.order_index,
    }));

    await supabase.from("proposal_references").insert(duplicatedRefs);
  }

  // Duplicate cost items
  const { data: costItems } = await supabase
    .from("proposal_cost_items")
    .select("*")
    .eq("proposal_id", proposalId);

  if (costItems && costItems.length > 0) {
    const duplicatedCosts = costItems.map((ci) => ({
      proposal_id: duplicate.id,
      description: ci.description,
      type: ci.type,
      amount: ci.amount,
      order_index: ci.order_index,
    }));

    await supabase.from("proposal_cost_items").insert(duplicatedCosts);
  }

  return NextResponse.json({ id: duplicate.id });
}
