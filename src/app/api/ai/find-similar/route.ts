import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai/client";
import { FIND_SIMILAR_SYSTEM } from "@/lib/ai/prompts";
import type { SimilarProposal } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { client_name, project_name, client_address } = await request.json();
  if (!client_name && !project_name) {
    return NextResponse.json({ error: "Client or project name required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    // Fetch existing proposals
    const { data: proposals } = await supabase
      .from("proposals")
      .select("id, title, client_name, client_address, status")
      .eq("organization_id", profile.organization_id)
      .neq("status", "archived")
      .limit(50);

    if (!proposals || proposals.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const result = await generateText(
      `New proposal:\n- Client: ${client_name}\n- Project: ${project_name}\n- Address: ${client_address || "N/A"}\n\nExisting proposals:\n${JSON.stringify(proposals, null, 2)}`,
      { system: FIND_SIMILAR_SYSTEM, maxTokens: 2048 }
    );

    let matches: SimilarProposal[];
    try {
      matches = JSON.parse(result);
    } catch {
      matches = [];
    }

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("Find similar error:", err);
    return NextResponse.json({ error: "Similarity search failed" }, { status: 500 });
  }
}
