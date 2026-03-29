/**
 * Generate a beautiful 2-page project schedule PDF from the extracted data.
 * Run: node --experimental-vm-modules generate-schedule.mjs
 */
import puppeteer from "puppeteer-core";
import { writeFile, readFile } from "fs/promises";
import path from "path";

// ─── Schedule Data ───────────────────────────────────────────
const tasks = [
  { id: 1, name: "OVERALL WORK SCHEDULE", dur: "178 days", start: "12/29/24", end: "8/27/25", level: 0, cat: "phase" },
  { id: 2, name: "Hillsboro Police Headquarters", dur: "580 days", start: "9/16/25", end: "12/6/27", level: 0, cat: "phase" },
  { id: 3, name: "PRECONSTRUCTION", dur: "144 days", start: "12/22/25", end: "7/9/26", level: 1, cat: "milestone" },
  { id: 4, name: "Division 09 - Metal Stud & Drywall", dur: "143 days", start: "4/23/26", end: "11/9/26", level: 1, cat: "division" },
  { id: 5, name: "Engineering Submittals Framing", dur: "41 days", start: "4/23/26", end: "6/18/26", level: 2, cat: "submittal" },
  { id: 6, name: "Fabrication - Metal Stud & Drywall", dur: "25 days", start: "9/22/26", end: "10/26/26", level: 2, cat: "fabrication" },
  { id: 7, name: "Delivery - Metal Stud & Drywall", dur: "10 days", start: "10/27/26", end: "11/9/26", level: 2, cat: "delivery" },
  { id: 8, name: "Division 09 - Painting", dur: "57 days", start: "11/9/26", end: "1/26/27", level: 1, cat: "division" },
  { id: 9, name: "Fabrication - Painting", dur: "34 days", start: "12/9/26", end: "1/25/27", level: 2, cat: "fabrication" },
  { id: 10, name: "Division 22 - Plumbing", dur: "346 days", start: "8/10/26", end: "12/6/27", level: 1, cat: "division" },
  { id: 11, name: "Fabrication - Plumbing Fixtures", dur: "42 days", start: "10/20/26", end: "12/16/26", level: 2, cat: "fabrication" },
  { id: 12, name: "Fabrication - Lavatory", dur: "32 days", start: "11/3/26", end: "12/16/26", level: 2, cat: "fabrication" },
  { id: 13, name: "Fabrication - Pre-Filter", dur: "71 days", start: "8/12/27", end: "11/18/27", level: 2, cat: "fabrication" },
  { id: 14, name: "Division 23 - HVAC", dur: "392 days", start: "6/5/26", end: "12/6/27", level: 1, cat: "division" },
  { id: 15, name: "Submittals - Prep HVAC Package", dur: "20 days", start: "6/5/26", end: "7/2/26", level: 2, cat: "submittal" },
  { id: 16, name: "Submittals - A&E Review #1", dur: "15 days", start: "7/6/26", end: "7/24/26", level: 2, cat: "submittal" },
  { id: 17, name: "Fab - Rooftop Units / Packaged Air & DOA", dur: "93 days", start: "7/27/26", end: "12/2/26", level: 2, cat: "fabrication" },
  { id: 18, name: "Fabrication - Fans (USF, FJC)", dur: "93 days", start: "10/6/26", end: "2/11/27", level: 2, cat: "fabrication" },
  { id: 19, name: "Fab - Duct (In or Above Ceilings)", dur: "65 days", start: "10/6/26", end: "1/4/27", level: 2, cat: "fabrication" },
  { id: 20, name: "Fabrication - VFD's", dur: "32 days", start: "10/20/26", end: "12/2/26", level: 2, cat: "fabrication" },
  { id: 21, name: "Fabrication - CRAC", dur: "66 days", start: "11/12/26", end: "2/11/27", level: 2, cat: "fabrication" },
  { id: 22, name: "Delivery - Rooftop Units / Air & DOA", dur: "10 days", start: "12/3/26", end: "12/16/26", level: 2, cat: "delivery" },
  { id: 23, name: "Delivery - VFD's", dur: "10 days", start: "12/3/26", end: "12/16/26", level: 2, cat: "delivery" },
  { id: 24, name: "Fabrication - Ceiling Fan", dur: "49 days", start: "12/7/26", end: "2/11/27", level: 2, cat: "fabrication" },
  { id: 25, name: "Fabrication - Fans (CUE)", dur: "39 days", start: "12/21/26", end: "2/11/27", level: 2, cat: "fabrication" },
  { id: 26, name: "Fabrication - VAV's", dur: "32 days", start: "12/30/26", end: "2/11/27", level: 2, cat: "fabrication" },
  { id: 27, name: "Delivery - VAV's", dur: "11 days", start: "2/12/27", end: "2/26/27", level: 2, cat: "delivery" },
  { id: 28, name: "Delivery - Fans (USF, FJC)", dur: "11 days", start: "2/12/27", end: "2/26/27", level: 2, cat: "delivery" },
  { id: 29, name: "Delivery - Ceiling Fan", dur: "11 days", start: "2/12/27", end: "2/26/27", level: 2, cat: "delivery" },
  { id: 30, name: "Delivery - Duct Silencers", dur: "11 days", start: "2/12/27", end: "2/26/27", level: 2, cat: "delivery" },
  { id: 31, name: "Delivery - CRAC", dur: "11 days", start: "2/12/27", end: "2/26/27", level: 2, cat: "delivery" },
  { id: 32, name: "Delivery - Fans (CUE)", dur: "11 days", start: "2/12/27", end: "2/26/27", level: 2, cat: "delivery" },
  { id: 33, name: "Delivery (In or Above Ceilings)", dur: "62 days", start: "9/10/27", end: "12/6/27", level: 2, cat: "delivery" },
  { id: 34, name: "Fabrication - LG Split Systems", dur: "37 days", start: "10/15/27", end: "12/6/27", level: 2, cat: "fabrication" },
  { id: 35, name: "Fabrication - Duct Silencers", dur: "32 days", start: "10/22/27", end: "12/6/27", level: 2, cat: "fabrication" },
  { id: 36, name: "Construction", dur: "374 days", start: "7/1/26", end: "12/6/27", level: 0, cat: "phase" },
  { id: 37, name: "Mobilization", dur: "7 days", start: "6/1/26", end: "6/9/26", level: 2, cat: "construction" },
  { id: 38, name: "Excavation", dur: "116 days", start: "6/15/26", end: "11/23/26", level: 2, cat: "construction" },
  { id: 39, name: "Foundations", dur: "94 days", start: "7/27/26", end: "12/3/26", level: 2, cat: "construction" },
  { id: 40, name: "Roof Vapor Barrier/Roofing", dur: "83 days", start: "12/3/26", end: "3/29/27", level: 2, cat: "construction" },
  { id: 41, name: "Interiors", dur: "242 days", start: "12/2/26", end: "11/4/27", level: 1, cat: "division" },
  { id: 42, name: "Level 1 - Area C", dur: "177 days", start: "12/2/26", end: "8/5/27", level: 2, cat: "construction" },
  { id: 43, name: "Level 1 - Area B", dur: "179 days", start: "12/23/26", end: "8/30/27", level: 2, cat: "construction" },
  { id: 44, name: "Level 1 - Area A", dur: "190 days", start: "12/18/26", end: "9/9/27", level: 2, cat: "construction" },
  { id: 45, name: "Level 2 - Area C", dur: "182 days", start: "2/10/27", end: "10/21/27", level: 2, cat: "construction" },
  { id: 46, name: "Level 2 - Area B", dur: "167 days", start: "3/3/27", end: "10/21/27", level: 2, cat: "construction" },
  { id: 47, name: "COMMISSIONING / CLOSEOUT", dur: "145 days", start: "5/18/27", end: "12/6/27", level: 0, cat: "commissioning" },
  { id: 48, name: "Power on Period", dur: "5 days", start: "5/18/27", end: "5/24/27", level: 2, cat: "commissioning" },
  { id: 49, name: "TAB Period", dur: "30 days", start: "9/7/27", end: "10/18/27", level: 2, cat: "commissioning" },
  { id: 50, name: "Commissioning/Closeout", dur: "30 days", start: "9/24/27", end: "11/4/27", level: 2, cat: "commissioning" },
  { id: 51, name: "Lights ON", dur: "5 days", start: "10/1/27", end: "10/7/27", level: 2, cat: "commissioning" },
  { id: 52, name: "Lighting Control Period", dur: "20 days", start: "10/8/27", end: "11/4/27", level: 2, cat: "commissioning" },
  { id: 53, name: "Punchlist Period", dur: "20 days", start: "10/22/27", end: "11/18/27", level: 2, cat: "commissioning" },
  { id: 54, name: "Final Clean Period", dur: "12 days", start: "11/19/27", end: "12/6/27", level: 2, cat: "commissioning" },
];

