import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/client";
import { EXECUTIVE_SUMMARY_SYSTEM } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { proposalData } = await request.json();
  if (!proposalData) {
    return NextResponse.json({ error: "Proposal data required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    const result = await generateText(
      `Generate a 2-paragraph executive summary for this proposal:\n\n${JSON.stringify(proposalData, null, 2)}`,
      { system: EXECUTIVE_SUMMARY_SYSTEM, maxTokens: 2048 }
    );

    return NextResponse.json({ html: result });
  } catch (err) {
    console.error("Executive summary error:", err);
    return NextResponse.json({ error: "Summary generation failed" }, { status: 500 });
  }
}
