import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeImage, analyzeDocument, downloadStorageFile, stripCodeFences } from "@/lib/ai/client";
import { GANTT_ANALYSIS_SYSTEM } from "@/lib/ai/prompts";
import type { ExecutionStrategyData } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bucket, path } = await request.json();
  if (!bucket || !path) {
    return NextResponse.json({ error: "Bucket and path required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    const { base64, contentType } = await downloadStorageFile(supabase, bucket, path);

    let result: string;

    if (contentType.includes("pdf")) {
      result = await analyzeDocument(
        base64,
        "application/pdf",
        "Analyze this Gantt chart and extract a structured execution strategy.",
        { system: GANTT_ANALYSIS_SYSTEM, maxTokens: 4096 }
      );
    } else {
      const mediaType = contentType.includes("png") ? "image/png" : "image/jpeg";
      result = await analyzeImage(
        base64,
        mediaType as "image/png" | "image/jpeg",
        "Analyze this Gantt chart and extract a structured execution strategy.",
        { system: GANTT_ANALYSIS_SYSTEM, maxTokens: 4096 }
      );
    }

    let strategy: ExecutionStrategyData;
    try {
      strategy = JSON.parse(stripCodeFences(result));
    } catch {
      return NextResponse.json({ error: "Failed to parse Gantt analysis" }, { status: 500 });
    }

    return NextResponse.json({ strategy });
  } catch (err) {
    console.error("Gantt analysis error:", err);
    return NextResponse.json({ error: "Gantt analysis failed" }, { status: 500 });
  }
}
