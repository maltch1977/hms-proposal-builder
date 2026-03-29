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
import { Loader2, FileUp, PenLine } from "lucide-react";
import { toast } from "sonner";

type BuildMode = "build_manually" | "upload_rfp";

interface CreateProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestRfpUpload?: (prefill: { clientName: string; clientAddress: string; projectName: string }) => void;
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
  onRequestRfpUpload,
}: CreateProposalDialogProps) {
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState<AddressFields>(emptyAddress);
  const [clientConfirmed, setClientConfirmed] = useState(false);
  const [manualMode, setManualMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [buildMode, setBuildMode] = useState<BuildMode>("build_manually");
  const router = useRouter();

  const resetAll = () => {
    setClientName("");
    setAddress(emptyAddress);
    setClientConfirmed(false);
    setManualMode(true);
    setTitle("");
    setBuildMode("build_manually");
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
          build_mode: "manual",
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
          if (target.closest(".pac-container")) {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>New Proposal</DialogTitle>
          <DialogDescription>
            Enter the client details, then name your project.
          </DialogDescription>
        </DialogHeader>

        {/* Fixed-height form body — all slots always mounted, visibility controlled via CSS */}
        <div className="flex h-[380px] flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Client entry zone — stable min-height across all three states */}
            <div className="min-h-[200px]">
              {!manualMode ? (
                <PlaceSearch
                  clientName={clientName}
                  selectedAddress={address}
                  confirmed={clientConfirmed}
                  onSelect={(name, addr) => {
                    setClientName(name);
                    setAddress(addr);
                  }}
                  onConfirm={() => { setClientConfirmed(true); }}
                  onReset={() => {
                    setClientName("");
                    setAddress(emptyAddress);
                    setClientConfirmed(false);
                  }}
                  onManualEntry={() => setManualMode(true)}
                />
              ) : !clientConfirmed ? (
                <div className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="manualClientName">Client Name</Label>
                    <Input
                      id="manualClientName"
                      className="h-9"
                      placeholder="e.g., Columbia Memorial Hospital"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                    />
                    {/* Reserved helper slot — prevents shift if helper text is added later */}
                    <div className="h-4" />
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
                      Search business directory
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-hms-navy hover:bg-hms-navy-light"
                      onClick={() => { setClientConfirmed(true); }}
                      disabled={!clientName || !address.street || !address.city || !address.state}
                    >
                      Confirm Client
                    </Button>
                  </div>
                </div>
              ) : (
                /* Confirmed state: all three slots always rendered with fixed gaps */
                <div className="flex flex-col gap-4">
                  {/* Slot 1: confirmed client card */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{clientName}</p>
                        <p className="text-sm text-muted-foreground truncate">
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

                  {/* Slot 2: project name — always mounted */}
                  <div className="space-y-1.5">
                    <Label htmlFor="title">Project Name</Label>
                    <Input
                      id="title"
                      className="h-9"
                      placeholder="e.g., HVAC Controls Upgrade"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && title) {
                          e.preventDefault();
                          if (buildMode === "build_manually") handleCreate();
                        }
                      }}
                    />
                    {/* Reserved helper slot */}
                    <div className="h-4" />
                  </div>

                  {/* Slot 3: mode selector — always mounted, visibility toggled */}
                  <div
                    className={`flex items-center gap-1 rounded-md border p-1 ${
                      title
                        ? "border-border"
                        : "border-transparent invisible pointer-events-none"
                    }`}
                    aria-hidden={!title}
                  >
                    <button
                      type="button"
                      tabIndex={title ? 0 : -1}
                      onClick={() => setBuildMode("build_manually")}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium ${
                        buildMode === "build_manually"
                          ? "bg-hms-navy text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <PenLine className="h-3.5 w-3.5" />
                      Build Manually
                    </button>
                    <button
                      type="button"
                      tabIndex={title ? 0 : -1}
                      onClick={() => setBuildMode("upload_rfp")}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium ${
                        buildMode === "upload_rfp"
                          ? "bg-hms-navy text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      Upload RFP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer — always mounted, visibility toggled to prevent height shift */}
          <div
            className={`mt-auto pt-4 border-t ${
              clientConfirmed
                ? ""
                : "invisible pointer-events-none"
            }`}
            aria-hidden={!clientConfirmed}
          >
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                tabIndex={clientConfirmed ? 0 : -1}
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-hms-navy hover:bg-hms-navy-light"
                tabIndex={clientConfirmed ? 0 : -1}
                disabled={loading || !title}
                onClick={() => {
                  if (buildMode === "upload_rfp") {
                    if (onRequestRfpUpload) {
                      onRequestRfpUpload({
                        clientName,
                        clientAddress: formatAddress(address),
                        projectName: title,
                      });
                    }
                    onOpenChange(false);
                    resetAll();
                  } else {
                    handleCreate();
                  }
                }}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {buildMode === "upload_rfp" ? "Continue to Upload" : "Create Proposal"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
