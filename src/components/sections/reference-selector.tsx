"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Phone, Mail } from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils/format";
import type { Tables } from "@/lib/types/database";

type Reference = Tables<"references">;
type ProposalReference = Tables<"proposal_references">;

interface ReferenceSelectorProps {
  proposalId: string;
}

export function ReferenceSelector({ proposalId }: ReferenceSelectorProps) {
  const [allReferences, setAllReferences] = useState<Reference[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<
    (ProposalReference & { reference: Reference })[]
  >([]);
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      const [{ data: refs }, { data: selected }] = await Promise.all([
        supabase
          .from("references")
          .select("*")
          .eq("organization_id", profile.organization_id)
          .order("contact_name"),
        supabase
          .from("proposal_references")
          .select("*, reference:references(*)")
          .eq("proposal_id", proposalId)
          .order("order_index"),
      ]);

      setAllReferences(refs || []);
      setSelectedRefs(
        (selected || []).map((s) => ({
          ...s,
          reference: (s as unknown as { reference: Reference }).reference,
        }))
      );
    };

    fetchData();
  }, [profile, proposalId, supabase]);

  const selectedIds = new Set(selectedRefs.map((s) => s.reference_id));
  const available = allReferences.filter((r) => !selectedIds.has(r.id));

  const handleAdd = async (ref: Reference) => {
    const { data, error } = await supabase
      .from("proposal_references")
      .insert({
        proposal_id: proposalId,
        reference_id: ref.id,
        order_index: selectedRefs.length + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setSelectedRefs((prev) => [...prev, { ...data, reference: ref }]);
    }

    setOpen(false);
  };

  const handleRemove = async (propRefId: string) => {
    const { error } = await supabase
      .from("proposal_references")
      .delete()
      .eq("id", propRefId);

    if (!error) {
      setSelectedRefs((prev) => prev.filter((s) => s.id !== propRefId));
    }
  };

  return (
    <div className="space-y-3">
      {selectedRefs.map((propRef) => (
        <div
          key={propRef.id}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h5 className="text-sm font-medium text-foreground">
                {propRef.reference.contact_name}
              </h5>
              <Badge variant="outline" className="text-xs">
                {propRef.reference.category}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {propRef.reference.title} — {propRef.reference.company}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {formatPhoneNumber(propRef.reference.phone)}
              </span>
              {propRef.reference.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {propRef.reference.email}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0"
            onClick={() => handleRemove(propRef.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add Reference
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search references..." />
            <CommandList>
              <CommandEmpty>No references available.</CommandEmpty>
              <CommandGroup>
                {available.map((ref) => (
                  <CommandItem
                    key={ref.id}
                    value={`${ref.contact_name} ${ref.company}`}
                    onSelect={() => handleAdd(ref)}
                    className="py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {ref.contact_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ref.title} — {ref.company} &middot; {ref.category}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
