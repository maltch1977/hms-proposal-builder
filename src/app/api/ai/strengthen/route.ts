import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/client";
import { STRENGTHEN_SYSTEM } from "@/lib/ai/prompts";
import type { LanguageSuggestion } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sections } = await request.json();
  if (!sections || !Array.isArray(sections)) {
    return NextResponse.json({ error: "Sections array required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    const sectionsText = sections
      .map((s: { slug: string; name: string; html: string }) =>
        `--- Section: ${s.name} (${s.slug}) ---\n${s.html}`
      )
      .join("\n\n");

    const result = await generateText(
      `Analyze this proposal text for weak language and suggest stronger alternatives:\n\n${sectionsText}`,
      { system: STRENGTHEN_SYSTEM, maxTokens: 4096 }
    );

    let suggestions: LanguageSuggestion[];
    try {
      suggestions = JSON.parse(result);
    } catch {
      suggestions = [];
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Strengthen error:", err);
    return NextResponse.json({ error: "Language optimization failed" }, { status: 500 });
  }
}
