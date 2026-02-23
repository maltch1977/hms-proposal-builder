import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText, stripCodeFences } from "@/lib/ai/client";
import { PROPOSAL_POPULATE_SYSTEM } from "@/lib/ai/prompts";
import type { Json } from "@/lib/types/database";
import type { GeneratedSectionContent, ContentGap, RFPRequirement, RequirementMapping } from "@/lib/ai/types";

export const maxDuration = 120;

// Strip HTML tags and take first N words as a voice sample
function extractVoiceSample(html: string | null | undefined, maxWords = 200): string {
  if (!html) return "";
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.split(" ").slice(0, maxWords).join(" ");
}

// Extract requirement mappings from generated HTML mark tags
function extractMappings(
  sections: GeneratedSectionContent
): RequirementMapping[] {
  const mappings: RequirementMapping[] = [];
  // Match <mark> tags with data-req-id and data-req-type in ANY order
  const markRegex = /<mark\s+(?=[^>]*data-req-id="([^"]+)")(?=[^>]*data-req-type="([^"]+)")[^>]*>/g;

  const sectionFields: Record<string, string[]> = {
    introduction: ["body"],
    firm_background: ["narrative"],
    site_logistics: ["body"],
    qaqc_commissioning: ["quality_assurance", "quality_control", "commissioning"],
    closeout: ["body"],
    executive_summary: ["body"],
  };

  for (const [slug, fields] of Object.entries(sectionFields)) {
    const sectionContent = sections[slug as keyof GeneratedSectionContent];
    if (!sectionContent) continue;

    for (const field of fields) {
      const html = (sectionContent as Record<string, string>)[field];
      if (!html) continue;

      // Reset lastIndex for each field to avoid stale state
      markRegex.lastIndex = 0;
      let match;
      while ((match = markRegex.exec(html)) !== null) {
        mappings.push({
          req_id: match[1],
          section_slug: slug,
          field,
          req_type: match[2] as "addressed" | "needs_input",
          note: "",
        });
      }
    }
  }

  console.log(`[populate] Extracted ${mappings.length} requirement mappings from ${Object.keys(sections).length} sections`);
  return mappings;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const { proposalId } = await request.json();
  if (!proposalId) {
    return NextResponse.json({ error: "proposalId required" }, { status: 400 });
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

  const meta = (proposal.metadata || {}) as Record<string, unknown>;
  const rfpRequirements = (meta.rfp_requirements || []) as RFPRequirement[];

  // Fetch sections with their section types
  const { data: sections } = await supabase
    .from("proposal_sections")
    .select("id, section_type_id, content, is_enabled, library_item_id, section_types!inner(slug, display_name)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  if (!sections || sections.length === 0) {
    return NextResponse.json({ error: "No sections found" }, { status: 404 });
  }

  // Fetch profile for organization_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const orgId = profile.organization_id;

  // Fetch organization for company profile
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  // Fetch library defaults for voice samples
  const { data: libraryItems } = await supabase
    .from("library_items")
    .select("content, section_type_id, section_types!inner(slug)")
    .eq("organization_id", orgId)
    .eq("is_default", true);

  // Build voice samples map: slug -> excerpt
  const voiceSamples: Record<string, string> = {};
  if (libraryItems) {
    for (const item of libraryItems) {
      const slug = (item as unknown as { section_types: { slug: string } }).section_types.slug;
      const content = item.content as Record<string, unknown>;
      const htmlFields = ["body", "narrative", "quality_assurance", "quality_control", "commissioning"];
      const sample = htmlFields
        .map((f) => extractVoiceSample(content[f] as string))
        .filter(Boolean)
        .join(" ");
      if (sample) voiceSamples[slug] = sample;
    }
  }

  // Group requirements by section
  const reqsBySection: Record<string, RFPRequirement[]> = {};
  for (const req of rfpRequirements) {
    if (!reqsBySection[req.section_slug]) reqsBySection[req.section_slug] = [];
    reqsBySection[req.section_slug].push(req);
  }

  // Build the user prompt
  const narrativeSlugs = ["introduction", "firm_background", "site_logistics", "qaqc_commissioning", "closeout", "executive_summary"];

  let userPrompt = `Project: "${proposal.title}"\nClient: ${proposal.client_name}\nAddress: ${proposal.client_address || "Not specified"}\n\n`;

  // Include company profile so AI can use real company details
  if (org) {
    userPrompt += "## Company Profile\n";
    const companyName = org.company_name || org.name;
    if (companyName) userPrompt += `Company Name: ${companyName}\n`;
    if (org.company_address) userPrompt += `Address: ${org.company_address}\n`;
    if (org.company_phone) userPrompt += `Phone: ${org.company_phone}\n`;
    if (org.company_email) userPrompt += `Email: ${org.company_email}\n`;
    if (org.company_website) userPrompt += `Website: ${org.company_website}\n`;
    const config = (org.theme_config || {}) as Record<string, unknown>;
    if (config.company_fax) userPrompt += `Fax: ${config.company_fax}\n`;
    if (config.company_license_number) userPrompt += `License: ${config.company_license_number}\n`;
    if (config.company_description) userPrompt += `Description: ${config.company_description}\n`;
    userPrompt += "\nUse this company information directly in the content — do NOT use placeholders for company name, address, phone, etc.\n\n";
  }


  userPrompt += "## RFP Requirements by Section\n\n";
  for (const slug of narrativeSlugs) {
    const reqs = reqsBySection[slug] || [];
    userPrompt += `### ${slug}\n`;
    if (reqs.length > 0) {
      for (const r of reqs) {
        userPrompt += `- [${r.id}] ${r.description}${r.is_mandatory ? " (MANDATORY)" : ""}\n`;
      }
    } else {
      userPrompt += "- No specific requirements\n";
    }
    userPrompt += "\n";
  }

  // Add requirements from non-narrative sections that should still be referenced
  const otherReqs = rfpRequirements.filter((r) => !narrativeSlugs.includes(r.section_slug));
  if (otherReqs.length > 0) {
    userPrompt += "### Other requirements (reference where appropriate)\n";
    for (const r of otherReqs) {
      userPrompt += `- [${r.id}] (${r.section_slug}) ${r.description}\n`;
    }
    userPrompt += "\n";
  }

  userPrompt += "## Voice/Style Samples\n\n";
  for (const slug of narrativeSlugs) {
    const sample = voiceSamples[slug];
    if (sample) {
      userPrompt += `### ${slug}\n${sample}\n\n`;
    }
  }

  userPrompt += "Generate content for all narrative sections now.";

  try {
    const result = await generateText(userPrompt, {
      system: PROPOSAL_POPULATE_SYSTEM,
      maxTokens: 12000,
      temperature: 0.4,
    });

    // Parse the JSON response
    let parsed: {
      sections: GeneratedSectionContent;
      content_gaps: ContentGap[];
      requirements_addressed: string[];
      requirement_notes?: Record<string, string>;
    };

    try {
      parsed = JSON.parse(stripCodeFences(result));
      // Log mark tag presence for debugging
      const markCount = (JSON.stringify(parsed.sections).match(/<mark\s/g) || []).length;
      console.log(`[populate] AI response parsed. Sections: ${Object.keys(parsed.sections).length}, Mark tags found: ${markCount}, Notes: ${Object.keys(parsed.requirement_notes || {}).length}`);
    } catch {
      console.error("[populate] Failed to parse AI response:", result.substring(0, 500));
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Update each section's content and record AI changes
    const sectionsPop: string[] = [];
    const contentFieldsBySlug: Record<string, string[]> = {
      introduction: ["body"],
      firm_background: ["narrative"],
      site_logistics: ["body"],
      qaqc_commissioning: ["quality_assurance", "quality_control", "commissioning"],
      closeout: ["body"],
      executive_summary: ["body"],
    };

    for (const section of sections) {
      const slug = (section as unknown as { section_types: { slug: string } }).section_types.slug;
      const generated = parsed.sections[slug as keyof GeneratedSectionContent];
      if (!generated) continue;

      const existingContent = (section.content || {}) as Record<string, unknown>;
      const newContent = { ...existingContent, ...generated };

      await supabase
        .from("proposal_sections")
        .update({ content: newContent })
        .eq("id", section.id);

      // Record AI change for each field that was populated
      const fields = contentFieldsBySlug[slug] || [];
      const contentRecord = newContent as Record<string, unknown>;
      for (const field of fields) {
        const newVal = (contentRecord[field] as string) || "";
        if (newVal) {
          await supabase.from("proposal_changes").insert({
            proposal_id: proposalId,
            section_id: section.id,
            author_id: null,
            field,
            old_value: "",
            new_value: newVal,
            change_type: "ai",
            summary: "Auto-generated initial content",
          });
        }
      }

      sectionsPop.push(slug);
    }

    // Auto-add team members, references, case studies
    let teamAdded = 0;
    let refsAdded = 0;
    let casesAdded = 0;

    // Fetch available personnel
    const { data: personnel } = await supabase
      .from("personnel")
      .select("id, full_name, role_type")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("role_type");

    // Check existing team members
    const { data: existingTeam } = await supabase
      .from("proposal_team_members")
      .select("personnel_id")
      .eq("proposal_id", proposalId);

    const existingTeamIds = new Set((existingTeam || []).map((t) => t.personnel_id));

    if (personnel && personnel.length > 0) {
      // Add up to 6 team members if none exist
      const toAdd = personnel
        .filter((p) => !existingTeamIds.has(p.id))
        .slice(0, 6);

      if (toAdd.length > 0 && existingTeamIds.size === 0) {
        const inserts = toAdd.map((p, i) => ({
          proposal_id: proposalId,
          personnel_id: p.id,
          order_index: i + 1,
        }));
        await supabase.from("proposal_team_members").insert(inserts);
        teamAdded = toAdd.length;
      }
    }

    // Fetch available references
    const { data: references } = await supabase
      .from("references")
      .select("id")
      .eq("organization_id", orgId)
      .limit(5);

    const { data: existingRefs } = await supabase
      .from("proposal_references")
      .select("reference_id")
      .eq("proposal_id", proposalId);

    const existingRefIds = new Set((existingRefs || []).map((r) => r.reference_id));

    if (references && references.length > 0 && existingRefIds.size === 0) {
      const refsToAdd = references.filter((r) => !existingRefIds.has(r.id)).slice(0, 3);
      if (refsToAdd.length > 0) {
        const inserts = refsToAdd.map((r, i) => ({
          proposal_id: proposalId,
          reference_id: r.id,
          order_index: i + 1,
        }));
        await supabase.from("proposal_references").insert(inserts);
        refsAdded = refsToAdd.length;
      }
    }

    // Fetch available past projects / case studies
    const { data: pastProjects } = await supabase
      .from("past_projects")
      .select("id")
      .eq("organization_id", orgId)
      .limit(5);

    const { data: existingCases } = await supabase
      .from("proposal_case_studies")
      .select("past_project_id")
      .eq("proposal_id", proposalId);

    const existingCaseIds = new Set((existingCases || []).map((c) => c.past_project_id));

    if (pastProjects && pastProjects.length > 0 && existingCaseIds.size === 0) {
      const casesToAdd = pastProjects.filter((p) => !existingCaseIds.has(p.id)).slice(0, 3);
      if (casesToAdd.length > 0) {
        const inserts = casesToAdd.map((p, i) => ({
          proposal_id: proposalId,
          past_project_id: p.id,
          order_index: i + 1,
        }));
        await supabase.from("proposal_case_studies").insert(inserts);
        casesAdded = casesToAdd.length;
      }
    }

    // Update proposal metadata with review state + content gaps
    const sectionReviews: Record<string, boolean> = {};
    for (const section of sections) {
      if (section.is_enabled) {
        sectionReviews[section.id] = false;
      }
    }

    // Extract requirement mappings from generated HTML marks
    let requirementMappings = extractMappings(parsed.sections);
    const notes = parsed.requirement_notes || {};
    for (const mapping of requirementMappings) {
      mapping.note = notes[mapping.req_id] || "";
    }

    // Fallback: if no marks were found in HTML but AI listed requirements_addressed,
    // create synthetic mappings so the panel still shows green/orange cards
    if (requirementMappings.length === 0 && parsed.requirements_addressed?.length > 0) {
      console.log(`[populate] No mark tags found in HTML — creating fallback mappings from requirements_addressed (${parsed.requirements_addressed.length} items)`);
      const mappedIds = new Set<string>();
      for (const reqId of parsed.requirements_addressed) {
        if (mappedIds.has(reqId)) continue;
        mappedIds.add(reqId);
        const req = rfpRequirements.find((r) => r.id === reqId);
        requirementMappings.push({
          req_id: reqId,
          section_slug: req?.section_slug || "introduction",
          field: "body",
          req_type: "addressed",
          note: notes[reqId] || "",
        });
      }
      // Also add any from requirement_notes that weren't in requirements_addressed (likely needs_input)
      for (const [reqId, note] of Object.entries(notes)) {
        if (mappedIds.has(reqId)) continue;
        mappedIds.add(reqId);
        const req = rfpRequirements.find((r) => r.id === reqId);
        requirementMappings.push({
          req_id: reqId,
          section_slug: req?.section_slug || "introduction",
          field: "body",
          req_type: "needs_input",
          note,
        });
      }
    }

    // Normalize IDs: strip "req_" prefix, convert to string for consistent comparison
    const normalizeId = (id: unknown) => String(id).replace(/^req_/, "");

    // Only fully addressed mappings count as auto_filled — needs_input ones stay unchecked
    const fullyAddressedIds = new Set(
      requirementMappings.filter((m) => m.req_type === "addressed").map((m) => normalizeId(m.req_id))
    );
    // Also include any from the AI's explicit list as fallback, but exclude needs_input mapped ones
    const needsInputIds = new Set(
      requirementMappings.filter((m) => m.req_type === "needs_input").map((m) => normalizeId(m.req_id))
    );
    const addressedIds = new Set([
      ...fullyAddressedIds,
      ...(parsed.requirements_addressed || []).map((id: string) => normalizeId(id)).filter((id: string) => !needsInputIds.has(id)),
    ]);
    const updatedReqs = rfpRequirements.map((r) =>
      addressedIds.has(normalizeId(r.id)) ? { ...r, auto_filled: true } : r
    );

    // Build mark text snapshots for auto-detection of human edits
    const markSnapshots: Record<string, string> = {};
    const markTextRegex = /<mark\s+[^>]*data-req-id="([^"]+)"[^>]*>([\s\S]*?)<\/mark>/g;
    const stripHtmlRegex = /<[^>]+>/g;
    for (const [, sectionContent] of Object.entries(parsed.sections)) {
      for (const [, html] of Object.entries(sectionContent as Record<string, string>)) {
        if (typeof html !== "string") continue;
        markTextRegex.lastIndex = 0;
        let mt;
        while ((mt = markTextRegex.exec(html)) !== null) {
          const reqId = normalizeId(mt[1]);
          const text = mt[2].replace(stripHtmlRegex, "").trim();
          if (text && !markSnapshots[reqId]) markSnapshots[reqId] = text;
        }
      }
    }
    console.log(`[populate] ${Object.keys(markSnapshots).length} mark snapshots stored`);

    const updatedMetadata = {
      ...meta,
      ai_populated: true,
      section_reviews: sectionReviews,
      content_gaps: parsed.content_gaps || [],
      rfp_requirements: updatedReqs,
      requirement_mappings: requirementMappings,
      mark_snapshots: markSnapshots,
    } as unknown as Json;

    await supabase
      .from("proposals")
      .update({ metadata: updatedMetadata })
      .eq("id", proposalId);

    return NextResponse.json({
      success: true,
      sections_populated: sectionsPop,
      content_gaps: parsed.content_gaps || [],
      team_added: teamAdded,
      references_added: refsAdded,
      case_studies_added: casesAdded,
    });
  } catch (err) {
    console.error("Populate proposal error:", err);
    return NextResponse.json({ error: "Content generation failed" }, { status: 500 });
  }
}
