import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const params = new URLSearchParams({
      text,
      language: "en-US",
      enabledOnly: "false",
    });

    const res = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!res.ok) {
      console.error("LanguageTool API error:", res.status);
      return NextResponse.json({ matches: [] });
    }

    const data = await res.json();
    return NextResponse.json({ matches: data.matches || [] });
  } catch (error) {
    console.error("Grammar check error:", error);
    return NextResponse.json({ matches: [] });
  }
}
