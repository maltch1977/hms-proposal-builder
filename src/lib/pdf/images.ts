import { readFile } from "fs/promises";
import path from "path";

/**
 * Convert a local path (e.g. /images/hms_logo.png) or remote URL to a base64 data URL.
 * Returns empty string on failure.
 */
export async function resolveImageToBase64(src: string): Promise<string> {
  if (!src) return "";

  try {
    // Already a data URL
    if (src.startsWith("data:")) return src;

    // Remote URL — fetch and convert
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const res = await fetch(src);
      if (!res.ok) return "";
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || guessMime(src);
      return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
    }

    // Local path — could be absolute filesystem path or relative /public path
    let filePath = src;
    if (src.startsWith("/") && !src.startsWith(process.cwd())) {
      filePath = path.join(process.cwd(), "public", src);
    }

    const buffer = await readFile(filePath);
    const mime = guessMime(filePath);
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    console.warn(`[pdf/images] Failed to resolve image: ${src}`);
    return "";
  }
}

function guessMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".gif": return "image/gif";
    case ".svg": return "image/svg+xml";
    case ".webp": return "image/webp";
    default: return "image/png";
  }
}

/**
 * Resolve all image URLs in the proposal data to base64, in parallel.
 */
export async function resolveAllImages(data: {
  logoUrl?: string;
  coverPhotoUrl?: string;
  sections: Array<{ slug: string; content: Record<string, unknown> }>;
  caseStudies: Array<{ photoUrl?: string }>;
}): Promise<{
  logoBase64: string;
  coverPhotoBase64: string;
  orgChartBase64: string;
  caseStudyPhotos: string[];
  scheduleFileImages: string[];
}> {
  // Find org chart URL from key_personnel section
  const kpSection = data.sections.find((s) => s.slug === "key_personnel");
  const orgChartUrl =
    kpSection &&
    (kpSection.content.org_chart_mode || "upload") === "upload"
      ? (kpSection.content.org_chart_image as string | undefined) || ""
      : "";

  // Find schedule file URLs from project_schedule section (images only)
  const schedSection = data.sections.find((s) => s.slug === "project_schedule");
  const schedFiles = (schedSection?.content.files as Array<{ url: string; filename: string; type: string }>) || [];
  const schedImageUrls = schedFiles
    .filter((f) => f.type && f.type.startsWith("image/"))
    .map((f) => f.url);

  const [logoBase64, coverPhotoBase64, orgChartBase64, ...rest] =
    await Promise.all([
      resolveImageToBase64(data.logoUrl || ""),
      resolveImageToBase64(data.coverPhotoUrl || ""),
      resolveImageToBase64(orgChartUrl),
      ...data.caseStudies.map((cs) =>
        resolveImageToBase64(cs.photoUrl || "")
      ),
      ...schedImageUrls.map((url) => resolveImageToBase64(url)),
    ]);

  const caseStudyPhotos = rest.slice(0, data.caseStudies.length);
  const scheduleFileImages = rest.slice(data.caseStudies.length);

  return { logoBase64, coverPhotoBase64, orgChartBase64, caseStudyPhotos, scheduleFileImages };
}

/**
 * Download schedule PDF files from Supabase storage as raw buffers.
 * Image files are handled separately by resolveAllImages.
 */
export async function resolveSchedulePdfBuffers(data: {
  sections: Array<{ slug: string; content: Record<string, unknown> }>;
}): Promise<Uint8Array[]> {
  const schedSection = data.sections.find((s) => s.slug === "project_schedule");
  const files = (schedSection?.content.files as Array<{ url: string; filename: string; type: string }>) || [];
  const pdfFiles = files.filter(
    (f) => f.type === "application/pdf" || f.filename?.toLowerCase().endsWith(".pdf")
  );

  const buffers: Uint8Array[] = [];
  for (const file of pdfFiles) {
    try {
      const res = await fetch(file.url);
      if (!res.ok) continue;
      buffers.push(new Uint8Array(await res.arrayBuffer()));
    } catch {
      console.warn(`[pdf/images] Failed to fetch schedule PDF: ${file.url}`);
    }
  }
  return buffers;
}
