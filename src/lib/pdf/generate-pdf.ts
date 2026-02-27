import puppeteer, { type Browser } from "puppeteer-core";
import { PDFDocument } from "pdf-lib";
import type { ProposalDocumentData } from "./types";
import { resolveAllImages, resolveSchedulePdfBuffers } from "./images";
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

  // Production (Vercel serverless): use @sparticuz/chromium-min with remote binary
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    return {
      executablePath: await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar"
      ),
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

// ─── PDF-to-Image Conversion ─────────────────────────────────

let _pdfjsCache: { main: string; worker: string } | null = null;

async function fetchPdfjsScripts(): Promise<{ main: string; worker: string }> {
  if (_pdfjsCache) return _pdfjsCache;
  const [main, worker] = await Promise.all([
    fetch("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js").then((r) => r.text()),
    fetch("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js").then((r) => r.text()),
  ]);
  _pdfjsCache = { main, worker };
  return _pdfjsCache;
}

async function convertSchedulePdfToImages(
  browser: Browser,
  pdfBuffers: Uint8Array[]
): Promise<string[]> {
  if (pdfBuffers.length === 0) return [];

  const scripts = await fetchPdfjsScripts();
  const allImages: string[] = [];

  for (const buf of pdfBuffers) {
    const pdfBase64 = Buffer.from(buf).toString("base64");
    const page = await browser.newPage();

    try {
      await page.setContent(
        `<!DOCTYPE html><html><body>
          <script>${scripts.main}<\/script>
          <script>
            var _workerBlob = new Blob([${JSON.stringify(scripts.worker)}], {type:'text/javascript'});
            pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(_workerBlob);
          </script>
        </body></html>`,
        { waitUntil: "domcontentloaded" }
      );

      const images: string[] = await page.evaluate(async (b64: string) => {
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);

        // @ts-expect-error pdfjsLib loaded via script tag
        const pdf = await pdfjsLib.getDocument({ data: arr }).promise;
        const results: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const pg = await pdf.getPage(pageNum);
          const vp = pg.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext("2d")!;
          await pg.render({ canvasContext: ctx, viewport: vp }).promise;
          results.push(canvas.toDataURL("image/png"));
        }

        return results;
      }, pdfBase64);

      allImages.push(...images);
    } catch (err) {
      console.warn("[pdf/generate] Failed to convert schedule PDF to images:", err);
    } finally {
      await page.close();
    }
  }

  return allImages;
}

// ─── Main PDF Generator ──────────────────────────────────────

export async function generateProposalPdf(
  data: ProposalDocumentData
): Promise<Uint8Array> {
  // 1. Resolve all images and fetch schedule PDF buffers in parallel
  const [images, schedulePdfBuffers] = await Promise.all([
    resolveAllImages(data),
    resolveSchedulePdfBuffers(data),
  ]);

  // 2. Launch Puppeteer early (needed for PDF-to-image conversion + HTML rendering)
  const { executablePath, args } = await getChromiumConfig();

  const browser = await puppeteer.launch({
    executablePath,
    args,
    headless: true,
    defaultViewport: { width: 816, height: 1056 }, // Letter size at 96dpi
  });

  try {
    // 3. Convert schedule PDFs to images using pdf.js inside the browser
    const schedulePdfImages = await convertSchedulePdfToImages(browser, schedulePdfBuffers);
    const allScheduleImages = [...images.scheduleFileImages, ...schedulePdfImages];

    // 4. Render HTML (with schedule images now available for inline embedding)
    const [coverHtml, bodyHtml] = await Promise.all([
      renderCoverHtml(data, {
        logoBase64: images.logoBase64,
        coverPhotoBase64: images.coverPhotoBase64,
      }),
      renderBodyHtml(data, {
        logoBase64: images.logoBase64,
        orgChartBase64: images.orgChartBase64,
        caseStudyPhotos: images.caseStudyPhotos,
        scheduleFileImages: allScheduleImages,
      }),
    ]);

    // 5. Render cover PDF (no margins, no header/footer)
    const coverPage = await browser.newPage();
    await coverPage.setContent(coverHtml, { waitUntil: "networkidle0" });
    const coverPdfBuffer = await coverPage.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    await coverPage.close();

    // 6. Render body PDF (two-pass: measure page counts, then render with TOC page numbers)
    const hasCover = data.sections.some(
      (s) => s.slug === "cover_page" && s.isEnabled
    );

    const bodyPdfOpts = {
      format: "Letter" as const,
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
        top: "1in",
        right: "0.75in",
        bottom: "0.833in",
        left: "0.75in",
      },
    };

    const bodyPage = await browser.newPage();
    await bodyPage.setContent(bodyHtml, { waitUntil: "networkidle0" });

    // Pass 1: measure page count per section by isolating each one
    const sectionSlugs: string[] = await bodyPage.evaluate(() => {
      return [...document.querySelectorAll("section.pdf-section")]
        .map((s) => s.getAttribute("data-slug") || "")
        .filter(Boolean);
    });

    const pageCounts: Record<string, number> = {};
    for (const slug of sectionSlugs) {
      // Hide all sections except current, remove break-before on it
      await bodyPage.evaluate((currentSlug: string) => {
        document.querySelectorAll("section.pdf-section").forEach((s) => {
          const el = s as HTMLElement;
          if (s.getAttribute("data-slug") === currentSlug) {
            el.style.display = "";
            el.style.breakBefore = "auto";
          } else {
            el.style.display = "none";
          }
        });
      }, slug);

      const tempPdf = await bodyPage.pdf(bodyPdfOpts);
      const tempDoc = await PDFDocument.load(tempPdf);
      pageCounts[slug] = tempDoc.getPageCount();
    }

    // Calculate cumulative start pages
    let currentPage = 1;
    const pageMap: Record<string, number> = {};
    for (const slug of sectionSlugs) {
      pageMap[slug] = currentPage;
      currentPage += pageCounts[slug];
    }

    // Pass 2: show all sections, inject TOC page numbers, render final PDF
    await bodyPage.evaluate((map: Record<string, number>) => {
      // Restore all sections
      document.querySelectorAll("section.pdf-section").forEach((s) => {
        const el = s as HTMLElement;
        el.style.display = "";
        el.style.breakBefore = "";
      });
      // Update TOC entries with real page numbers
      document.querySelectorAll("[data-toc-slug]").forEach((el) => {
        const slug = el.getAttribute("data-toc-slug");
        if (slug && map[slug]) {
          const span = el.querySelector(".toc-page-num");
          if (span) span.textContent = String(map[slug]);
        }
      });
    }, pageMap);

    const bodyPdfBuffer = await bodyPage.pdf(bodyPdfOpts);
    await bodyPage.close();

    // 7. Merge PDFs with pdf-lib
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
