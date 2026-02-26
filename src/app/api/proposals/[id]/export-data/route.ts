import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

type SectionType = Tables<"section_types">;

export async function GET(
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

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", proposal.organization_id)
    .single();

  const { data: sections } = await supabase
    .from("proposal_sections")
    .select("*, section_type:section_types(*)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  const { data: teamMembers } = await supabase
    .from("proposal_team_members")
    .select("*, personnel:personnel(*)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  const { data: caseStudies } = await supabase
    .from("proposal_case_studies")
    .select("*, project:past_projects(*)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  const { data: proposalRefs } = await supabase
    .from("proposal_references")
    .select("*, reference:references(*)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  // Per-proposal EMR entries from site_logistics content, falling back to library table
  const siteLogisticsSection = (sections || []).find((s) => {
    const st = (s as unknown as { section_type: SectionType }).section_type;
    return st.slug === "site_logistics";
  });
  const proposalEmrEntries = (
    siteLogisticsSection?.content as Record<string, unknown> | null
  )?.emr_entries as Array<{ year: string; rating: string }> | undefined;

  let emrRatingsData: Array<{ year: number; rating: number }>;
  if (proposalEmrEntries && proposalEmrEntries.length > 0) {
    emrRatingsData = proposalEmrEntries.map((e) => ({
      year: Number(e.year),
      rating: Number(e.rating),
    }));
  } else {
    const { data: emrRatings } = await supabase
      .from("emr_ratings")
      .select("*")
      .eq("organization_id", proposal.organization_id)
      .order("year");
    emrRatingsData = (emrRatings || []).map((r) => ({
      year: r.year,
      rating: r.rating,
    }));
  }

  return NextResponse.json({
    title: proposal.title,
    clientName: proposal.client_name,
    clientAddress: proposal.client_address,
    projectLabel: proposal.project_label,
    status: proposal.status,
    deadline: proposal.deadline,
    metadata: proposal.metadata,
    companyName: org?.company_name || org?.name || "HMS Commercial Service, Inc.",
    sections: (sections || []).map((s) => ({
      slug: (s as unknown as { section_type: SectionType }).section_type.slug,
      displayName: (s as unknown as { section_type: SectionType }).section_type.display_name,
      content: s.content || {},
      isEnabled: s.is_enabled,
    })),
    personnel: (teamMembers || []).map((m) => {
      const p = (m as unknown as { personnel: Tables<"personnel"> }).personnel;
      return {
        fullName: p.full_name,
        title: p.title,
        roleType: p.role_type,
        yearsIndustry: p.years_in_industry,
        yearsCompany: p.years_at_company,
        taskDescription: p.task_description,
      };
    }),
    caseStudies: (caseStudies || []).map((cs) => {
      const proj = (cs as unknown as { project: Tables<"past_projects"> }).project;
      return {
        projectName: proj.project_name,
        clientName: proj.client_name,
        buildingType: proj.building_type,
        squareFootage: proj.square_footage,
        narrative: proj.narrative,
      };
    }),
    references: (proposalRefs || []).map((pr) => {
      const ref = (pr as unknown as { reference: Tables<"references"> }).reference;
      return {
        contactName: ref.contact_name,
        title: ref.title,
        company: ref.company,
        phone: ref.phone,
        email: ref.email,
        category: ref.category,
      };
    }),
    costData: (() => {
      const costSection = (sections || []).find((s) => {
        const st = (s as unknown as { section_type: SectionType }).section_type;
        return st.slug === "project_cost";
      });
      const content = (costSection?.content || {}) as Record<string, unknown>;
      return {
        columns: content.columns || [],
        rows: content.rows || [],
        notes: (content.notes as string) || undefined,
      };
    })(),
    emrRatings: emrRatingsData,
  });
}
