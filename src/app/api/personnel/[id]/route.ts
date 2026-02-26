import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, organization_id")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthedProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const {
    full_name, title, role_type, years_in_industry, years_at_company,
    years_with_distech, task_description, specialties, certifications, is_active,
  } = body;

  const admin = getAdminClient();

  const { data: existing } = await admin
    .from("personnel")
    .select("id")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (full_name !== undefined) updateData.full_name = full_name;
  if (title !== undefined) updateData.title = title;
  if (role_type !== undefined) updateData.role_type = role_type;
  if (years_in_industry !== undefined) updateData.years_in_industry = years_in_industry || null;
  if (years_at_company !== undefined) updateData.years_at_company = years_at_company || null;
  if (years_with_distech !== undefined) updateData.years_with_distech = years_with_distech || null;
  if (task_description !== undefined) updateData.task_description = task_description || null;
  if (specialties !== undefined) updateData.specialties = specialties;
  if (certifications !== undefined) updateData.certifications = certifications;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data: person, error } = await admin
    .from("personnel")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ person });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getAuthedProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = getAdminClient();

  const { data: existing } = await admin
    .from("personnel")
    .select("id")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("count_only") === "true") {
    const { count } = await admin
      .from("proposal_team_members")
      .select("id", { count: "exact", head: true })
      .eq("personnel_id", id);

    return NextResponse.json({ usage_count: count || 0 });
  }

  await admin
    .from("proposal_team_members")
    .delete()
    .eq("personnel_id", id);

  const { error } = await admin
    .from("personnel")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
