import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST: Add a section to a proposal
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

  const { sectionTypeId } = await request.json();
  if (!sectionTypeId) {
    return NextResponse.json(
      { error: "sectionTypeId is required" },
      { status: 400 }
    );
  }

  // Check the proposal belongs to user's org
  const { data: proposal } = await supabase
    .from("proposals")
    .select("organization_id")
    .eq("id", proposalId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Check section type doesn't already exist in this proposal
  const { data: existing } = await supabase
    .from("proposal_sections")
    .select("id")
    .eq("proposal_id", proposalId)
    .eq("section_type_id", sectionTypeId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Section type already exists in this proposal" },
      { status: 409 }
    );
  }

  // Get max order_index for the proposal
  const { data: maxRow } = await supabase
    .from("proposal_sections")
    .select("order_index")
    .eq("proposal_id", proposalId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.order_index ?? 0) + 1;

  // Check for a default library item for this section type
  let defaultContent = {};
  const { data: defaultLib } = await supabase
    .from("library_items")
    .select("content")
    .eq("section_type_id", sectionTypeId)
    .eq("organization_id", proposal.organization_id)
    .eq("is_default", true)
    .limit(1)
    .single();

  if (defaultLib?.content) {
    defaultContent = defaultLib.content as Record<string, unknown>;
  }

  // Insert the new section
  const { data: newSection, error } = await supabase
    .from("proposal_sections")
    .insert({
      proposal_id: proposalId,
      section_type_id: sectionTypeId,
      order_index: nextOrder,
      is_enabled: true,
      content: defaultContent,
    })
    .select("*, section_type:section_types(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(newSection);
}
