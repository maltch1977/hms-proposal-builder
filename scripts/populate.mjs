/**
 * Standalone script to populate a proposal with AI-generated content.
 * Bypasses the Next.js dev server entirely — runs via Node directly.
 *
 * Usage: node scripts/populate.mjs <proposalId>
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const PROPOSAL_ID = process.argv[2];
if (!PROPOSAL_ID) {
  console.error("Usage: node scripts/populate.mjs <proposalId>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // bypass RLS
);

// Use curl with streaming to work around connection drops on long requests
async function callAnthropic(systemPrompt, userPrompt) {
  const { execSync } = await import("child_process");
  const { writeFileSync, unlinkSync, readFileSync } = await import("fs");
  const body = JSON.stringify({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 12000,
    temperature: 0.4,
    stream: true,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const tmpFile = "/tmp/anthropic_request.json";
  const outFile = "/tmp/anthropic_response_stream.txt";
  writeFileSync(tmpFile, body);
  execSync(`curl -s --http1.1 --max-time 300 https://api.anthropic.com/v1/messages \
    -H "x-api-key: ${process.env.ANTHROPIC_API_KEY}" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d @${tmpFile} -o ${outFile}`, { maxBuffer: 50 * 1024 * 1024 });
  unlinkSync(tmpFile);
  // Parse SSE stream to extract text deltas
  const raw = readFileSync(outFile, "utf-8");
  // Save raw response for debugging
  writeFileSync("/tmp/anthropic_response_raw.txt", raw);
  unlinkSync(outFile);
  let fullText = "";
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const jsonStr = line.slice(6).trim();
    if (jsonStr === "[DONE]") break;
    try {
      const evt = JSON.parse(jsonStr);
      if (evt.type === "content_block_delta" && evt.delta?.text) {
        fullText += evt.delta.text;
      }
      if (evt.type === "error") {
        throw new Error(`API error: ${evt.error?.message || JSON.stringify(evt)}`);
      }
    } catch (e) {
      if (e.message.startsWith("API error")) throw e;
      // skip unparseable lines
    }
  }
  return fullText;
}

// --- Prompts (inlined from src/lib/ai/prompts.ts) ---

const WRITING_STYLE = `
Writing Style Rules (MANDATORY — apply to ALL generated text):

BANNED PUNCTUATION:
- No en dashes (–) or em dashes (—). Use commas, periods, or parentheses instead.

BANNED WORDS AND PHRASES — never use these:
leverage, utilize, robust, comprehensive, streamline, cutting-edge, state-of-the-art,
seamless, seamlessly, furthermore, moreover, additionally, delve, delving, holistic,
multifaceted, innovative, transformative, game-changing, pivotal, synergy, paradigm,
landscape (metaphorical), foster, empower, spearhead, champion (as verb), ecosystem,
touchpoint, world-class, best-in-class, rest assured, moving forward, in order to,
it's worth noting, it's important to note, in today's, at the end of the day,
a wide range of, play a crucial role, navigate (metaphorical), unlock (metaphorical),
drive (as in "drive results"), harness, underscores, facilitates, bolster

REPLACEMENTS:
- "leverage" or "utilize" → "use"
- "in order to" → "to"
- "a wide range of" → "many" or be specific
- "comprehensive" → be specific about what's included
- "robust" → "strong" or "reliable" or be specific
- "innovative" → describe the actual innovation
- "ensure" → "make sure" or rewrite to be direct

STYLE:
- Write in active voice. Avoid passive constructions.
- Short, direct sentences. No filler or throat-clearing openers.
- Don't start consecutive paragraphs with the same word.
- Use plain, confident language — write like a senior project manager, not a marketing brochure.
- Be specific. Replace vague claims with concrete details.
- No exclamation marks.
`;

const HMS_CONTEXT = `HMS Commercial Service, Inc. is a commercial HVAC and mechanical contractor specializing in:
- Building automation systems (BAS/DDC)
- HVAC controls installation and upgrades
- Mechanical service and maintenance
- Energy management solutions
- Commissioning services
- Distech Controls products

They serve commercial buildings including hospitals, laboratories, offices, schools, universities, government buildings, industrial facilities, and data centers. Their proposals typically respond to RFPs for construction, retrofit, DDC upgrade, service contract, and design-build projects.`;

const SYSTEM_PROMPT = `You are a professional proposal writer for HMS Commercial Service, Inc., a commercial HVAC/mechanical contractor.

${HMS_CONTEXT}
${WRITING_STYLE}

You will receive:
1. A list of RFP requirements grouped by proposal section
2. Voice/style samples from the company's library defaults (use these to match tone and style)
3. Project context (client name, project name, address)

Generate tailored HTML content for each of these narrative sections:
- introduction: Letter of interest / introduction (field: "body")
- firm_background: Company background & relevant experience (field: "narrative")
- site_logistics: Site logistics, safety plan, EMR discussion (field: "body")
- qaqc_commissioning: Three separate fields — "quality_assurance", "quality_control", "commissioning"
- closeout: Project closeout procedures (field: "body")
- executive_summary: Compelling executive summary (field: "body")

Guidelines:
- Write 300-600 words per section (each QA/QC/Cx field: 150-300 words)
- Use clean HTML: <p>, <h3>, <ul>/<ol>, <li>, <strong>, <em> only
- Address specific RFP requirements in relevant sections
- Reference the client name and project naturally
- Write in confident, active voice — no filler or hedging
- Be specific to HVAC/mechanical/controls work, not generic construction
- Match the voice samples' tone if provided; otherwise use professional proposal tone
- Mark [PLACEHOLDER: description] for any specific details you cannot know (e.g., exact team member names, specific past project details, pricing)

IMPORTANT — Requirement Inline Markers:
When your text addresses a specific RFP requirement, wrap the most relevant 1-2 sentences in a <mark> tag:
- Fully addressed: <mark data-req-id="req_X" data-req-type="addressed">...text...</mark>
- Partial / has placeholders: <mark data-req-id="req_X" data-req-type="needs_input">...text...</mark>
Rules for marks:
- Use at most ONE mark per requirement ID — choose the single best location
- Do NOT nest <mark> tags inside each other
- Keep each mark on 1-2 sentences maximum
- The data-req-id must match the requirement's [req_X] ID from the requirements list

IMPORTANT — Requirement Notes:
For EVERY requirement you mark with a <mark> tag, include an entry in "requirement_notes".
- For "addressed": briefly describe what you wrote (e.g., "Included company legal name, Portland OR address, and 45-employee headcount")
- For "needs_input": write a clear action item telling the user exactly what they need to provide. Start with a verb: "Add:", "Update:", "Confirm:", "Provide:" — e.g., "Add: total number of years in business", "Provide: specific project manager name for this project", "Update: replace placeholder EMR rate with current year's rate"
- Keep each note to 1 sentence, be specific and actionable

Also identify content gaps — things the RFP requires that you cannot generate without human input.

Return ONLY a JSON object (no markdown fences) with this structure:
{
  "sections": {
    "introduction": { "body": "<html>" },
    "firm_background": { "narrative": "<html>" },
    "site_logistics": { "body": "<html>" },
    "qaqc_commissioning": { "quality_assurance": "<html>", "quality_control": "<html>", "commissioning": "<html>" },
    "closeout": { "body": "<html>" },
    "executive_summary": { "body": "<html>" }
  },
  "content_gaps": [
    { "section_slug": "...", "field": "...", "reason": "...", "requirement_ids": ["..."] }
  ],
  "requirements_addressed": ["req_id_1", "req_id_2"],
  "requirement_notes": {
    "req_id_1": "Short description of what was done or what's needed",
    "req_id_2": "..."
  }
}`;

// --- Helpers ---

function extractVoiceSample(html, maxWords = 200) {
  if (!html) return "";
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.split(" ").slice(0, maxWords).join(" ");
}

function extractMappings(sections) {
  const mappings = [];
  const markRegex = /<mark\s+(?=[^>]*data-req-id="([^"]+)")(?=[^>]*data-req-type="([^"]+)")[^>]*>/g;
  const sectionFields = {
    introduction: ["body"],
    firm_background: ["narrative"],
    site_logistics: ["body"],
    qaqc_commissioning: ["quality_assurance", "quality_control", "commissioning"],
    closeout: ["body"],
    executive_summary: ["body"],
  };
  for (const [slug, fields] of Object.entries(sectionFields)) {
    const sectionContent = sections[slug];
    if (!sectionContent) continue;
    for (const field of fields) {
      const html = sectionContent[field];
      if (!html) continue;
      markRegex.lastIndex = 0;
      let match;
      while ((match = markRegex.exec(html)) !== null) {
        mappings.push({ req_id: match[1], section_slug: slug, field, req_type: match[2], note: "" });
      }
    }
  }
  return mappings;
}

function stripCodeFences(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:\w+)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned;
}

// --- Main ---

async function main() {
  console.log(`[populate] Starting for proposal ${PROPOSAL_ID}`);

  // Fetch proposal
  const { data: proposal, error: pErr } = await supabase
    .from("proposals").select("*").eq("id", PROPOSAL_ID).single();
  if (pErr || !proposal) { console.error("Proposal not found:", pErr); process.exit(1); }
  console.log(`[populate] Proposal: "${proposal.title}" for ${proposal.client_name}`);

  const meta = proposal.metadata || {};
  const rfpRequirements = meta.rfp_requirements || [];
  console.log(`[populate] ${rfpRequirements.length} RFP requirements found`);

  // Fetch sections
  const { data: sections } = await supabase
    .from("proposal_sections")
    .select("id, section_type_id, content, is_enabled, library_item_id, section_types!inner(slug, display_name)")
    .eq("proposal_id", PROPOSAL_ID)
    .order("order_index");
  if (!sections?.length) { console.error("No sections found"); process.exit(1); }
  console.log(`[populate] ${sections.length} sections loaded`);

  // Fetch org
  const { data: org } = await supabase
    .from("organizations").select("*").eq("id", proposal.organization_id || meta.organization_id).single();

  // Fetch library voice samples
  const orgId = org?.id || proposal.organization_id || meta.organization_id;
  const { data: libraryItems } = await supabase
    .from("library_items")
    .select("content, section_type_id, section_types!inner(slug)")
    .eq("organization_id", orgId)
    .eq("is_default", true);

  const voiceSamples = {};
  if (libraryItems) {
    for (const item of libraryItems) {
      const slug = item.section_types.slug;
      const content = item.content || {};
      const sample = ["body", "narrative", "quality_assurance", "quality_control", "commissioning"]
        .map(f => extractVoiceSample(content[f])).filter(Boolean).join(" ");
      if (sample) voiceSamples[slug] = sample;
    }
  }

  // Group requirements by section
  const reqsBySection = {};
  for (const req of rfpRequirements) {
    if (!reqsBySection[req.section_slug]) reqsBySection[req.section_slug] = [];
    reqsBySection[req.section_slug].push(req);
  }

  // Build prompt
  const narrativeSlugs = ["introduction", "firm_background", "site_logistics", "qaqc_commissioning", "closeout", "executive_summary"];
  let userPrompt = `Project: "${proposal.title}"\nClient: ${proposal.client_name}\nAddress: ${proposal.client_address || "Not specified"}\n\n`;

  if (org) {
    userPrompt += "## Company Profile\n";
    const companyName = org.company_name || org.name;
    if (companyName) userPrompt += `Company Name: ${companyName}\n`;
    if (org.company_address) userPrompt += `Address: ${org.company_address}\n`;
    if (org.company_phone) userPrompt += `Phone: ${org.company_phone}\n`;
    if (org.company_email) userPrompt += `Email: ${org.company_email}\n`;
    if (org.company_website) userPrompt += `Website: ${org.company_website}\n`;
    const cfg = org.theme_config || {};
    if (cfg.company_fax) userPrompt += `Fax: ${cfg.company_fax}\n`;
    if (cfg.company_license_number) userPrompt += `License: ${cfg.company_license_number}\n`;
    if (cfg.company_description) userPrompt += `Description: ${cfg.company_description}\n`;
    userPrompt += "\nUse this company information directly in the content — do NOT use placeholders for company name, address, phone, etc.\n\n";
  }

  userPrompt += "## RFP Requirements by Section\n\n";
  for (const slug of narrativeSlugs) {
    const reqs = reqsBySection[slug] || [];
    userPrompt += `### ${slug}\n`;
    if (reqs.length > 0) {
      for (const r of reqs) userPrompt += `- [${r.id}] ${r.description}${r.is_mandatory ? " (MANDATORY)" : ""}\n`;
    } else {
      userPrompt += "- No specific requirements\n";
    }
    userPrompt += "\n";
  }

  const otherReqs = rfpRequirements.filter(r => !narrativeSlugs.includes(r.section_slug));
  if (otherReqs.length > 0) {
    userPrompt += "### Other requirements (reference where appropriate)\n";
    for (const r of otherReqs) userPrompt += `- [${r.id}] (${r.section_slug}) ${r.description}\n`;
    userPrompt += "\n";
  }

  userPrompt += "## Voice/Style Samples\n\n";
  for (const slug of narrativeSlugs) {
    const sample = voiceSamples[slug];
    if (sample) userPrompt += `### ${slug}\n${sample}\n\n`;
  }
  userPrompt += "Generate content for all narrative sections now.";

  console.log(`[populate] Calling Anthropic API (claude-sonnet-4-5) via curl...`);
  console.log(`[populate] Prompt length: ${userPrompt.length} chars`);

  const result = await callAnthropic(SYSTEM_PROMPT, userPrompt);
  console.log(`[populate] AI response received (${result.length} chars)`);

  let parsed;
  try {
    parsed = JSON.parse(stripCodeFences(result));
    const markCount = (JSON.stringify(parsed.sections).match(/<mark\s/g) || []).length;
    console.log(`[populate] Sections: ${Object.keys(parsed.sections).length}, Marks: ${markCount}, Notes: ${Object.keys(parsed.requirement_notes || {}).length}`);
  } catch (e) {
    console.error("[populate] Failed to parse AI response:", result.substring(0, 500));
    process.exit(1);
  }

  // Update sections using curl to bypass Node socket issues
  const { execSync: exec2 } = await import("child_process");
  const { writeFileSync: write2 } = await import("fs");
  const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  function sbPatch(table, id, body) {
    const tmp = `/tmp/sb_patch_${Date.now()}.json`;
    write2(tmp, JSON.stringify(body));
    try {
      exec2(`curl -s -o /dev/null -w "%{http_code}" -X PATCH "${SB_URL}/rest/v1/${table}?id=eq.${id}" \
        -H "apikey: ${SB_KEY}" -H "Authorization: Bearer ${SB_KEY}" \
        -H "Content-Type: application/json" -H "Prefer: return=minimal" \
        -d @${tmp}`, { maxBuffer: 10 * 1024 * 1024 });
      return null;
    } catch (e) { return e.message; }
  }

  function sbInsert(table, body) {
    const tmp = `/tmp/sb_insert_${Date.now()}.json`;
    write2(tmp, JSON.stringify(body));
    try {
      exec2(`curl -s -o /dev/null -w "%{http_code}" -X POST "${SB_URL}/rest/v1/${table}" \
        -H "apikey: ${SB_KEY}" -H "Authorization: Bearer ${SB_KEY}" \
        -H "Content-Type: application/json" -H "Prefer: return=minimal" \
        -d @${tmp}`, { maxBuffer: 10 * 1024 * 1024 });
      return null;
    } catch (e) { return e.message; }
  }

  const contentFieldsBySlug = {
    introduction: ["body"],
    firm_background: ["narrative"],
    site_logistics: ["body"],
    qaqc_commissioning: ["quality_assurance", "quality_control", "commissioning"],
    closeout: ["body"],
    executive_summary: ["body"],
  };

  const sectionsPop = [];
  for (const section of sections) {
    const slug = section.section_types.slug;
    const generated = parsed.sections[slug];
    if (!generated) continue;

    const existingContent = section.content || {};
    const newContent = { ...existingContent, ...generated };

    const err = sbPatch("proposal_sections", section.id, { content: newContent });
    if (err) console.error(`[populate] Error updating ${slug}:`, err);
    else console.log(`[populate] Updated section: ${slug}`);

    // Record AI changes
    const fields = contentFieldsBySlug[slug] || [];
    for (const field of fields) {
      const newVal = newContent[field] || "";
      if (newVal) {
        sbInsert("proposal_changes", {
          proposal_id: PROPOSAL_ID,
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

  // Extract requirement mappings
  let requirementMappings = extractMappings(parsed.sections);
  const notes = parsed.requirement_notes || {};
  for (const m of requirementMappings) m.note = notes[m.req_id] || "";

  if (requirementMappings.length === 0 && parsed.requirements_addressed?.length > 0) {
    console.log(`[populate] No marks in HTML, creating fallback mappings from requirements_addressed`);
    const mappedIds = new Set();
    for (const reqId of parsed.requirements_addressed) {
      if (mappedIds.has(reqId)) continue;
      mappedIds.add(reqId);
      const req = rfpRequirements.find(r => r.id === reqId);
      requirementMappings.push({ req_id: reqId, section_slug: req?.section_slug || "introduction", field: "body", req_type: "addressed", note: notes[reqId] || "" });
    }
    for (const [reqId, note] of Object.entries(notes)) {
      if (mappedIds.has(reqId)) continue;
      mappedIds.add(reqId);
      const req = rfpRequirements.find(r => r.id === reqId);
      requirementMappings.push({ req_id: reqId, section_slug: req?.section_slug || "introduction", field: "body", req_type: "needs_input", note });
    }
  }

  console.log(`[populate] ${requirementMappings.length} requirement mappings`);

  // Update proposal metadata
  const normalizeId = id => String(id).replace(/^req_/, "");
  const fullyAddressedIds = new Set(requirementMappings.filter(m => m.req_type === "addressed").map(m => normalizeId(m.req_id)));
  const needsInputIds = new Set(requirementMappings.filter(m => m.req_type === "needs_input").map(m => normalizeId(m.req_id)));
  const addressedIds = new Set([
    ...fullyAddressedIds,
    ...(parsed.requirements_addressed || []).map(normalizeId).filter(id => !needsInputIds.has(id)),
  ]);

  const sectionReviews = {};
  for (const section of sections) {
    if (section.is_enabled) sectionReviews[section.id] = false;
  }

  // Build mark text snapshots for auto-detection of human edits
  const markSnapshots = {};
  const markTextRegex = /<mark\s+[^>]*data-req-id="([^"]+)"[^>]*>(.*?)<\/mark>/gs;
  const stripHtmlRegex = /<[^>]+>/g;
  for (const [slug, generated] of Object.entries(parsed.sections)) {
    for (const [field, html] of Object.entries(generated)) {
      if (typeof html !== "string") continue;
      markTextRegex.lastIndex = 0;
      let m;
      while ((m = markTextRegex.exec(html)) !== null) {
        const reqId = normalizeId(m[1]);
        const text = m[2].replace(stripHtmlRegex, "").trim();
        if (text && !markSnapshots[reqId]) markSnapshots[reqId] = text;
      }
    }
  }
  console.log(`[populate] ${Object.keys(markSnapshots).length} mark snapshots stored`);

  const updatedReqs = rfpRequirements.map(r => addressedIds.has(normalizeId(r.id)) ? { ...r, auto_filled: true } : r);
  const updatedMetadata = {
    ...meta,
    ai_populated: true,
    section_reviews: sectionReviews,
    content_gaps: parsed.content_gaps || [],
    rfp_requirements: updatedReqs,
    requirement_mappings: requirementMappings,
    mark_snapshots: markSnapshots,
  };

  const metaErr = sbPatch("proposals", PROPOSAL_ID, { metadata: updatedMetadata });
  if (metaErr) console.error("[populate] Error updating metadata:", metaErr);

  console.log(`\n[populate] DONE!`);
  console.log(`  Sections populated: ${sectionsPop.join(", ")}`);
  console.log(`  Requirements mapped: ${requirementMappings.length}`);
  console.log(`  Content gaps: ${(parsed.content_gaps || []).length}`);
}

main().catch(err => { console.error("Fatal error:", err); process.exit(1); });
