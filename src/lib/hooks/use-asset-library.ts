"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { AssetItem, AssetTypeConfig, LinkedRecord } from "@/lib/types/asset-library";

interface SelectedItem {
  junctionId: string;
  item: AssetItem;
  orderIndex: number;
}

export function useAssetLibrary(
  config: AssetTypeConfig,
  proposalId: string
) {
  const [allItems, setAllItems] = useState<AssetItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [listRes, linkedRes] = await Promise.all([
        fetch(config.endpoints.list).then((r) => r.json()),
        fetch(config.endpoints.linked(proposalId)).then((r) => r.json()),
      ]);

      const items: AssetItem[] = listRes[config.responseKeys.list] || [];
      setAllItems(items);

      const linked: LinkedRecord[] = linkedRes[config.responseKeys.linked] || [];
      const selected: SelectedItem[] = linked.map((rec) => {
        const nestedItem = rec[config.nestedKey] as AssetItem;
        return {
          junctionId: rec.id,
          item: nestedItem,
          orderIndex: rec.order_index ?? 0,
        };
      });
      setSelectedItems(selected.sort((a, b) => a.orderIndex - b.orderIndex));
    } catch {
      toast.error(`Failed to load ${config.labelPlural.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [config, proposalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((s) => s.item.id)),
    [selectedItems]
  );

  const filteredAvailable = useMemo(() => {
    const available = allItems.filter((item) => !selectedIds.has(item.id));
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter((item) =>
      config.searchFields.some((field) => {
        const val = (item as Record<string, unknown>)[field];
        return typeof val === "string" && val.toLowerCase().includes(q);
      })
    );
  }, [allItems, selectedIds, search, config.searchFields]);

  const addToProposal = useCallback(
    async (item: AssetItem) => {
      if (config.maxItems && selectedItems.length >= config.maxItems) {
        toast.error(`Maximum ${config.maxItems} ${config.labelPlural.toLowerCase()} allowed`);
        return;
      }

      const res = await fetch(config.endpoints.link(proposalId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [config.foreignKey]: item.id,
          order_index: selectedItems.length + 1,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || `Failed to add ${config.label.toLowerCase()}`);
        return;
      }

      // The response key for a single link varies — extract the junction id
      const responseData = json.study || json.member || json.ref;
      const junctionId = responseData?.id;

      setSelectedItems((prev) => [
        ...prev,
        { junctionId, item, orderIndex: selectedItems.length + 1 },
      ]);
    },
    [config, proposalId, selectedItems.length]
  );

  const removeFromProposal = useCallback(
    async (junctionId: string) => {
      const res = await fetch(config.endpoints.unlink(proposalId), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [config.unlinkBodyKey]: junctionId }),
      });

      if (!res.ok) {
        toast.error(`Failed to remove ${config.label.toLowerCase()}`);
        return;
      }

      setSelectedItems((prev) => prev.filter((s) => s.junctionId !== junctionId));
    },
    [config, proposalId]
  );

  const reorderSelected = useCallback(
    async (reordered: SelectedItem[]) => {
      setSelectedItems(reordered);

      const updates = reordered.map((s, i) => ({
        id: s.junctionId,
        order_index: i + 1,
      }));

      const res = await fetch(config.endpoints.reorder(proposalId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!res.ok) {
        toast.error("Failed to save order");
        fetchData();
      }
    },
    [config, proposalId, fetchData]
  );

  const createItem = useCallback(
    async (data: Record<string, unknown>) => {
      const res = await fetch(config.endpoints.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || `Failed to create ${config.label.toLowerCase()}`);
        return null;
      }

      const created: AssetItem = json[config.responseKeys.create];
      setAllItems((prev) => [...prev, created]);
      toast.success(`${config.label} created`);
      return created;
    },
    [config]
  );

  const updateItem = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      const res = await fetch(config.endpoints.update(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || `Failed to update ${config.label.toLowerCase()}`);
        return null;
      }

      const updated: AssetItem = json[config.responseKeys.update];
      setAllItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setSelectedItems((prev) =>
        prev.map((s) => (s.item.id === id ? { ...s, item: updated } : s))
      );
      toast.success(`${config.label} updated`);
      return updated;
    },
    [config]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const res = await fetch(config.endpoints.delete(id), {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || `Failed to delete ${config.label.toLowerCase()}`);
        return false;
      }

      setAllItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedItems((prev) => prev.filter((s) => s.item.id !== id));
      toast.success(`${config.label} deleted`);
      return true;
    },
    [config]
  );

  const getUsageCount = useCallback(
    async (id: string): Promise<number> => {
      const res = await fetch(`${config.endpoints.delete(id)}?count_only=true`, {
        method: "DELETE",
      });
      const json = await res.json();
      return json.usage_count ?? 0;
    },
    [config]
  );

  return {
    allItems,
    selectedItems,
    filteredAvailable,
    loading,
    search,
    setSearch,
    addToProposal,
    removeFromProposal,
    reorderSelected,
    createItem,
    updateItem,
    deleteItem,
    getUsageCount,
    refetch: fetchData,
  };
}
