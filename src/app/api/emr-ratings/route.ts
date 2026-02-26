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
  const { data: emrRatings, error } = await admin
    .from("emr_ratings")
    .select("year, rating")
    .eq("organization_id", profile.organization_id)
    .order("year");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    emrRatings: (emrRatings || []).map((r) => ({
      year: String(r.year),
      rating: String(r.rating),
    })),
  });
}
