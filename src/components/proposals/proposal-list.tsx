"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ProposalCard } from "@/components/proposals/proposal-card";
import { ProposalFilters } from "@/components/proposals/proposal-filters";
import { EmptyState } from "@/components/proposals/empty-state";
import { CreateProposalDialog } from "@/components/proposals/create-proposal-dialog";
import { RFPUploadDialog } from "@/components/proposals/rfp-upload-dialog";
import { Button } from "@/components/ui/button";
import { Plus, FileUp } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/lib/types/database";

type Proposal = Tables<"proposals">;

export function ProposalList() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRfpDialog, setShowRfpDialog] = useState(false);

  const fetchProposals = useCallback(async () => {
    try {
      const res = await fetch("/api/proposals/list");
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.client_name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [proposals, search, statusFilter]);

  const handleDuplicate = async (id: string) => {
    toast.info("Duplicating proposal...");
    try {
      const res = await fetch(`/api/proposals/${id}/duplicate`, { method: "POST" });
      if (!res.ok) {
        toast.error("Failed to duplicate proposal");
        return;
      }
      await res.json();
      await fetchProposals();
      toast.success("Proposal duplicated");
    } catch {
      toast.error("Duplication failed");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/proposals/${id}/archive`, { method: "POST" });
      if (!res.ok) {
        toast.error("Failed to archive proposal");
        return;
      }
      setProposals((prev) => prev.filter((p) => p.id !== id));
      toast.success("Proposal archived");
    } catch {
      toast.error("Failed to archive proposal");
    }
  };

  return (
    <>
      {loading || proposals.length === 0 ? (
        !showCreateDialog && <EmptyState onCreateNew={() => setShowCreateDialog(true)} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <ProposalFilters
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowCreateDialog(true)}
              >
                New Proposal
              </Button>
              <Button
                onClick={() => setShowRfpDialog(true)}
                className="bg-hms-navy hover:bg-hms-navy-light"
              >
                <FileUp className="mr-2 h-4 w-4" />
                Upload RFP
              </Button>
            </div>
          </div>

          {filteredProposals.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <p className="text-sm text-muted-foreground">
                No proposals match your filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onDuplicate={handleDuplicate}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <CreateProposalDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <RFPUploadDialog
        open={showRfpDialog}
        onOpenChange={setShowRfpDialog}
      />
    </>
  );
}
