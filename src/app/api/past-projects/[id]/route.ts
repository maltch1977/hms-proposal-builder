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
  const { project_name, client_name, project_type, building_type, narrative, square_footage, completion_date, photos } = body;

  const admin = getAdminClient();

  // Verify the project belongs to this org
  const { data: existing } = await admin
    .from("past_projects")
    .select("id")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (project_name !== undefined) updateData.project_name = project_name;
  if (client_name !== undefined) updateData.client_name = client_name;
  if (project_type !== undefined) updateData.project_type = project_type;
  if (building_type !== undefined) updateData.building_type = building_type;
  if (narrative !== undefined) updateData.narrative = narrative || null;
  if (square_footage !== undefined) updateData.square_footage = square_footage || null;
  if (completion_date !== undefined) updateData.completion_date = completion_date || null;
  if (photos !== undefined) updateData.photos = photos;

  const { data: project, error } = await admin
    .from("past_projects")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project });
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

  // Verify the project belongs to this org
  const { data: existing } = await admin
    .from("past_projects")
    .select("id")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check usage count
  const url = new URL(request.url);
  if (url.searchParams.get("count_only") === "true") {
    const { count } = await admin
      .from("proposal_case_studies")
      .select("id", { count: "exact", head: true })
      .eq("past_project_id", id);

    return NextResponse.json({ usage_count: count || 0 });
  }

  // Delete junction records first, then the project
  await admin
    .from("proposal_case_studies")
    .delete()
    .eq("past_project_id", id);

  const { error } = await admin
    .from("past_projects")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
