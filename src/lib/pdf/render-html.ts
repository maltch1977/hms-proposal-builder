import { readFile } from "fs/promises";
import path from "path";
import type {
  ProposalDocumentData,
  PersonnelEntry,
  CaseStudyEntry,
  ReferenceEntry,
  EmrEntry,
} from "./types";
import type { PricingColumn, PricingRow } from "@/lib/types/section";

// ─── Brand Colors ────────────────────────────────────────────
const C = {
  navy: "#1B365D",
  blue: "#2B5797",
  gold: "#C9A227",
  white: "#FFFFFF",
  bodyText: "#333333",
  lightGray: "#F5F5F5",
  mediumGray: "#E0E0E0",
  darkGray: "#666666",
};

// ─── Font Embedding ──────────────────────────────────────────
let fontBase64Cache: string | null = null;

async function getFontBase64(): Promise<string> {
  if (fontBase64Cache) return fontBase64Cache;
  const fontPath = path.join(process.cwd(), "public/fonts/Inter-Variable.woff2");
  const buffer = await readFile(fontPath);
  fontBase64Cache = buffer.toString("base64");
  return fontBase64Cache;
}

function fontFaceCSS(base64: string): string {
  return `
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url(data:font/woff2;base64,${base64}) format('woff2');
    }
  `;
}

