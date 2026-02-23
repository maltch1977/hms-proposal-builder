import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { ProposalList } from "@/components/proposals/proposal-list";

export default async function ProposalsPage() {
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

  return (
    <>
      <Topbar title="Proposals" />
      <div className="flex-1 overflow-auto p-6">
        <ProposalList />
      </div>
    </>
  );
}
