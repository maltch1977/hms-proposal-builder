import puppeteer, { type Browser } from "puppeteer-core";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ProposalDocumentData } from "./types";
import { resolveAllImages, resolveSchedulePdfBuffers } from "./images";
import { renderCoverHtml, renderBodyHtml, renderScheduleLandscapeHtml } from "./render-html";

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
  // Page numbers are NOT rendered here — they're stamped by pdf-lib after merge
  // so that landscape schedule pages (spliced in) don't break the numbering.
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
      <span></span>
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
    const scheduleLandscapePageCount = allScheduleImages.length;

    // 4. Render cover + body HTML (schedule landscape deferred until we know page numbers)
    const [coverHtml, bodyHtml] = await Promise.all([
      renderCoverHtml(data, {
        logoBase64: images.logoBase64,
        coverPhotoBase64: images.coverPhotoBase64,
      }),
      renderBodyHtml(data, {
        logoBase64: images.logoBase64,
        orgChartBase64: images.orgChartBase64,
        caseStudyPhotos: images.caseStudyPhotos,
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

    const hasCover = data.sections.some(
      (s) => s.slug === "cover_page" && s.isEnabled
    );

    // 6. Shared header + margin config
    const companyName = data.companyName || "HMS Commercial Service, Inc.";
    const projectLabel = data.projectLabel || "RESPONSE TO RFP";
    const footerCompanyName = data.footerText || companyName;

    const hdrTpl = headerTemplate(
      images.logoBase64,
      companyName,
      projectLabel,
      data.clientName
    );
    const sharedMargin = {
      top: "1in",
      right: "0.75in",
      bottom: "0.833in",
      left: "0.75in",
    };

    // 7. Body pass 1: measure page counts per section
    const bodyPage = await browser.newPage();
    await bodyPage.setContent(bodyHtml, { waitUntil: "networkidle0" });

    const sectionSlugs: string[] = await bodyPage.evaluate(() => {
      return [...document.querySelectorAll("section.pdf-section")]
        .map((s) => s.getAttribute("data-slug") || "")
        .filter(Boolean);
    });

    // Use temporary footer for measurement (total doesn't matter for counting)
    const measureFtr = footerTemplate(footerCompanyName);
    const measureOpts = {
      format: "Letter" as const,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: hdrTpl,
      footerTemplate: measureFtr,
      margin: sharedMargin,
    };

    const pageCounts: Record<string, number> = {};
    for (const slug of sectionSlugs) {
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

      const tempPdf = await bodyPage.pdf(measureOpts);
      const tempDoc = await PDFDocument.load(tempPdf);
      pageCounts[slug] = tempDoc.getPageCount();
    }

    // 8. Compute page map, schedule start page, and total page count
    let currentPage = 1;
    const pageMap: Record<string, number> = {};
    let scheduleStartPage = -1;
    for (const slug of sectionSlugs) {
      pageMap[slug] = currentPage;
      currentPage += pageCounts[slug];
      if (slug === "project_schedule") {
        scheduleStartPage = currentPage; // first landscape page number
        currentPage += scheduleLandscapePageCount;
      }
    }
    const totalPages = currentPage - 1;

    // 9. Render schedule landscape HTML with correct page numbers baked in
    const scheduleLandscapeHtml = allScheduleImages.length > 0
      ? await renderScheduleLandscapeHtml(allScheduleImages, {
          startPageNum: scheduleStartPage,
          totalPages,
          logoBase64: images.logoBase64,
          companyName,
          projectLabel,
          clientName: data.clientName,
          footerCompanyName,
        })
      : null;

    // 10. Render schedule landscape PDF (header/footer baked into HTML, zero margins)
    let scheduleLandscapePdfBuffer: Uint8Array | null = null;
    if (scheduleLandscapeHtml) {
      const schedPage = await browser.newPage();
      await schedPage.setContent(scheduleLandscapeHtml, { waitUntil: "networkidle0" });
      const buf = await schedPage.pdf({
        format: "Letter",
        landscape: true,
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      await schedPage.close();
      scheduleLandscapePdfBuffer = buf;
    }

    // 11. Body pass 2: inject TOC page numbers, render final body PDF
    await bodyPage.evaluate((map: Record<string, number>) => {
      document.querySelectorAll("section.pdf-section").forEach((s) => {
        const el = s as HTMLElement;
        el.style.display = "";
        el.style.breakBefore = "";
      });
      document.querySelectorAll("[data-toc-slug]").forEach((el) => {
        const slug = el.getAttribute("data-toc-slug");
        if (slug && map[slug]) {
          const span = el.querySelector(".toc-page-num");
          if (span) span.textContent = String(map[slug]);
        }
      });
    }, pageMap);

    const bodyFtr = footerTemplate(footerCompanyName);
    const bodyPdfBuffer = await bodyPage.pdf({
      format: "Letter",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: hdrTpl,
      footerTemplate: bodyFtr,
      margin: sharedMargin,
    });
    await bodyPage.close();

    // 12. Merge PDFs with pdf-lib — splice landscape schedule pages after schedule section
    const mergedPdf = await PDFDocument.create();

    if (hasCover) {
      const coverDoc = await PDFDocument.load(coverPdfBuffer);
      const coverPages = await mergedPdf.copyPages(coverDoc, coverDoc.getPageIndices());
      for (const page of coverPages) mergedPdf.addPage(page);
    }

    const bodyDoc = await PDFDocument.load(bodyPdfBuffer);
    let scheduleInsertAfterIdx = -1;
    {
      let idx = 0;
      for (const slug of sectionSlugs) {
        idx += pageCounts[slug];
        if (slug === "project_schedule") {
          scheduleInsertAfterIdx = idx - 1;
          break;
        }
      }
    }

    const bodyPageCount = bodyDoc.getPageCount();
    const scheduleLandscapeDoc = scheduleLandscapePdfBuffer
      ? await PDFDocument.load(scheduleLandscapePdfBuffer)
      : null;

    for (let i = 0; i < bodyPageCount; i++) {
      const [page] = await mergedPdf.copyPages(bodyDoc, [i]);
      mergedPdf.addPage(page);

      if (scheduleLandscapeDoc && i === scheduleInsertAfterIdx) {
        const schedPages = await mergedPdf.copyPages(
          scheduleLandscapeDoc,
          scheduleLandscapeDoc.getPageIndices()
        );
        for (const sp of schedPages) mergedPdf.addPage(sp);
      }
    }

    // 13. Stamp correct page numbers on all body pages via pdf-lib
    //     (Puppeteer footer doesn't include page numbers — landscape splice breaks sequential numbering)
    const helvetica = await mergedPdf.embedFont(StandardFonts.Helvetica);
    const pnFontSize = 5.25; // ~7px to match footer font-size
    const pnColor = rgb(0.4, 0.4, 0.4); // #666666
    const coverOffset = hasCover ? 1 : 0;

    for (let i = 0; i < bodyPageCount; i++) {
      // Correct proposal page number accounting for spliced landscape pages
      const proposalPageNum =
        scheduleInsertAfterIdx >= 0 && i > scheduleInsertAfterIdx
          ? i + 1 + scheduleLandscapePageCount
          : i + 1;

      // Index in the merged PDF (landscape pages shift later body pages)
      const mergedIdx =
        coverOffset +
        i +
        (scheduleInsertAfterIdx >= 0 && i > scheduleInsertAfterIdx
          ? scheduleLandscapePageCount
          : 0);

      const page = mergedPdf.getPage(mergedIdx);
      const { width } = page.getSize();

      const text = `Page ${proposalPageNum} of ${totalPages}`;
      const textWidth = helvetica.widthOfTextAtSize(text, pnFontSize);

      // Position in footer area: right-aligned, matching Puppeteer footer padding (54px ≈ 40pt)
      page.drawText(text, {
        x: width - 40 - textWidth,
        y: 28,
        size: pnFontSize,
        font: helvetica,
        color: pnColor,
      });
    }

    mergedPdf.setTitle(data.title);
    mergedPdf.setAuthor(companyName);
    mergedPdf.setSubject(`Proposal for ${data.clientName}`);
    mergedPdf.setCreator("HMS Proposal Builder");

    return mergedPdf.save();
  } finally {
    await browser.close();
  }
}
