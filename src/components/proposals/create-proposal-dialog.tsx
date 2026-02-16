"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceSearch, ManualAddressFields, type AddressFields } from "@/components/ui/address-autocomplete";
import { Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import type { SimilarProposal } from "@/lib/ai/types";

interface CreateProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyAddress: AddressFields = { street: "", city: "", state: "", zip: "" };

function formatAddress(addr: AddressFields): string {
  const parts = [addr.street];
  const cityStateZip = [addr.city, addr.state].filter(Boolean).join(", ");
  if (cityStateZip) parts.push(cityStateZip);
  if (addr.zip) parts[parts.length - 1] += " " + addr.zip;
  return parts.filter(Boolean).join("\n");
}

export function CreateProposalDialog({
  open,
  onOpenChange,
}: CreateProposalDialogProps) {
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState<AddressFields>(emptyAddress);
  const [clientConfirmed, setClientConfirmed] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [similarProposals, setSimilarProposals] = useState<SimilarProposal[]>([]);
  const [checkingSimilar, setCheckingSimilar] = useState(false);
  const router = useRouter();

  const resetAll = () => {
    setClientName("");
    setAddress(emptyAddress);
    setClientConfirmed(false);
    setManualMode(false);
    setTitle("");
    setSimilarProposals([]);
  };

  const checkSimilarProposals = async (client: string) => {
    setCheckingSimilar(true);
    try {
      const res = await fetch("/api/ai/find-similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: client,
          project_name: "",
          client_address: formatAddress(address),
        }),
      });
      if (res.ok) {
        const { matches } = await res.json();
        setSimilarProposals(matches || []);
      }
    } catch {
      // Silently fail — not critical
    }
    setCheckingSimilar(false);
  };

  const handleDuplicateFrom = async (proposalId: string) => {
    setLoading(true);
    toast.info("Duplicating proposal...");
    try {
      const res = await fetch(`/api/proposals/${proposalId}/duplicate`, { method: "POST" });
      if (!res.ok) {
        toast.error("Failed to duplicate");
        setLoading(false);
        return;
      }
      const data = await res.json();
      toast.success("Proposal duplicated");
      onOpenChange(false);
      resetAll();
      router.push(`/proposals/${data.id}`);
    } catch {
      toast.error("Duplication failed");
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!title || !clientName) return;

    setLoading(true);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          client_name: clientName,
          client_address: formatAddress(address),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create proposal.");
        setLoading(false);
        return;
      }

      toast.success("Proposal created");
      onOpenChange(false);
      resetAll();
      setLoading(false);
      router.push(`/proposals/${data.id}`);
    } catch (err) {
      console.error("Create proposal error:", err);
      toast.error("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        className="sm:max-w-2xl left-[calc(50%+120px)]"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          // Allow clicks on Google Places dropdown
          if (target.closest(".pac-container")) {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          // Prevent dialog from reclaiming focus from Google Places dropdown
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>New Proposal</DialogTitle>
          <DialogDescription>
            Search for the client business, confirm the details, then name your project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!manualMode ? (
            <PlaceSearch
              clientName={clientName}
              selectedAddress={address}
              confirmed={clientConfirmed}
              onSelect={(name, addr) => {
                setClientName(name);
                setAddress(addr);
              }}
              onConfirm={() => { setClientConfirmed(true); checkSimilarProposals(clientName); }}
              onReset={() => {
                setClientName("");
                setAddress(emptyAddress);
                setClientConfirmed(false);
              }}
              onManualEntry={() => setManualMode(true)}
            />
          ) : !clientConfirmed ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manualClientName">Client Name</Label>
                <Input
                  id="manualClientName"
                  placeholder="e.g., Columbia Memorial Hospital"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                />
              </div>
              <ManualAddressFields value={address} onChange={setAddress} />
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setManualMode(false)}
                >
                  Back to search
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-hms-navy hover:bg-hms-navy-light"
                  onClick={() => { setClientConfirmed(true); checkSimilarProposals(clientName); }}
                  disabled={!clientName || !address.street || !address.city || !address.state}
                >
                  Confirm Client
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {[address.street, [address.city, address.state].filter(Boolean).join(", "), address.zip].filter(Boolean).join(", ")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetAll}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {clientConfirmed && similarProposals.length > 0 && (
            <div className="rounded-lg border border-hms-gold/50 bg-hms-gold/5 p-3 space-y-2">
              <p className="text-sm font-medium text-foreground">
                Similar proposals found
              </p>
              <p className="text-xs text-muted-foreground">
                Start from an existing proposal to save time.
              </p>
              {similarProposals.map((sp) => (
                <div
                  key={sp.id}
                  className="flex items-center justify-between rounded-md border border-border bg-card p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{sp.title}</p>
                    <p className="text-xs text-muted-foreground">{sp.similarity_reason}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2 shrink-0 h-7 text-xs"
                    onClick={() => handleDuplicateFrom(sp.id)}
                    disabled={loading}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Use
                  </Button>
                </div>
              ))}
            </div>
          )}

          {clientConfirmed && (
            <div className="space-y-2">
              <Label htmlFor="title">Project Name</Label>
              <Input
                id="title"
                placeholder="e.g., HVAC Controls Upgrade"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && title) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
          )}

          {clientConfirmed && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-hms-navy hover:bg-hms-navy-light"
                disabled={loading || !title}
                onClick={handleCreate}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Proposal
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
