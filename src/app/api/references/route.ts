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
  const { data: references, error } = await admin
    .from("references")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("contact_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ references: references || [] });
}

export async function POST(request: Request) {
  const profile = await getAuthedProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { contact_name, title, company, phone, email, category } = body;

  if (!contact_name || !title || !company || !phone || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data: reference, error } = await admin
    .from("references")
    .insert({
      organization_id: profile.organization_id,
      contact_name,
      title,
      company,
      phone,
      email: email || null,
      category,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reference });
}
