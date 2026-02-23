import { createClient } from "@/lib/supabase/server";
import { EditorLayout } from "@/components/editor/editor-layout";

interface ProposalEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalEditorPage({ params }: ProposalEditorPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isCollaboratorOnly = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isCollaboratorOnly = profile?.role === "proposal_user";
  }

  return <EditorLayout proposalId={id} isCollaboratorOnly={isCollaboratorOnly} />;
}
