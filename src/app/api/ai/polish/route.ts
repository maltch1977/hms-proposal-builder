import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/client";
import { POLISH_SYSTEM } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { html } = await request.json();
  if (!html) {
    return NextResponse.json({ error: "HTML content required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    const polished = await generateText(
      `Polish this proposal content:\n\n${html}`,
      { system: POLISH_SYSTEM, maxTokens: 4096 }
    );

    return NextResponse.json({ polished });
  } catch (err) {
    console.error("Polish error:", err);
    return NextResponse.json({ error: "Polishing failed" }, { status: 500 });
  }
}
