"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { FileUpload } from "@/components/editor/file-upload";
import { CollaboratorSelector } from "@/components/proposals/collaborator-selector";
import { Loader2, Check, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/providers/auth-provider";
import type { ParsedRFP } from "@/lib/ai/types";

interface RFPUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "parsing" | "review" | "collaborators" | "creating" | "generating";

interface GeneratingProgress {
  structure: "done" | "active" | "pending";
  content: "done" | "active" | "pending";
  team: "done" | "active" | "pending";
  finalizing: "done" | "active" | "pending";
}

function ProgressStep({ label, status }: { label: string; status: "done" | "active" | "pending" }) {
  return (
    <div className="flex items-center gap-3">
      {status === "done" && <Check className="h-4 w-4 text-emerald-600" />}
      {status === "active" && <Loader2 className="h-4 w-4 animate-spin text-hms-navy" />}
      {status === "pending" && <CircleDashed className="h-4 w-4 text-muted-foreground/40" />}
      <span
        className={
          status === "done"
            ? "text-sm text-emerald-600"
            : status === "active"
              ? "text-sm font-medium text-foreground"
              : "text-sm text-muted-foreground/60"
        }
      >
        {label}
      </span>
    </div>
  );
}

export function RFPUploadDialog({ open, onOpenChange }: RFPUploadDialogProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>("upload");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRFP | null>(null);
  const [projectName, setProjectName] = useState("");
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);
  const [genProgress, setGenProgress] = useState<GeneratingProgress>({
    structure: "pending",
    content: "pending",
    team: "pending",
    finalizing: "pending",
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    setStep("upload");
    setFileUrl(null);
    setParsedData(null);
    setProjectName("");
    setSelectedCollaborators(profile?.id ? [profile.id] : []);
    setCreatedProposalId(null);
    setGenProgress({
      structure: "pending",
      content: "pending",
      team: "pending",
      finalizing: "pending",
    });
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleFileUpload = useCallback(
    async (file: File): Promise<string | null> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "proposal-files");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "File upload failed");
        return null;
      }

      const data = await res.json();
      setFileUrl(data.url);

      // Auto-start parsing
      setStep("parsing");
      try {
        const parseRes = await fetch("/api/ai/parse-rfp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bucket: "proposal-files", path: data.path }),
        });

        if (!parseRes.ok) {
          const errData = await parseRes.json().catch(() => ({}));
          toast.error(errData.error || "Failed to analyze the document");
          setStep("upload");
          return data.url;
        }

        const parsed = await parseRes.json();
        setParsedData(parsed);
        setProjectName(parsed.project_name || "");
        setStep("review");
      } catch {
        toast.error("Analysis failed");
        setStep("upload");
      }

      return data.url;
    },
    []
  );

  const handleSkipGeneration = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (createdProposalId) {
      toast.info("Skipped content generation — you can fill in content manually");
      onOpenChange(false);
      reset();
      router.push(`/proposals/${createdProposalId}`);
    }
  }, [createdProposalId, onOpenChange, router]);

  const handleCreate = async () => {
    if (!parsedData || !projectName) return;

    setStep("creating");
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectName,
          client_name: parsedData.client_name,
          client_address: parsedData.client_address,
          rfp_requirements: parsedData.requirements,
          deadline: parsedData.deadline,
          collaborator_ids: selectedCollaborators,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create proposal");
        setStep("review");
        return;
      }

      const newProposalId = data.id;
      setCreatedProposalId(newProposalId);

      // Transition to generating step
      setStep("generating");
      setGenProgress({
        structure: "done",
        content: "active",
        team: "pending",
        finalizing: "pending",
      });

      // Set a 90s timeout for skip fallback
      timeoutRef.current = setTimeout(() => {
        toast.warning("Generation is taking longer than expected");
      }, 90000);

      try {
        const populateRes = await fetch("/api/ai/populate-proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalId: newProposalId }),
        });

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (populateRes.ok) {
          const result = await populateRes.json();

          // Animate progress steps
          setGenProgress({
            structure: "done",
            content: "done",
            team: "active",
            finalizing: "pending",
          });

          await new Promise((r) => setTimeout(r, 600));

          setGenProgress({
            structure: "done",
            content: "done",
            team: "done",
            finalizing: "active",
          });

          await new Promise((r) => setTimeout(r, 400));

          setGenProgress({
            structure: "done",
            content: "done",
            team: "done",
            finalizing: "done",
          });

          await new Promise((r) => setTimeout(r, 300));

          const parts: string[] = [];
          if (result.sections_populated?.length > 0)
            parts.push(`${result.sections_populated.length} sections generated`);
          if (result.team_added > 0)
            parts.push(`${result.team_added} team members added`);
          if (result.references_added > 0)
            parts.push(`${result.references_added} references added`);
          if (result.case_studies_added > 0)
            parts.push(`${result.case_studies_added} case studies added`);

          toast.success(
            parts.length > 0
              ? `Proposal populated: ${parts.join(", ")}`
              : "Proposal created"
          );
        } else {
          toast.warning("Content generation failed — you can fill in content manually");
        }
      } catch {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        toast.warning("Content generation failed — you can fill in content manually");
      }

      onOpenChange(false);
      reset();
      router.push(`/proposals/${newProposalId}`);
    } catch {
      toast.error("Creation failed");
      setStep("review");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && step !== "generating" && step !== "creating") reset();
        if (step !== "generating" && step !== "creating") onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Upload RFP"}
            {step === "parsing" && "Analyzing Document..."}
            {step === "review" && "Review Extracted Details"}
            {step === "collaborators" && "Who's Working on This?"}
            {step === "creating" && "Creating Proposal..."}
            {step === "generating" && "Generating Content..."}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Upload an RFP document (PDF or image) to automatically extract project details."}
            {step === "parsing" &&
              "Reading and analyzing your document. This can take up to 5 minutes."}
            {step === "review" &&
              "Review the extracted information and adjust as needed."}
            {step === "collaborators" &&
              "Select team members who will collaborate on this proposal."}
            {step === "creating" && "Setting up your proposal..."}
            {step === "generating" &&
              "Generating tailored content for each section. This can take up to 5 minutes."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <FileUpload
            accept={{
              "application/pdf": [".pdf"],
              "image/*": [".png", ".jpg", ".jpeg"],
            }}
            onUpload={handleFileUpload}
            label="Upload RFP document"
          />
        )}

        {step === "parsing" && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-hms-navy" />
            <p className="mt-4 text-sm text-muted-foreground">
              Extracting project details...
            </p>
          </div>
        )}

        {step === "review" && parsedData && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Client Name</Label>
                <Input
                  value={parsedData.client_name}
                  onChange={(e) =>
                    setParsedData({ ...parsedData, client_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Client Address</Label>
                <Input
                  value={parsedData.client_address}
                  onChange={(e) =>
                    setParsedData({
                      ...parsedData,
                      client_address: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Project Name</Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              {parsedData.deadline && (
                <div className="space-y-1">
                  <Label className="text-xs">Deadline</Label>
                  <Input value={parsedData.deadline.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$2-$3-$1")} readOnly />
                </div>
              )}
            </div>

          </div>
        )}

        {step === "collaborators" && (
          <CollaboratorSelector
            selectedIds={selectedCollaborators}
            onChange={setSelectedCollaborators}
            currentUserId={profile?.id}
          />
        )}

        {step === "creating" && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-hms-navy" />
            <p className="mt-4 text-sm text-muted-foreground">
              Creating your proposal...
            </p>
          </div>
        )}

        {step === "generating" && (
          <div className="py-8 px-4 space-y-4">
            <ProgressStep label="Creating proposal structure" status={genProgress.structure} />
            <ProgressStep label="Generating section content" status={genProgress.content} />
            <ProgressStep label="Adding team & references" status={genProgress.team} />
            <ProgressStep label="Finalizing" status={genProgress.finalizing} />
          </div>
        )}

        {step === "review" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => { reset(); }}>
              Start Over
            </Button>
            <Button
              className="bg-hms-navy hover:bg-hms-navy-light"
              disabled={!projectName || !parsedData?.client_name}
              onClick={() => {
                if (profile?.id && !selectedCollaborators.includes(profile.id)) {
                  setSelectedCollaborators([profile.id]);
                }
                setStep("collaborators");
              }}
            >
              Next
            </Button>
          </DialogFooter>
        )}

        {step === "collaborators" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("review")}>
              Back
            </Button>
            <Button
              className="bg-hms-navy hover:bg-hms-navy-light"
              onClick={handleCreate}
            >
              Create & Generate
            </Button>
          </DialogFooter>
        )}

        {step === "generating" && (
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={handleSkipGeneration}>
              Skip & Edit Manually
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
