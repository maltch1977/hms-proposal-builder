"use client";

import { useState } from "react";
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

interface DeleteSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionName: string;
  onConfirm: () => void;
}

export function DeleteSectionDialog({
  open,
  onOpenChange,
  sectionName,
  onConfirm,
}: DeleteSectionDialogProps) {
  const [value, setValue] = useState("");

  const isConfirmed = value.toLowerCase() === "delete";

  const handleConfirm = () => {
    if (!isConfirmed) return;
    onConfirm();
    setValue("");
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) setValue("");
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete Section</DialogTitle>
          <DialogDescription>
            This will permanently remove <strong>{sectionName}</strong> and all
            its content from this proposal. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <label className="text-sm text-muted-foreground mb-2 block">
            Type <strong>delete</strong> to confirm
          </label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
            }}
            placeholder="delete"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed}
          >
            Delete Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