// ─── Date Utilities ──────────────────────────────────────────
function parseDate(str) {
  const [m, d, y] = str.split("/").map(Number);
  return new Date(2000 + y, m - 1, d);
}

const TL_START = new Date(2025, 5, 1);  // Jun 1, 2025
const TL_END   = new Date(2028, 0, 1);  // Jan 1, 2028
const TL_RANGE = TL_END - TL_START;

function pct(date) {
  const d = typeof date === "string" ? parseDate(date) : date;
  return Math.max(0, Math.min(100, ((d - TL_START) / TL_RANGE) * 100));
}

// Quarter grid lines
const quarters = [];
for (let y = 2025; y <= 2027; y++) {
  for (let q = 0; q < 4; q++) {
    const m = q * 3;
    const d = new Date(y, m, 1);
    if (d >= TL_START && d <= TL_END) {
      const label = `Q${q + 1} '${String(y).slice(2)}`;
      quarters.push({ label, pct: pct(d) });
    }
  }
}

// ─── Colors ──────────────────────────────────────────────────
const C = {
  navy: "#1B365D",
  gold: "#C9A227",
  white: "#FFFFFF",
  bg: "#FAFBFC",
  border: "#E2E8F0",
  textDark: "#1A202C",
  textMed: "#4A5568",
  textLight: "#718096",
};

