import { Topbar } from "@/components/layout/topbar";
import { ProposalList } from "@/components/proposals/proposal-list";

export default function ProposalsPage() {
  return (
    <>
      <Topbar title="Proposals" />
      <div className="flex-1 overflow-auto p-6">
        <ProposalList />
      </div>
    </>
  );
}
