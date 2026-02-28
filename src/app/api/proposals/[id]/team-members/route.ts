import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: proposalId } = await params;
  const admin = getAdminClient();

  const { data, error } = await admin
    .from("proposal_team_members")
    .select("*, personnel:personnel(*)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data || [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: proposalId } = await params;
  const body = await request.json();
  const { personnel_id, order_index } = body;

  if (!personnel_id) {
    return NextResponse.json({ error: "Missing personnel_id" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("proposal_team_members")
    .insert({
      proposal_id: proposalId,
      personnel_id,
      order_index: order_index || 1,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ member: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { member_id } = body;

  if (!member_id) {
    return NextResponse.json({ error: "Missing member_id" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("proposal_team_members")
    .delete()
    .eq("id", member_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const admin = getAdminClient();

  // Batch reorder mode
  if (body.updates && Array.isArray(body.updates)) {
    for (const { id, order_index } of body.updates as { id: string; order_index: number }[]) {
      const { error } = await admin
        .from("proposal_team_members")
        .update({ order_index })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true });
  }

  // Single member update mode
  const { member_id, hierarchy_position, role_override } = body;

  if (!member_id) {
    return NextResponse.json({ error: "Missing member_id" }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (hierarchy_position !== undefined) updatePayload.hierarchy_position = hierarchy_position;
  if (role_override !== undefined) updatePayload.role_override = role_override;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await admin
    .from("proposal_team_members")
    .update(updatePayload)
    .eq("id", member_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