const BAR_COLORS = {
  phase:         { bg: "#1B365D", text: "#FFFFFF" },
  milestone:     { bg: "#C9A227", text: "#FFFFFF" },
  division:      { bg: "#4A5568", text: "#FFFFFF" },
  submittal:     { bg: "#3B82F6", text: "#FFFFFF" },
  fabrication:   { bg: "#F59E0B", text: "#FFFFFF" },
  delivery:      { bg: "#10B981", text: "#FFFFFF" },
  construction:  { bg: "#6366F1", text: "#FFFFFF" },
  commissioning: { bg: "#8B5CF6", text: "#FFFFFF" },
};

const ROW_BG = {
  phase:     "rgba(27,54,93,0.08)",
  milestone: "rgba(201,162,39,0.08)",
  division:  "rgba(74,85,104,0.06)",
};

// ─── HTML Helpers ────────────────────────────────────────────
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderRow(t, scale = 1) {
  const left = pct(t.start);
  const right = pct(t.end);
  const width = Math.max(0.4, right - left);
  const barColor = BAR_COLORS[t.cat] || BAR_COLORS.construction;
  const rowBg = ROW_BG[t.cat] || "transparent";
  const isPhase = t.level === 0;
  const isDivision = t.level === 1;
  const indent = t.level === 2 ? "padding-left: 18px;" : t.level === 1 ? "padding-left: 8px;" : "";
  const fontWeight = t.level <= 1 ? "font-weight: 700;" : "";
  const fontSize = isPhase ? `font-size: ${7.5 * scale}pt;` : `font-size: ${7 * scale}pt;`;
  const barHeight = Math.round((isPhase ? 6 : isDivision ? 8 : 10) * scale);
  const barRadius = isPhase ? 2 : 3;
  const barOpacity = isPhase ? 0.7 : isDivision ? 0.8 : 1;
  const rowHeight = Math.round((isPhase ? 22 : isDivision ? 20 : 17) * scale);

  return `
    <div class="row" style="height: ${rowHeight}px; background: ${rowBg};">
      <div class="cell cell-id" style="${fontSize}">${t.id}</div>
      <div class="cell cell-name" style="${indent} ${fontWeight} ${fontSize}">${esc(t.name)}</div>
      <div class="cell cell-dur" style="${fontSize}">${t.dur.replace(" days", "d")}</div>
      <div class="cell cell-gantt">
        <div class="bar" style="
          left: ${left}%;
          width: ${width}%;
          height: ${barHeight}px;
          background: ${barColor.bg};
          border-radius: ${barRadius}px;
          opacity: ${barOpacity};
          top: 50%;
          transform: translateY(-50%);
        "></div>
      </div>
    </div>`;
}

