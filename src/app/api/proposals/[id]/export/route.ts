import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Tables } from "@/lib/types/database";
import type { ProposalDocumentData } from "@/lib/pdf/types";
import { generateProposalPdf } from "@/lib/pdf/generate-pdf";

export const maxDuration = 60;

type SectionType = Tables<"section_types">;

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;
  const supabase = await createClient();

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch proposal
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (proposalError || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Fetch organization
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", proposal.organization_id)
    .single();

  // Fetch sections with types
  const { data: sections } = await supabase
    .from("proposal_sections")
    .select("*, section_type:section_types(*)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  // Use admin client for junction tables (RLS policies filter these with anon key)
  const admin = getAdminClient();

  // Fetch team members with personnel
  const { data: teamMembers, error: teamError } = await admin
    .from("proposal_team_members")
    .select("*, personnel:personnel(*)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  // Fetch case studies with projects
  const { data: caseStudies, error: caseStudyError } = await admin
    .from("proposal_case_studies")
    .select("*, project:past_projects(*)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  // Fetch references
  const { data: proposalRefs, error: refError } = await admin
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

  // Assemble document data — keep image URLs as-is, images.ts resolves to base64 later
  const docData: ProposalDocumentData = {
    title: proposal.title,
    clientName: proposal.client_name,
    clientAddress: proposal.client_address,
    projectLabel: proposal.project_label || "RESPONSE TO RFP",
    coverTemplate: proposal.cover_template,
    coverPhotoUrl: proposal.cover_photo_url || undefined,
    logoUrl: org?.logo_url || "/images/hms_logo.png",
    companyName: org?.company_name || org?.name || "HMS Commercial Service, Inc.",
    companyAddress: org?.company_address || undefined,
    companyPhone: org?.company_phone || undefined,
    companyEmail: org?.company_email || undefined,
    companyWebsite: org?.company_website || undefined,
    footerText: org?.footer_text || undefined,
    sections: (sections || []).map((s) => {
      const slug = (s as unknown as { section_type: SectionType }).section_type.slug;
      const content = (s.content || {}) as Record<string, unknown>;

      // Keep org chart image URL as-is — images.ts resolves to base64
      if (slug === "key_personnel") {
        const mode = (content.org_chart_mode as string) || "upload";
        if (mode === "upload") {
          const stored = content.org_chart_image as string | undefined;
          if (!stored || stored.startsWith("/images/")) {
            content.org_chart_image = "/images/hms_org_chart.png";
          }
        }
      }

      return {
        slug,
        displayName: (s as unknown as { section_type: SectionType }).section_type.display_name,
        content,
        isEnabled: s.is_enabled,
      };
    }),
    personnel: (() => {
      // Look up member_bios from key_personnel section content
      const kpSection = (sections || []).find((s) => {
        const st = (s as unknown as { section_type: SectionType }).section_type;
        return st.slug === "key_personnel";
      });
      const memberBios = (kpSection?.content as Record<string, unknown> | null)?.member_bios as Record<string, string> | undefined;

      return (teamMembers || []).map((m) => {
        const p = (m as unknown as { personnel: Tables<"personnel"> }).personnel;
        return {
          fullName: p.full_name,
          title: p.title,
          roleType: m.role_override || p.role_type,
          yearsIndustry: p.years_in_industry,
          yearsCompany: p.years_at_company,
          yearsWithDistech: p.years_with_distech,
          taskDescription: p.task_description,
          specialties: p.specialties || [],
          certifications: p.certifications || [],
          bio: memberBios?.[p.id] ?? p.bio ?? null,
        };
      });
    })(),
    caseStudies: (caseStudies || []).map((cs) => {
      const proj = (cs as unknown as { project: Tables<"past_projects"> }).project;
      // Extract first photo URL from photos JSON array
      const photos = proj.photos as unknown[];
      let photoUrl: string | undefined;
      if (Array.isArray(photos) && photos.length > 0) {
        const first = photos[0];
        if (typeof first === "string") photoUrl = first;
        else if (first && typeof first === "object" && "url" in first)
          photoUrl = (first as { url: string }).url;
      }

      return {
        projectName: proj.project_name,
        clientName: proj.client_name,
        buildingType: proj.building_type,
        squareFootage: proj.square_footage,
        narrative: proj.narrative,
        photoUrl,
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
        columns: (content.columns || []) as Array<{ id: string; name: string; type: "base" | "alternate" | "value_engineering" }>,
        rows: (content.rows || []) as Array<{ id: string; description: string; values: Record<string, string> }>,
        notes: (content.notes as string) || undefined,
      };
    })(),
    emrRatings: emrRatingsData,
  };

  // Debug mode: return assembled data as JSON for verification
  const debug = request.nextUrl.searchParams.get("debug");
  if (debug === "1") {
    return NextResponse.json({
      _debug: true,
      proposalId,
      queryErrors: {
        teamMembers: teamError?.message || null,
        caseStudies: caseStudyError?.message || null,
        references: refError?.message || null,
      },
      rawQueryResults: {
        caseStudiesRaw: caseStudies,
        teamMembersRaw: teamMembers?.length ?? null,
        refsRaw: proposalRefs?.length ?? null,
      },
      sectionCount: docData.sections.length,
      enabledSections: docData.sections.filter(s => s.isEnabled).map(s => s.slug),
      caseStudyCount: docData.caseStudies.length,
      personnelCount: docData.personnel.length,
      referenceCount: docData.references.length,
      costRowCount: docData.costData.rows.length,
      emrRatingCount: docData.emrRatings.length,
      scheduleFiles: await (async () => {
        const schedSec = docData.sections.find(s => s.slug === "project_schedule");
        const files = (schedSec?.content.files as Array<{ url: string; filename: string; type: string }>) || [];
        const fileDetails = [];
        for (const f of files) {
          let pageCount: number | null = null;
          if (f.type === "application/pdf") {
            try {
              const { PDFDocument } = await import("pdf-lib");
              const res = await fetch(f.url);
              if (res.ok) {
                const buf = await res.arrayBuffer();
                const doc = await PDFDocument.load(buf);
                pageCount = doc.getPageCount();
              }
            } catch { /* ignore */ }
          }
          fileDetails.push({ filename: f.filename, type: f.type, url: f.url, pageCount });
        }
        return { count: files.length, files: fileDetails };
      })(),
    });
  }

  try {
    const pdfBytes = await generateProposalPdf(docData);

    const filename = `${proposal.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}_Proposal.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("PDF generation error:", message, stack);
    return NextResponse.json(
      { error: "Failed to generate PDF", detail: message },
      { status: 500 }
    );
  }
}