// ─── Shared CSS ──────────────────────────────────────────────
const sharedCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 10.5pt;
    color: ${C.bodyText};
    line-height: 1.65;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Page break control */
  section.pdf-section { break-before: page; }
  section.pdf-section:first-child { break-before: auto; }
  h2, h3, .section-title-bar { break-after: avoid; }
  .data-table, .personnel-card, .phase-card, .case-study-card { break-inside: avoid; }
  p { orphans: 3; widows: 3; }

  /* Section title bar */
  .section-title-bar {
    background: ${C.navy};
    color: ${C.white};
    font-size: 14pt;
    font-weight: 700;
    padding: 8px 14px;
    margin-bottom: 16px;
  }

  /* Subsection title */
  .subsection-title {
    font-size: 11pt;
    font-weight: 700;
    color: ${C.navy};
    margin-bottom: 8px;
    margin-top: 14px;
  }

  /* Gold accent bar */
  .gold-accent {
    width: 40px;
    border-bottom: 2px solid ${C.gold};
    margin-bottom: 12px;
  }

  /* TipTap HTML passthrough styles */
  .tiptap-content h2 {
    font-size: 13pt;
    font-weight: 700;
    color: ${C.navy};
    margin-top: 14px;
    margin-bottom: 6px;
  }
  .tiptap-content h3 {
    font-size: 11pt;
    font-weight: 700;
    color: ${C.navy};
    margin-top: 10px;
    margin-bottom: 4px;
  }
  .tiptap-content p {
    margin-bottom: 6px;
    line-height: 1.65;
  }
  .tiptap-content ul, .tiptap-content ol {
    margin-left: 18px;
    margin-bottom: 6px;
  }
  .tiptap-content li {
    margin-bottom: 2px;
  }
  .tiptap-content blockquote {
    border-left: 3px solid ${C.mediumGray};
    padding-left: 12px;
    margin: 8px 0;
    color: ${C.darkGray};
  }
  .tiptap-content hr {
    border: none;
    border-top: 1px solid ${C.mediumGray};
    margin: 12px 0;
  }

  /* Tables */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
  }
  .data-table thead th {
    background: ${C.navy};
    color: ${C.white};
    font-size: 9pt;
    font-weight: 700;
    padding: 6px 8px;
    text-align: left;
  }
  .data-table tbody td {
    font-size: 9pt;
    padding: 5px 8px;
    border-bottom: 0.5px solid ${C.mediumGray};
    color: ${C.bodyText};
  }
  .data-table tbody tr:nth-child(even) {
    background: ${C.lightGray};
  }
  .data-table .totals-row td {
    background: ${C.navy};
    color: ${C.white};
    font-weight: 700;
    font-size: 11pt;
    padding: 8px;
  }

  /* Cards */
  .case-study-card {
    margin-bottom: 10px;
    padding: 8px;
    border: 0.5px solid ${C.mediumGray};
    border-left: 3px solid ${C.gold};
    border-radius: 2px;
  }
  .case-study-card .cs-name {
    font-size: 10pt;
    font-weight: 700;
    color: ${C.navy};
  }
  .case-study-card .cs-meta {
    font-size: 9pt;
    color: ${C.darkGray};
    margin-top: 2px;
  }
  .case-study-card .cs-narrative {
    font-size: 9pt;
    margin-top: 4px;
    line-height: 1.5;
  }

  .personnel-card {
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 0.5px solid ${C.mediumGray};
  }
  .personnel-card:last-child { border-bottom: none; }
  .personnel-card .p-name {
    font-size: 10pt;
    font-weight: 700;
    color: ${C.navy};
  }
  .personnel-card .p-role {
    font-size: 9pt;
    color: ${C.darkGray};
    margin-top: 1px;
  }
  .personnel-card .p-stats {
    font-size: 8pt;
    color: ${C.darkGray};
    margin-top: 3px;
  }
  .personnel-card .p-certs {
    font-size: 8pt;
    color: ${C.darkGray};
    margin-top: 2px;
  }
  .personnel-card .p-bio {
    margin-top: 4px;
  }

  .phase-card {
    margin-bottom: 8px;
    padding: 8px;
    border: 0.5px solid ${C.mediumGray};
    border-radius: 2px;
  }
  .phase-card .ph-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .phase-card .ph-name {
    font-size: 10pt;
    font-weight: 700;
  }
  .phase-card .ph-duration {
    font-size: 9pt;
    color: ${C.darkGray};
  }
  .phase-card .ph-desc {
    font-size: 9pt;
    line-height: 1.4;
    margin-bottom: 4px;
  }
  .phase-card .ph-milestones {
    margin-left: 12px;
    font-size: 9pt;
    color: ${C.darkGray};
    list-style-type: disc;
  }

  .org-chart-image {
    text-align: center;
    margin-bottom: 16px;
  }
  .org-chart-image img {
    max-width: 100%;
    max-height: 300px;
    object-fit: contain;
  }

  /* Divider */
  .divider {
    border-top: 1px solid ${C.mediumGray};
    margin: 12px 0;
  }

  /* Utility */
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }
  .text-sm { font-size: 9pt; }
  .text-xs { font-size: 8pt; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 12px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-3 { margin-bottom: 12px; }
`;

// ─── Helper: wrap HTML in a full document ────────────────────
function wrapHtml(body: string, fontBase64: string, extraCSS = ""): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${fontFaceCSS(fontBase64)}
    ${sharedCSS}
    ${extraCSS}
  </style>
</head>
<body>${body}</body>
</html>`;
}

