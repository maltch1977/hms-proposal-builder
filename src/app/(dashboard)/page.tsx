import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardRoot() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "proposal_user") {
      const { data: collab } = await supabase
        .from("proposal_collaborators")
        .select("proposal_id")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (collab) {
        redirect(`/proposals/${collab.proposal_id}`);
      }
    }
  }

  redirect("/proposals");
}
