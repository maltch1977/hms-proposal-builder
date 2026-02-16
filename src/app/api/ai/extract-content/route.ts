import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeImage, analyzeDocument, downloadStorageFile } from "@/lib/ai/client";
import { CONTENT_EXTRACT_SYSTEM } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bucket, path, fileUrl } = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    let base64: string;
    let contentType: string;

    if (bucket && path) {
      // Download from Supabase Storage
      const file = await downloadStorageFile(supabase, bucket, path);
      base64 = file.base64;
      contentType = file.contentType;
    } else if (fileUrl) {
      // Fallback to URL fetch
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return NextResponse.json({ error: "Failed to fetch file" }, { status: 400 });
      }
      const buffer = await response.arrayBuffer();
      base64 = Buffer.from(buffer).toString("base64");
      contentType = response.headers.get("content-type") || "";
    } else {
      return NextResponse.json({ error: "Bucket/path or fileUrl required" }, { status: 400 });
    }

    let html: string;

    if (contentType.includes("pdf")) {
      html = await analyzeDocument(
        base64,
        "application/pdf",
        "Extract all text content from this document and format as clean HTML.",
        { system: CONTENT_EXTRACT_SYSTEM, maxTokens: 8192 }
      );
    } else if (contentType.includes("image")) {
      const mediaType = contentType.includes("png")
        ? "image/png"
        : contentType.includes("gif")
          ? "image/gif"
          : contentType.includes("webp")
            ? "image/webp"
            : "image/jpeg";
      html = await analyzeImage(
        base64,
        mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
        "Extract all text content from this image and format as clean HTML.",
        { system: CONTENT_EXTRACT_SYSTEM, maxTokens: 8192 }
      );
    } else {
      // For other file types, try to read as text
      const text = Buffer.from(base64, "base64").toString("utf-8");
      html = `<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`;
    }

    return NextResponse.json({ html });
  } catch (err) {
    console.error("Content extraction error:", err);
    return NextResponse.json({ error: "Content extraction failed" }, { status: 500 });
  }
}
