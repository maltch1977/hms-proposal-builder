import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COLLABORATOR_COLORS = [
  "#FFEB3B", // bright yellow
  "#FF9100", // bright orange
  "#FF4081", // hot pink
  "#AA00FF", // bright purple
  "#00E676", // bright green
  "#00B0FF", // bright blue
  "#FF6E40", // bright coral
  "#E040FB", // bright magenta
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("proposal_collaborators")
    .select(`
      id,
      profile_id,
      role,
      color,
      created_at,
      profiles:profile_id (full_name, email, avatar_url)
    `)
    .eq("proposal_id", proposalId)
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (data || []).map((c) => {
    const profile = c.profiles as unknown as {
      full_name: string;
      email: string;
      avatar_url: string | null;
    };
    return {
      id: c.id,
      profile_id: c.profile_id,
      role: c.role,
      color: c.color,
      name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
    };
  });

  return NextResponse.json(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profile_id, role } = await request.json();
  if (!profile_id) {
    return NextResponse.json({ error: "profile_id required" }, { status: 400 });
  }

  // Get the count of existing collaborators to pick the next color
  const { count } = await supabase
    .from("proposal_collaborators")
    .select("id", { count: "exact", head: true })
    .eq("proposal_id", proposalId);

  const colorIndex = (count || 0) % COLLABORATOR_COLORS.length;

  const { error } = await supabase.from("proposal_collaborators").insert({
    proposal_id: proposalId,
    profile_id,
    role: role || "editor",
    added_by: user.id,
    color: COLLABORATOR_COLORS[colorIndex],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profile_id } = await request.json();
  if (!profile_id) {
    return NextResponse.json({ error: "profile_id required" }, { status: 400 });
  }

  // Cannot remove the owner
  const { data: collab } = await supabase
    .from("proposal_collaborators")
    .select("role")
    .eq("proposal_id", proposalId)
    .eq("profile_id", profile_id)
    .single();

  if (collab?.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });
  }

  const { error } = await supabase
    .from("proposal_collaborators")
    .delete()
    .eq("proposal_id", proposalId)
    .eq("profile_id", profile_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
