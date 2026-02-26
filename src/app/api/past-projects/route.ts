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
    error: authError,
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("[past-projects] auth.getUser failed:", authError?.message || "no user");
    return null;
  }
  console.log("[past-projects] user:", user.id, user.email);

  const admin = getAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    console.error("[past-projects] profile lookup failed:", profileError?.message || "no profile row");
  }
  return profile;
}

export async function GET() {
  const profile = await getAuthedProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  const { data: projects, error } = await admin
    .from("past_projects")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("project_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: projects || [] });
}

export async function POST(request: Request) {
  const profile = await getAuthedProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { project_name, client_name, project_type, building_type, narrative, square_footage } = body;

  if (!project_name || !client_name || !building_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data: project, error } = await admin
    .from("past_projects")
    .insert({
      organization_id: profile.organization_id,
      project_name,
      client_name,
      project_type: project_type || "HVAC Controls",
      building_type,
      narrative: narrative || null,
      square_footage: square_footage || null,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ project });
}
