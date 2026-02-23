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
    .from("proposal_references")
    .select("*, reference:references(*)")
    .eq("proposal_id", proposalId)
    .order("order_index");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const refs = (data || []).map((s) => ({
    id: s.id,
    reference_id: s.reference_id,
    reference: (s as Record<string, unknown>).reference,
  }));

  return NextResponse.json({ refs });
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
  const { reference_id, order_index } = body;

  if (!reference_id) {
    return NextResponse.json({ error: "Missing reference_id" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("proposal_references")
    .insert({
      proposal_id: proposalId,
      reference_id,
      order_index: order_index || 1,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ref: data });
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
  const { ref_id } = body;

  if (!ref_id) {
    return NextResponse.json({ error: "Missing ref_id" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("proposal_references")
    .delete()
    .eq("id", ref_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
