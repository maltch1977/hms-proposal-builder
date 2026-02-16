import { EditorLayout } from "@/components/editor/editor-layout";

interface ProposalEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalEditorPage({ params }: ProposalEditorPageProps) {
  const { id } = await params;

  return <EditorLayout proposalId={id} />;
}