function renderQuarterHeaders() {
  let html = "";
  for (let i = 0; i < quarters.length; i++) {
    const q = quarters[i];
    const next = quarters[i + 1];
    const w = next ? next.pct - q.pct : 100 - q.pct;
    html += `<div class="q-label" style="left: ${q.pct}%; width: ${w}%;">${q.label}</div>`;
  }
  return html;
}

function renderGridLines() {
  return quarters.map(q =>
    `<div class="grid-line" style="left: ${q.pct}%;"></div>`
  ).join("");
}

function renderLegend() {
  const items = [
    { label: "Submittals", color: BAR_COLORS.submittal.bg },
    { label: "Fabrication", color: BAR_COLORS.fabrication.bg },
    { label: "Delivery", color: BAR_COLORS.delivery.bg },
    { label: "Construction", color: BAR_COLORS.construction.bg },
    { label: "Commissioning", color: BAR_COLORS.commissioning.bg },
    { label: "Phase / Milestone", color: BAR_COLORS.phase.bg },
  ];
  return items.map(i =>
    `<span class="legend-item">
      <span class="swatch" style="background: ${i.color};"></span>${i.label}
    </span>`
  ).join("");
}

function renderPage(pageTasks, pageNum, pageTitle, rowScale = 1) {
  return `
    <div class="page">
      <!-- Schedule Grid -->
      <div class="schedule">
        <!-- Column Headers + Quarter Labels -->
        <div class="col-headers">
          <div class="cell cell-id ch">#</div>
          <div class="cell cell-name ch">Task Name</div>
          <div class="cell cell-dur ch">Duration</div>
          <div class="cell cell-gantt ch" style="position: relative;">
            ${renderQuarterHeaders()}
          </div>
        </div>

        <!-- Rows with grid overlay -->
        <div class="rows-container">
          <div class="grid-overlay">${renderGridLines()}</div>
          ${pageTasks.map(t => renderRow(t, rowScale)).join("")}
        </div>
      </div>

      <!-- Legend -->
      <div class="legend">${renderLegend()}</div>
    </div>`;
}

// ─── Fonts & Logo ───────────────────────────────────────────
async function getFontBase64() {
  try {
    const fontPath = path.join(process.cwd(), "public", "fonts");
    const [regular, semibold, bold] = await Promise.all([
      readFile(path.join(fontPath, "Inter-Regular.woff2")),
      readFile(path.join(fontPath, "Inter-SemiBold.woff2")),
      readFile(path.join(fontPath, "Inter-Bold.woff2")),
    ]);
    return {
      regular: regular.toString("base64"),
      semibold: semibold.toString("base64"),
      bold: bold.toString("base64"),
    };
  } catch {
    return null;
  }
}


