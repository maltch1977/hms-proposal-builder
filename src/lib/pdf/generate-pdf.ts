import puppeteer from "puppeteer-core";
import { PDFDocument } from "pdf-lib";
import type { ProposalDocumentData } from "./types";
import { resolveAllImages } from "./images";
import { renderCoverHtml, renderBodyHtml } from "./render-html";

// ─── Chrome executable resolution ────────────────────────────

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

async function getChromiumConfig(): Promise<{
  executablePath: string;
  args: string[];
}> {
  // Explicit env var takes priority
  if (process.env.CHROME_PATH) {
    return {
      executablePath: process.env.CHROME_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    };
  }

  // Production (Vercel serverless): use @sparticuz/chromium
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return {
      executablePath: await chromium.executablePath(),
      args: chromium.args,
    };
  }

  // Local dev: system Chrome
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ];

  const { access } = await import("fs/promises");
  for (const p of candidates) {
    try {
      await access(p);
      return {
        executablePath: p,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      };
    } catch {
      continue;
    }
  }

  throw new Error(
    "Chrome not found. Set CHROME_PATH env var or install Google Chrome."
  );
}

// ─── Header / Footer Templates ───────────────────────────────

function headerTemplate(
  logoBase64: string,
  companyName: string,
  projectLabel: string,
  clientName: string
): string {
  return `
    <div style="
      width: 100%;
      font-family: -apple-system, sans-serif;
      font-size: 8px;
      padding: 0 54px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #C9A227;
      padding-bottom: 6px;
    ">
      <div style="display: flex; align-items: center; gap: 8px;">
        ${logoBase64 ? `<img src="${logoBase64}" style="width: 28px; height: 28px; object-fit: contain;" />` : ""}
        <div>
          <div style="font-weight: 700; color: #1B365D; letter-spacing: 1px; font-size: 8px;">
            ${(companyName || "HMS Commercial Service, Inc.").toUpperCase()}
          </div>
          <div style="color: #666666; font-size: 7px;">${projectLabel}</div>
        </div>
      </div>
      <div style="color: #666666; font-size: 7px; text-align: right;">
        ${clientName}
      </div>
    </div>
  `;
}

function footerTemplate(companyName: string): string {
  return `
    <div style="
      width: 100%;
      font-family: -apple-system, sans-serif;
      font-size: 7px;
      padding: 0 54px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 0.5px solid #E0E0E0;
      padding-top: 4px;
      color: #666666;
    ">
      <span>${companyName || "HMS Commercial Service, Inc."}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;
}

// ─── Main PDF Generator ──────────────────────────────────────

export async function generateProposalPdf(
  data: ProposalDocumentData
): Promise<Uint8Array> {
  // 1. Resolve all images to base64 (parallel)
  const images = await resolveAllImages(data);

  // 2. Render HTML
  const [coverHtml, bodyHtml] = await Promise.all([
    renderCoverHtml(data, {
      logoBase64: images.logoBase64,
      coverPhotoBase64: images.coverPhotoBase64,
    }),
    renderBodyHtml(data, {
      logoBase64: images.logoBase64,
      orgChartBase64: images.orgChartBase64,
    }),
  ]);

  // 3. Launch Puppeteer
  const { executablePath, args } = await getChromiumConfig();

  const browser = await puppeteer.launch({
    executablePath,
    args,
    headless: true,
    defaultViewport: { width: 816, height: 1056 }, // Letter size at 96dpi
  });

  try {
    // 4. Render cover PDF (no margins, no header/footer)
    const coverPage = await browser.newPage();
    await coverPage.setContent(coverHtml, { waitUntil: "networkidle0" });
    const coverPdfBuffer = await coverPage.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    await coverPage.close();

    // 5. Render body PDF (with margins, header/footer)
    const hasCover = data.sections.some(
      (s) => s.slug === "cover_page" && s.isEnabled
    );
    const bodyPage = await browser.newPage();
    await bodyPage.setContent(bodyHtml, { waitUntil: "networkidle0" });
    const bodyPdfBuffer = await bodyPage.pdf({
      format: "Letter",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerTemplate(
        images.logoBase64,
        data.companyName || "HMS Commercial Service, Inc.",
        data.projectLabel || "RESPONSE TO RFP",
        data.clientName
      ),
      footerTemplate: footerTemplate(
        data.footerText || data.companyName || "HMS Commercial Service, Inc."
      ),
      margin: {
        top: "72pt",
        right: "54pt",
        bottom: "60pt",
        left: "54pt",
      },
    });
    await bodyPage.close();

    // 6. Merge PDFs with pdf-lib
    const mergedPdf = await PDFDocument.create();

    if (hasCover) {
      const coverDoc = await PDFDocument.load(coverPdfBuffer);
      const coverPages = await mergedPdf.copyPages(
        coverDoc,
        coverDoc.getPageIndices()
      );
      for (const page of coverPages) {
        mergedPdf.addPage(page);
      }
    }

    const bodyDoc = await PDFDocument.load(bodyPdfBuffer);
    const bodyPages = await mergedPdf.copyPages(
      bodyDoc,
      bodyDoc.getPageIndices()
    );
    for (const page of bodyPages) {
      mergedPdf.addPage(page);
    }

    // Set metadata
    mergedPdf.setTitle(data.title);
    mergedPdf.setAuthor(
      data.companyName || "HMS Commercial Service, Inc."
    );
    mergedPdf.setSubject(`Proposal for ${data.clientName}`);
    mergedPdf.setCreator("HMS Proposal Builder");

    return mergedPdf.save();
  } finally {
    await browser.close();
  }
}
