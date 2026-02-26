"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, X } from "lucide-react";

interface EmrEntry {
  year: string;
  rating: string;
}

interface EmrTableProps {
  entries?: EmrEntry[];
  onChange?: (entries: EmrEntry[]) => void;
  libraryEntries?: EmrEntry[];
}

export function EmrTable({ entries = [], onChange, libraryEntries = [] }: EmrTableProps) {
  const [newYear, setNewYear] = useState("");

  // Use library entries as display data when proposal has no entries yet
  const usingLibrary = entries.length === 0 && libraryEntries.length > 0;
  const displayEntries = usingLibrary ? libraryEntries : entries;

  const commitToProposal = (newEntries: EmrEntry[]) => {
    onChange?.(newEntries);
  };

  const handleAddYear = () => {
    const year = newYear.trim() || String(new Date().getFullYear());
    const base = usingLibrary ? [...libraryEntries] : [...entries];
    if (base.some((e) => e.year === year)) return;
    commitToProposal([...base, { year, rating: "" }]);
    setNewYear("");
  };

  const handleRatingChange = (index: number, rating: string) => {
    const base = usingLibrary ? [...libraryEntries] : [...entries];
    const updated = base.map((e, i) => (i === index ? { ...e, rating } : e));
    commitToProposal(updated);
  };

  const handleRemoveYear = (index: number) => {
    const base = usingLibrary ? [...libraryEntries] : [...entries];
    commitToProposal(base.filter((_, i) => i !== index));
  };

  const sorted = [...displayEntries].sort((a, b) => Number(b.year) - Number(a.year));

  if (displayEntries.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Add your EMR (Experience Modification Rate) for recent years.
        </p>
        <div className="flex items-center gap-2">
          <Input
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            placeholder={String(new Date().getFullYear())}
            className="h-8 w-24 text-sm"
          />
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleAddYear}>
            <Plus className="h-3.5 w-3.5" />
            Add Year
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {usingLibrary && (
        <p className="text-xs text-muted-foreground italic">
          Pre-filled from your EMR library. Editing will save to this proposal.
        </p>
      )}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-hms-navy/5">
              {sorted.map((e, i) => (
                <TableHead key={i} className="text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    {e.year}
                    <button
                      type="button"
                      onClick={() => handleRemoveYear(displayEntries.indexOf(e))}
                      className="text-muted-foreground hover:text-destructive ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {sorted.map((e) => {
                const origIndex = displayEntries.indexOf(e);
                return (
                  <TableCell key={origIndex} className="text-center p-2">
                    <Input
                      value={e.rating}
                      onChange={(ev) => handleRatingChange(origIndex, ev.target.value)}
                      placeholder="e.g. 0.85"
                      className="h-8 text-sm text-center"
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={newYear}
          onChange={(e) => setNewYear(e.target.value)}
          placeholder={String(new Date().getFullYear())}
          className="h-8 w-24 text-sm"
        />
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleAddYear}>
          <Plus className="h-3.5 w-3.5" />
          Add Year
        </Button>
      </div>
    </div>
  );
}
