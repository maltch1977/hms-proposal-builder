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
}): Promise<{
  logoBase64: string;
  coverPhotoBase64: string;
  orgChartBase64: string;
}> {
  // Find org chart URL from key_personnel section
  const kpSection = data.sections.find((s) => s.slug === "key_personnel");
  const orgChartUrl =
    kpSection &&
    (kpSection.content.org_chart_mode || "upload") === "upload"
      ? (kpSection.content.org_chart_image as string | undefined) || ""
      : "";

  const [logoBase64, coverPhotoBase64, orgChartBase64] = await Promise.all([
    resolveImageToBase64(data.logoUrl || ""),
    resolveImageToBase64(data.coverPhotoUrl || ""),
    resolveImageToBase64(orgChartUrl),
  ]);

  return { logoBase64, coverPhotoBase64, orgChartBase64 };
}
