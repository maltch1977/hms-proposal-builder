import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/client";
import { QUALITY_CHECK_SYSTEM } from "@/lib/ai/prompts";
import type { QualityCheckIssue } from "@/lib/ai/types";

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
      `Review this proposal and identify quality issues:\n\n${JSON.stringify(proposalData, null, 2)}`,
      { system: QUALITY_CHECK_SYSTEM, maxTokens: 4096 }
    );

    let issues: QualityCheckIssue[];
    try {
      issues = JSON.parse(result);
    } catch {
      issues = [];
    }

    return NextResponse.json({ issues });
  } catch (err) {
    console.error("Quality check error:", err);
    return NextResponse.json({ error: "Quality check failed" }, { status: 500 });
  }
}