// ─── Full HTML ───────────────────────────────────────────────
async function buildHtml() {
  const fonts = await getFontBase64();
  const fontFaces = fonts ? `
    @font-face { font-family: 'Inter'; font-weight: 400; src: url('data:font/woff2;base64,${fonts.regular}') format('woff2'); }
    @font-face { font-family: 'Inter'; font-weight: 600; src: url('data:font/woff2;base64,${fonts.semibold}') format('woff2'); }
    @font-face { font-family: 'Inter'; font-weight: 700; src: url('data:font/woff2;base64,${fonts.bold}') format('woff2'); }
  ` : "";

  const page1Tasks = tasks.filter(t => t.id <= 35);
  const page2Tasks = tasks.filter(t => t.id >= 36);

  return `<!DOCTYPE html>
<html>
<head>
<style>
  ${fontFaces}

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif;
    color: ${C.textDark};
    background: ${C.white};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page {
    size: letter landscape;
    margin: 0;
  }

  .page {
    width: 11in;
    height: 8.5in;
    padding: 0.35in 0.4in 0.3in;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  /* ─── Schedule Grid ─── */
  .schedule {
    flex: 1;
  }

  .col-headers {
    display: flex;
    background: ${C.navy};
    color: ${C.white};
    border-radius: 4px 4px 0 0;
    height: 22px;
    align-items: center;
  }
  .ch {
    font-size: 6.5pt !important;
    font-weight: 700 !important;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .cell {
    display: flex;
    align-items: center;
    padding: 0 4px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 7pt;
    color: ${C.textDark};
  }
  .cell-id   { width: 24px; justify-content: center; flex-shrink: 0; color: ${C.textLight}; font-size: 6.5pt; }
  .cell-name { width: 260px; flex-shrink: 0; }
  .cell-dur  { width: 56px; flex-shrink: 0; justify-content: flex-end; color: ${C.textMed}; font-size: 6.5pt; }
  .cell-gantt { flex: 1; position: relative; height: 100%; }

  .col-headers .cell-id { color: rgba(255,255,255,0.7); }
  .col-headers .cell-name { color: ${C.white}; }
  .col-headers .cell-dur { color: rgba(255,255,255,0.7); }

  /* Quarter labels in header */
  .q-label {
    position: absolute;
    top: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 6pt;
    font-weight: 700;
    color: rgba(255,255,255,0.85);
    letter-spacing: 0.5px;
    border-left: 1px solid rgba(255,255,255,0.2);
  }
  .q-label:first-child { border-left: none; }

  /* Rows */
  .rows-container {
    position: relative;
    border: 1px solid ${C.border};
    border-top: none;
    border-radius: 0 0 4px 4px;
    overflow: hidden;
  }
  .row {
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(226,232,240,0.6);
  }
  .row:last-child { border-bottom: none; }
  .row:nth-child(even) { background: rgba(247,250,252,0.5); }

  /* Grid lines */
  .grid-overlay {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 330px; /* cell-id + cell-name + cell-dur */
    right: 0;
    pointer-events: none;
    z-index: 1;
  }
  .grid-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(226,232,240,0.5);
  }

  /* Gantt bars */
  .bar {
    position: absolute;
    z-index: 2;
    transition: opacity 0.15s;
  }

  /* ─── Legend ─── */
  .legend {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid ${C.border};
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 6.5pt;
    color: ${C.textMed};
  }
  .swatch {
    width: 10px;
    height: 6px;
    border-radius: 2px;
    display: inline-block;
  }
</style>
</head>
<body>
  ${renderPage(page1Tasks, 1, "Preconstruction & Procurement", 1)}
  ${renderPage(page2Tasks, 2, "Construction & Commissioning", 1)}
</body>
</html>`;
}

// ─── Generate PDF ────────────────────────────────────────────
async function main() {
  console.log("Building HTML...");
  const html = await buildHtml();

  // Save HTML for debugging
  await writeFile("schedule-preview.html", html);
  console.log("Saved schedule-preview.html (open in browser to preview)");

  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    width: "11in",
    height: "8.5in",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();

  await writeFile("schedule-output.pdf", pdfBuffer);
  console.log(`Generated schedule-output.pdf (${pdfBuffer.length} bytes)`);
}

main().catch(console.error);
