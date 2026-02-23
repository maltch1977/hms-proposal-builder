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
    .from("proposal_case_studies")
    .select("*, project:past_projects(*)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const studies = (data || []).map((s) => ({
    id: s.id,
    past_project_id: s.past_project_id,
    project: (s as Record<string, unknown>).project,
  }));

  return NextResponse.json({ studies });
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
  const { past_project_id, order_index } = body;

  if (!past_project_id) {
    return NextResponse.json({ error: "Missing past_project_id" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("proposal_case_studies")
    .insert({
      proposal_id: proposalId,
      past_project_id,
      order_index: order_index || 1,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ study: data });
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
  const { study_id } = body;

  if (!study_id) {
    return NextResponse.json({ error: "Missing study_id" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("proposal_case_studies")
    .delete()
    .eq("id", study_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
