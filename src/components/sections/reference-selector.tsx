"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Phone, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/lib/utils/format";
import type { Tables } from "@/lib/types/database";

type Reference = Tables<"references">;

const REFERENCE_CATEGORIES = [
  "Owner",
  "Architect",
  "General Contractor",
  "Engineer",
  "Subcontractor",
  "Other",
];

interface ReferenceSelectorProps {
  proposalId: string;
}

export function ReferenceSelector({ proposalId }: ReferenceSelectorProps) {
  const [allReferences, setAllReferences] = useState<Reference[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<
    { id: string; reference_id: string; reference: Reference }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [refsRes, selectedRes] = await Promise.all([
        fetch("/api/references").then((r) => r.json()),
        fetch(`/api/proposals/${proposalId}/references`).then((r) => r.json()),
      ]);

      setAllReferences(refsRes.references || []);
      if (selectedRes.refs) {
        setSelectedRefs(selectedRes.refs);
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedIds = new Set(selectedRefs.map((s) => s.reference_id));
  const available = allReferences.filter((r) => !selectedIds.has(r.id));

  const handleAdd = async (ref: Reference) => {
    const res = await fetch(`/api/proposals/${proposalId}/references`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference_id: ref.id,
        order_index: selectedRefs.length + 1,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Failed to add reference");
      return;
    }

    setSelectedRefs((prev) => [
      ...prev,
      { id: json.ref.id, reference_id: ref.id, reference: ref },
    ]);
    setOpen(false);
  };

  const handleRemove = async (propRefId: string) => {
    const res = await fetch(`/api/proposals/${proposalId}/references`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_id: propRefId }),
    });

    if (res.ok) {
      setSelectedRefs((prev) => prev.filter((s) => s.id !== propRefId));
    }
  };

  const handleCreateAndAdd = async (data: {
    contact_name: string;
    title: string;
    company: string;
    phone: string;
    email?: string;
    category: string;
  }) => {
    // 1. Create the reference via API
    const createRes = await fetch("/api/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const createJson = await createRes.json();
    if (!createRes.ok || !createJson.reference) {
      toast.error(createJson.error || "Failed to create reference");
      return;
    }

    const reference: Reference = createJson.reference;

    // 2. Link to proposal via API
    const linkRes = await fetch(`/api/proposals/${proposalId}/references`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference_id: reference.id,
        order_index: selectedRefs.length + 1,
      }),
    });

    const linkJson = await linkRes.json();
    if (!linkRes.ok || !linkJson.ref) {
      toast.error("Created reference but failed to link to proposal");
      return;
    }

    toast.success(`"${data.contact_name}" added — visible below`);
    setSelectedRefs((prev) => [
      ...prev,
      { id: linkJson.ref.id, reference_id: reference.id, reference },
    ]);
    setAllReferences((prev) => [...prev, reference]);
    setShowCreate(false);
    setOpen(false);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading references...</p>;
  }

  return (
    <div className="space-y-3">
      {selectedRefs.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          No references added yet. Click &quot;Add Reference&quot; to create one — it will appear here.
        </p>
      )}

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

      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowCreate(false); }}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add Reference
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="start">
          {showCreate ? (
            <InlineCreateReference
              onSubmit={handleCreateAndAdd}
              onCancel={() => setShowCreate(false)}
            />
          ) : (
            <Command>
              <CommandInput placeholder="Search existing references..." />
              <CommandList>
                <CommandEmpty>No references found.</CommandEmpty>
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
                <div className="border-t border-border p-1">
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <span>Create New Reference</span>
                  </button>
                </div>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Inline form for creating a new reference */
function InlineCreateReference({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    contact_name: string;
    title: string;
    company: string;
    phone: string;
    email?: string;
    category: string;
  }) => void;
  onCancel: () => void;
}) {
  const [contactName, setContactName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Owner");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !title.trim() || !company.trim() || !phone.trim()) return;
    setSaving(true);
    await onSubmit({
      contact_name: contactName.trim(),
      title: title.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      category,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 space-y-3">
      <p className="text-sm font-medium">Create New Reference</p>

      <div className="space-y-2">
        <div>
          <Label className="text-xs">Contact Name *</Label>
          <Input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="e.g. John Smith"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div>
          <Label className="text-xs">Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Facilities Director"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Company / Organization *</Label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. City of Hillsboro"
            className="h-8 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Phone *</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (503) 555-1234"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@city.gov"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REFERENCE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 text-xs">
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!contactName.trim() || !title.trim() || !company.trim() || !phone.trim() || saving}
          className="h-7 text-xs"
        >
          {saving ? "Saving..." : "Save Reference"}
        </Button>
      </div>
    </form>
  );
}
