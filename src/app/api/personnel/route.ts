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

export async function GET() {
  const profile = await getAuthedProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  const { data: personnel, error } = await admin
    .from("personnel")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ personnel: personnel || [] });
}

export async function POST(request: Request) {
  const profile = await getAuthedProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { full_name, title, role_type, years_in_industry, years_at_company, years_with_distech, task_description, bio } = body;

  if (!full_name || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data: person, error } = await admin
    .from("personnel")
    .insert({
      organization_id: profile.organization_id,
      full_name,
      title,
      role_type: role_type || "Project Manager",
      years_in_industry: years_in_industry || null,
      years_at_company: years_at_company || null,
      years_with_distech: years_with_distech || null,
      task_description: task_description || null,
      bio: bio || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ person });
}
