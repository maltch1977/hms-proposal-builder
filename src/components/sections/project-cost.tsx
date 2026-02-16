"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils/format";
import { COST_ITEM_TYPES } from "@/lib/utils/constants";
import type { Tables } from "@/lib/types/database";

type CostItem = Tables<"proposal_cost_items">;

interface ProjectCostProps {
  proposalId: string;
}

export function ProjectCost({ proposalId }: ProjectCostProps) {
  const [items, setItems] = useState<CostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("proposal_cost_items")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("order_index");

    setItems(data || []);
    setLoading(false);
  }, [proposalId, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async (type: "base" | "adder" | "deduct") => {
    const { data, error } = await supabase
      .from("proposal_cost_items")
      .insert({
        proposal_id: proposalId,
        description: "",
        type,
        amount: 0,
        order_index: items.length + 1,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add cost item");
      return;
    }

    if (data) {
      setItems((prev) => [...prev, data]);
    }
  };

  const handleUpdate = async (
    id: string,
    field: "description" | "amount" | "type",
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );

    await supabase
      .from("proposal_cost_items")
      .update({ [field]: value })
      .eq("id", id);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase
      .from("proposal_cost_items")
      .delete()
      .eq("id", id);

    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const baseItems = items.filter((i) => i.type === "base");
  const adders = items.filter((i) => i.type === "adder");
  const deducts = items.filter((i) => i.type === "deduct");

  const baseTotal = baseItems.reduce((sum, i) => sum + i.amount, 0);
  const addersTotal = adders.reduce((sum, i) => sum + i.amount, 0);
  const deductsTotal = deducts.reduce((sum, i) => sum + i.amount, 0);
  const grandTotal = baseTotal + addersTotal - deductsTotal;

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Loading cost items...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Base Scope */}
      <CostSection
        title="Base Scope"
        items={baseItems}
        type="base"
        onAdd={() => handleAdd("base")}
        onUpdate={handleUpdate}
        onRemove={handleRemove}
        subtotal={baseTotal}
      />

      {/* Adders */}
      <div className="border-t border-border pt-6">
        <CostSection
          title="Adders / Alternates"
          items={adders}
          type="adder"
          onAdd={() => handleAdd("adder")}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          subtotal={addersTotal}
        />
      </div>

      {/* Deducts */}
      <div className="border-t border-border pt-6">
        <CostSection
          title="Deducts"
          items={deducts}
          type="deduct"
          onAdd={() => handleAdd("deduct")}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          subtotal={deductsTotal}
        />
      </div>

      {/* Grand Total */}
      <div className="border-t-2 border-foreground pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Grand Total
          </span>
          <span className="text-lg font-bold text-hms-navy">
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface CostSectionProps {
  title: string;
  items: CostItem[];
  type: "base" | "adder" | "deduct";
  onAdd: () => void;
  onUpdate: (
    id: string,
    field: "description" | "amount" | "type",
    value: string | number
  ) => void;
  onRemove: (id: string) => void;
  subtotal: number;
}

function CostSection({
  title,
  items,
  type,
  onAdd,
  onUpdate,
  onRemove,
  subtotal,
}: CostSectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 group"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
              <Input
                value={item.description}
                onChange={(e) =>
                  onUpdate(item.id, "description", e.target.value)
                }
                placeholder="Line item description..."
                className="flex-1 h-9"
              />
              <div className="relative w-32 flex-shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  value={item.amount || ""}
                  onChange={(e) =>
                    onUpdate(item.id, "amount", parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                  className="h-9 pl-7 text-right"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onAdd}
        >
          <Plus className="h-3 w-3" />
          Add {title === "Base Scope" ? "Line Item" : title === "Adders / Alternates" ? "Adder" : "Deduct"}
        </Button>
        {items.length > 0 && (
          <span className="text-sm font-medium text-muted-foreground">
            Subtotal: {formatCurrency(subtotal)}
          </span>
        )}
      </div>
    </div>
  );
}
