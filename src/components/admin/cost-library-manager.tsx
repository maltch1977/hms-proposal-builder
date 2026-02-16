"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/format";
import type { Tables } from "@/lib/types/database";

type CostLibraryItem = Tables<"cost_library_items">;

const TYPE_LABELS: Record<string, string> = {
  base: "Base",
  adder: "Adder",
  deduct: "Deduct",
};

const TYPE_COLORS: Record<string, string> = {
  base: "default",
  adder: "secondary",
  deduct: "outline",
};

export function CostLibraryManager() {
  const [items, setItems] = useState<CostLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CostLibraryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"base" | "adder" | "deduct">("base");
  const [amount, setAmount] = useState("");

  const { profile } = useAuth();
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("cost_library_items")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("description");

    setItems(data || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openForm = (item?: CostLibraryItem) => {
    if (item) {
      setEditing(item);
      setDescription(item.description);
      setType(item.type);
      setAmount(item.default_amount?.toString() || "");
    } else {
      setCreating(true);
      setDescription("");
      setType("base");
      setAmount("");
    }
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const data = {
      description,
      type,
      default_amount: amount ? parseFloat(amount) : null,
    };

    if (editing) {
      const { error } = await supabase
        .from("cost_library_items")
        .update(data)
        .eq("id", editing.id);

      if (error) toast.error("Failed to update");
      else {
        toast.success("Cost item updated");
        closeForm();
        fetchItems();
      }
    } else {
      const { error } = await supabase.from("cost_library_items").insert({
        ...data,
        organization_id: profile.organization_id,
      });

      if (error) toast.error("Failed to create");
      else {
        toast.success("Cost item created");
        closeForm();
        fetchItems();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("cost_library_items")
      .delete()
      .eq("id", id);
    if (!error) {
      toast.success("Cost item deleted");
      fetchItems();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Cost Library</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage reusable cost line items for proposals.
        </p>
      </div>

      <DataTable
        data={items}
        columns={[
          {
            key: "description",
            header: "Description",
            render: (i) => <span className="font-medium">{i.description}</span>,
          },
          {
            key: "type",
            header: "Type",
            render: (i) => (
              <Badge variant={TYPE_COLORS[i.type] as "default" | "secondary" | "outline"} className="text-xs">
                {TYPE_LABELS[i.type]}
              </Badge>
            ),
          },
          {
            key: "default_amount",
            header: "Default Amount",
            render: (i) => (
              <span className="text-muted-foreground">
                {i.default_amount != null ? formatCurrency(i.default_amount) : "—"}
              </span>
            ),
            className: "text-right",
          },
        ]}
        searchField="description"
        searchPlaceholder="Search cost items..."
        onAdd={() => openForm()}
        addLabel="Add Cost Item"
        loading={loading}
        actions={(i) => (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                openForm(i);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(i.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      />

      <Dialog open={creating || !!editing} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Cost Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cost-desc">Description</Label>
              <Input
                id="cost-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Line item description"
                required
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as "base" | "adder" | "deduct")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="adder">Adder</SelectItem>
                    <SelectItem value="deduct">Deduct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost-amt">Default Amount</Label>
                <Input
                  id="cost-amt"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={!description || saving}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