// ─── Escape HTML ─────────────────────────────────────────────
function esc(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  COVER PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function renderCoverHtml(
  data: ProposalDocumentData,
  images: { logoBase64: string; coverPhotoBase64: string }
): Promise<string> {
  const fontBase64 = await getFontBase64();
  const coverCSS = `
    @page { margin: 0; size: letter; }
    html, body { width: 100%; height: 100%; }
  `;

  const isPhoto = data.coverTemplate === "photo" && images.coverPhotoBase64;

  let body: string;
  if (isPhoto) {
    body = `
      <div style="
        position: relative;
        width: 100%;
        height: 100vh;
        overflow: hidden;
      ">
        <img src="${images.coverPhotoBase64}" style="
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
        " />
        <div style="
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(27, 54, 93, 0.75);
        "></div>
        <div style="
          position: relative;
          display: flex; flex-direction: column; justify-content: center;
          height: 100%;
          padding: 0 72px;
        ">
          ${images.logoBase64 ? `<img src="${images.logoBase64}" style="width: 80px; height: 80px; object-fit: contain; margin-bottom: 24px;" />` : ""}
          <div style="font-size: 10pt; font-weight: 700; color: ${C.gold}; letter-spacing: 3px; margin-bottom: 8px;">
            ${esc(data.projectLabel) || "RESPONSE TO RFP"}
          </div>
          <div style="font-size: 28pt; font-weight: 700; color: ${C.white}; margin-bottom: 12px; line-height: 1.15;">
            ${esc(data.title)}
          </div>
          <div style="width: 60px; border-bottom: 3px solid ${C.gold}; margin-bottom: 16px;"></div>
          <div style="font-size: 14pt; color: ${C.white};">
            ${esc(data.clientName)}
          </div>
          ${data.clientAddress ? `<div style="font-size: 10pt; color: rgba(255,255,255,0.8); margin-top: 4px;">${esc(data.clientAddress)}</div>` : ""}
        </div>
        <div style="
          position: absolute; bottom: 36px; left: 72px; right: 72px;
        ">
          <div style="font-size: 9pt; color: rgba(255,255,255,0.7);">
            ${esc(data.companyName) || "HMS Commercial Service, Inc."}
          </div>
          ${(data.companyAddress || data.companyPhone) ? `
            <div style="font-size: 8pt; color: rgba(255,255,255,0.5); margin-top: 2px;">
              ${[data.companyAddress, data.companyPhone, data.companyEmail].filter(Boolean).join("  |  ")}
            </div>
          ` : ""}
        </div>
      </div>
    `;
  } else {
    body = `
      <div style="
        width: 100%; height: 100vh;
        padding: 72px;
        display: flex; flex-direction: column; justify-content: space-between;
      ">
        <div>
          ${images.logoBase64 ? `<img src="${images.logoBase64}" style="width: 72px; height: 72px; object-fit: contain; margin-bottom: 36px;" />` : ""}
          <div style="font-size: 10pt; font-weight: 700; color: ${C.gold}; letter-spacing: 3px; margin-bottom: 8px;">
            ${esc(data.projectLabel) || "RESPONSE TO RFP"}
          </div>
          <div style="font-size: 30pt; font-weight: 700; color: ${C.navy}; margin-bottom: 16px; line-height: 1.15;">
            ${esc(data.title)}
          </div>
          <div style="width: 60px; border-bottom: 3px solid ${C.gold}; margin-bottom: 20px;"></div>
          <div style="font-size: 14pt; color: ${C.bodyText};">
            Prepared for: ${esc(data.clientName)}
          </div>
          ${data.clientAddress ? `<div style="font-size: 10pt; color: ${C.darkGray}; margin-top: 4px;">${esc(data.clientAddress)}</div>` : ""}
        </div>
        <div style="border-top: 1px solid ${C.mediumGray}; padding-top: 12px;">
          <div style="font-size: 10pt; font-weight: 700; color: ${C.navy};">
            ${esc(data.companyName) || "HMS Commercial Service, Inc."}
          </div>
          ${data.companyAddress ? `<div style="font-size: 9pt; color: ${C.darkGray}; margin-top: 2px;">${esc(data.companyAddress)}</div>` : ""}
          ${data.companyPhone ? `<div style="font-size: 9pt; color: ${C.darkGray}; margin-top: 1px;">${esc(data.companyPhone)}</div>` : ""}
          ${data.companyEmail ? `<div style="font-size: 9pt; color: ${C.darkGray}; margin-top: 1px;">${esc(data.companyEmail)}</div>` : ""}
          ${data.companyWebsite ? `<div style="font-size: 9pt; color: ${C.darkGray}; margin-top: 1px;">${esc(data.companyWebsite)}</div>` : ""}
        </div>
      </div>
    `;
  }

  return wrapHtml(body, fontBase64, coverCSS);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BODY PAGES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function renderBodyHtml(
  data: ProposalDocumentData,
  images: { logoBase64: string; orgChartBase64: string }
): Promise<string> {
  const fontBase64 = await getFontBase64();
  const enabledSections = data.sections.filter((s) => s.isEnabled);
  const bodySections = enabledSections.filter((s) => s.slug !== "cover_page");

  const tocEntries = enabledSections
    .filter((s) => s.slug !== "cover_page" && s.slug !== "table_of_contents")
    .map((s) => ({ slug: s.slug, title: s.displayName }));

  const sectionHtmls: string[] = [];

  for (const section of bodySections) {
    const html = renderSection(section, data, images, tocEntries);
    if (html) sectionHtmls.push(html);
  }

  const bodyCSS = `
    @page {
      size: letter;
      margin: 72pt 54pt 60pt 54pt;
    }
  `;

  return wrapHtml(sectionHtmls.join("\n"), fontBase64, bodyCSS);
}

// ─── Section Router ──────────────────────────────────────────
function renderSection(
  section: { slug: string; displayName: string; content: Record<string, unknown> },
  data: ProposalDocumentData,
  images: { logoBase64: string; orgChartBase64: string },
  tocEntries: { slug: string; title: string }[]
): string | null {
  switch (section.slug) {
    case "table_of_contents":
      return renderTocSection(section.slug, tocEntries);
    case "introduction":
      return renderHtmlContentSection(section.slug, "Introduction", (section.content.body as string) || "");
    case "executive_summary":
      return renderHtmlContentSection(section.slug, "Executive Summary", (section.content.body as string) || "");
    case "closeout":
      return renderHtmlContentSection(section.slug, "Closeout", (section.content.body as string) || "");
    case "firm_background":
      return renderFirmBackgroundSection(section.slug, section, data.caseStudies);
    case "key_personnel":
      return renderKeyPersonnelSection(section.slug, section, data.personnel, images.orgChartBase64);
    case "project_schedule":
      return renderProjectScheduleSection(section.slug, section);
    case "site_logistics":
      return renderSiteLogisticsSection(section.slug, section, data.emrRatings);
    case "qaqc_commissioning":
      return renderQaqcSection(section.slug, section);
    case "reference_check":
      return renderReferenceSection(section.slug, data.references);
    case "interview_panel":
      return renderInterviewPanelSection(section.slug, data.personnel);
    case "project_cost":
      return renderProjectCostSection(section.slug, data.costData);
    default:
      return null;
  }
}

// ─── Section Wrapper ─────────────────────────────────────────
function sectionWrap(slug: string, title: string, content: string): string {
  return `<section class="pdf-section" data-slug="${slug}">
    <div class="section-title-bar">${esc(title)}</div>
    ${content}
  </section>`;
}

// ─── Table of Contents ───────────────────────────────────────
function renderTocSection(slug: string, entries: { slug: string; title: string }[]): string {
  const rows = entries
    .map(
      (entry) => `
      <div style="display: flex; align-items: baseline; margin-bottom: 8px;" data-toc-slug="${entry.slug}">
        <span style="flex: 1; font-size: 10pt; color: ${C.bodyText};">${esc(entry.title)}</span>
        <span class="toc-page-num" style="width: 30px; text-align: right; font-size: 10pt; color: ${C.darkGray};">--</span>
      </div>`
    )
    .join("");

  return sectionWrap(
    slug,
    "Table of Contents",
    `
    <div style="font-size: 10pt; font-weight: 700; color: ${C.navy}; letter-spacing: 2px; margin-bottom: 16px;">
      TABLE OF CONTENTS
    </div>
    <div class="gold-accent"></div>
    ${rows}
  `
  );
}

// ─── HTML Content Section (Introduction, Executive Summary, Closeout) ──
function renderHtmlContentSection(slug: string, title: string, html: string): string {
  return sectionWrap(slug, title, `<div class="tiptap-content">${html}</div>`);
}

// ─── Firm Background ─────────────────────────────────────────
function renderFirmBackgroundSection(
  slug: string,
  section: { content: Record<string, unknown> },
  caseStudies: CaseStudyEntry[]
): string {
  const narrative = (section.content.narrative as string) || "";
  let content = `<div class="tiptap-content">${narrative}</div>`;

  if (caseStudies.length > 0) {
    content += `
      <div class="mt-3">
        <div class="subsection-title">Case Studies</div>
        ${caseStudies
          .map(
            (cs) => `
          <div class="case-study-card">
            <div class="cs-name">${esc(cs.projectName)}</div>
            <div class="cs-meta">
              ${esc(cs.clientName)} &mdash; ${esc(cs.buildingType)}${cs.squareFootage ? ` &mdash; ${cs.squareFootage.toLocaleString()} SF` : ""}
            </div>
            ${cs.narrative ? `<div class="cs-narrative">${esc(cs.narrative)}</div>` : ""}
          </div>`
          )
          .join("")}
      </div>
    `;
  }

  return sectionWrap(slug, "Firm Background & Experience", content);
}

// ─── Key Personnel ───────────────────────────────────────────
function renderKeyPersonnelSection(
  slug: string,
  section: { content: Record<string, unknown> },
  personnel: PersonnelEntry[],
  orgChartBase64: string
): string {
  const showOrgChart =
    (section.content.org_chart_mode || "upload") === "upload";

  let content = '<div class="subsection-title">Organization Chart</div>';

  if (showOrgChart && orgChartBase64) {
    content += `
      <div class="org-chart-image">
        <img src="${orgChartBase64}" />
      </div>
    `;
  } else {
    // Text fallback
    content += `<div style="margin-bottom: 16px;">`;
    content += personnel
      .map(
        (p, idx) => `
        <div style="display: flex; align-items: center; margin-bottom: 4px; padding-left: ${idx === 0 ? 0 : 16}px;">
          <span style="
            display: inline-block; width: 6px; height: 6px;
            background: ${idx === 0 ? C.navy : C.blue};
            border-radius: 3px; margin-right: 8px;
          "></span>
          <span style="font-size: 9pt; font-weight: 700;">${esc(p.fullName)}</span>
          <span style="font-size: 9pt; color: ${C.darkGray}; margin-left: 6px;">&mdash; ${esc(p.title)}</span>
        </div>`
      )
      .join("");
    content += `</div>`;
  }

  content += renderPersonnelCards(personnel);
  return sectionWrap(slug, "Key Personnel & Org Chart", content);
}

// ─── Personnel Cards (shared by Key Personnel & Interview Panel) ──
function renderPersonnelCards(personnel: PersonnelEntry[]): string {
  let html = '<div class="subsection-title">Personnel Qualifications</div>';

  html += personnel
    .map((person) => {
      const stats = [
        person.yearsIndustry != null && `Yrs Industry: ${person.yearsIndustry}`,
        person.yearsCompany != null && `Yrs Company: ${person.yearsCompany}`,
        person.yearsWithDistech != null && `Yrs Controls: ${person.yearsWithDistech}`,
      ].filter(Boolean);

      return `
        <div class="personnel-card">
          <div class="p-name">${esc(person.fullName)}</div>
          <div class="p-role">${esc(person.roleType)}</div>
          ${stats.length > 0 ? `<div class="p-stats">${stats.join("  &middot;  ")}</div>` : ""}
          ${
            person.certifications.length > 0 || person.specialties.length > 0
              ? `<div class="p-certs" style="display: flex; gap: 12px; flex-wrap: wrap;">
                  ${person.certifications.length > 0 ? `<span>Certs: ${esc(person.certifications.join(", "))}</span>` : ""}
                  ${person.specialties.length > 0 ? `<span>Specialties: ${esc(person.specialties.join(", "))}</span>` : ""}
                </div>`
              : ""
          }
          ${person.bio ? `<div class="p-bio tiptap-content">${person.bio}</div>` : ""}
        </div>
      `;
    })
    .join("");

  return html;
}

// ─── Project Schedule ────────────────────────────────────────
function renderProjectScheduleSection(slug: string, section: {
  content: Record<string, unknown>;
}): string {
  const outputMode = (section.content.output_mode as string) || "raw";
  const strategy = section.content.execution_strategy as
    | {
        project_duration?: string;
        phases?: Array<{
          name: string;
          duration: string;
          description: string;
          milestones: string[];
        }>;
        critical_path?: string[];
        approach_narrative?: string;
      }
    | undefined;

  const showGantt = outputMode === "raw" || outputMode === "both";
  const showStrategy =
    (outputMode === "ai_only" || outputMode === "both") && strategy;

  let content = "";

  if (showGantt) {
    content += `<div class="tiptap-content"><p>See attached Gantt chart(s).</p></div>`;
  }

  if (showStrategy) {
    if (strategy.project_duration) {
      content += `
        <div style="margin-bottom: 12px;">
          <span style="font-size: 10pt; font-weight: 700; color: ${C.navy};">
            Project Duration: ${esc(strategy.project_duration)}
          </span>
        </div>
      `;
    }

    if (strategy.approach_narrative) {
      content += `
        <div style="margin-bottom: 12px; font-size: 10pt; line-height: 1.5;">
          ${esc(strategy.approach_narrative)}
        </div>
      `;
    }

    if (strategy.phases && strategy.phases.length > 0) {
      content += `<div class="subsection-title">Project Phases</div>`;
      content += strategy.phases
        .map(
          (phase, idx) => `
          <div class="phase-card">
            <div class="ph-header">
              <span class="ph-name">Phase ${idx + 1}: ${esc(phase.name)}</span>
              <span class="ph-duration">${esc(phase.duration)}</span>
            </div>
            ${phase.description ? `<div class="ph-desc">${esc(phase.description)}</div>` : ""}
            ${
              phase.milestones.length > 0
                ? `<ul class="ph-milestones">${phase.milestones.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>`
                : ""
            }
          </div>`
        )
        .join("");
    }

    if (strategy.critical_path && strategy.critical_path.length > 0) {
      content += `
        <div class="subsection-title" style="margin-top: 12px;">Critical Path</div>
        <ul style="margin-left: 12px; font-size: 9pt; line-height: 1.4;">
          ${strategy.critical_path.map((item) => `<li>${esc(item)}</li>`).join("")}
        </ul>
      `;
    }
  }

  return sectionWrap(slug, "Project Schedule", content);
}

// ─── Site Logistics ──────────────────────────────────────────
function renderSiteLogisticsSection(
  slug: string,
  section: { content: Record<string, unknown> },
  emrRatings: EmrEntry[]
): string {
  const body = (section.content.body as string) || "";
  let content = `<div class="tiptap-content">${body}</div>`;

  if (emrRatings.length > 0) {
    const sorted = [...emrRatings].sort((a, b) => a.year - b.year);
    content += `
      <div class="mt-3 subsection-title">Experience Modification Rating (EMR)</div>
      <table class="data-table" style="break-inside: avoid;">
        <thead>
          <tr>${sorted.map((r) => `<th class="text-center">${r.year}</th>`).join("")}</tr>
        </thead>
        <tbody>
          <tr>${sorted.map((r) => `<td class="text-center font-bold">${r.rating.toFixed(2)}</td>`).join("")}</tr>
        </tbody>
      </table>
    `;
  }

  return sectionWrap(slug, "Site Logistics & Safety", content);
}

// ─── QA/QC/Commissioning ─────────────────────────────────────
function renderQaqcSection(slug: string, section: {
  content: Record<string, unknown>;
}): string {
  const qa = (section.content.quality_assurance as string) || "";
  const qc = (section.content.quality_control as string) || "";
  const comm = (section.content.commissioning as string) || "";

  const content = `
    <div class="tiptap-content">${qa}</div>
    <div class="tiptap-content">${qc}</div>
    <div class="tiptap-content">${comm}</div>
  `;

  return sectionWrap(slug, "QA/QC/Commissioning", content);
}

// ─── Reference Check ─────────────────────────────────────────
function renderReferenceSection(slug: string, references: ReferenceEntry[]): string {
  const rows = references
    .map(
      (ref, idx) => `
      <tr${idx % 2 === 1 ? ` style="background: ${C.lightGray};"` : ""}>
        <td class="font-bold" style="width: 22%;">${esc(ref.contactName)}</td>
        <td style="width: 18%;">${esc(ref.title)}</td>
        <td style="width: 20%;">${esc(ref.company)}</td>
        <td style="width: 14%;">${esc(ref.category)}</td>
        <td style="width: 14%;">${esc(ref.phone)}</td>
        <td style="width: 12%; font-size: 8pt;">${esc(ref.email) || "&mdash;"}</td>
      </tr>`
    )
    .join("");

  const content = `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 22%;">Contact</th>
          <th style="width: 18%;">Title</th>
          <th style="width: 20%;">Company</th>
          <th style="width: 14%;">Category</th>
          <th style="width: 14%;">Phone</th>
          <th style="width: 12%;">Email</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  return sectionWrap(slug, "Reference Check", content);
}

// ─── Interview Panel ─────────────────────────────────────────
function renderInterviewPanelSection(slug: string, personnel: PersonnelEntry[]): string {
  return sectionWrap(slug, "Interview Panel", renderPersonnelCards(personnel));
}

// ─── Project Cost ────────────────────────────────────────────
function renderProjectCostSection(slug: string, costData: {
  columns: PricingColumn[];
  rows: PricingRow[];
  notes?: string;
}): string {
  if (costData.columns.length === 0 && costData.rows.length === 0) {
    return sectionWrap(slug, "Project Cost", "");
  }

  // Compute totals
  const columnTotals: Record<string, number> = {};
  for (const col of costData.columns) {
    columnTotals[col.id] = costData.rows.reduce(
      (sum, row) => sum + parseDollar(row.values[col.id]),
      0
    );
  }

  const headerCells = costData.columns
    .map(
      (col) =>
        `<th class="text-right" style="flex: 1;">${esc(col.name)}</th>`
    )
    .join("");

  const bodyRows = costData.rows
    .map(
      (row, idx) => `
      <tr${idx % 2 === 1 ? ` style="background: ${C.lightGray};"` : ""}>
        <td style="flex: 2;">${esc(row.description)}</td>
        ${costData.columns
          .map(
            (col) =>
              `<td class="text-right" style="flex: 1;">${row.values[col.id] ? formatCurrency(parseDollar(row.values[col.id])) : ""}</td>`
          )
          .join("")}
      </tr>`
    )
    .join("");

  const totalsCells = costData.columns
    .map(
      (col) =>
        `<td class="text-right" style="flex: 1;">${formatCurrency(columnTotals[col.id])}</td>`
    )
    .join("");

  let content = `
    <table class="data-table">
      <thead>
        <tr>
          <th style="flex: 2;">Description</th>
          ${headerCells}
        </tr>
      </thead>
      <tbody>
        ${bodyRows}
        <tr class="totals-row">
          <td style="flex: 2;">TOTAL</td>
          ${totalsCells}
        </tr>
      </tbody>
    </table>
  `;

  if (costData.notes) {
    content += `
      <div class="mt-2">
        <div class="subsection-title">Notes</div>
        <div style="font-size: 9pt; line-height: 1.5;">${esc(costData.notes)}</div>
      </div>
    `;
  }

  return sectionWrap(slug, "Project Cost", content);
}

// ─── Helpers ─────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseDollar(value: string | undefined): number {
  if (!value) return 0;
  return Number(value.replace(/[^0-9.-]/g, "")) || 0;
}
