"use client";

import { useState, useEffect, useCallback } from "react";
import type { AssetTypeConfig, AssetItem } from "@/lib/types/asset-library";

interface SelectedAssetsSummaryProps {
  config: AssetTypeConfig;
  proposalId: string;
  refreshKey: number;
}

export function SelectedAssetsSummary({
  config,
  proposalId,
  refreshKey,
}: SelectedAssetsSummaryProps) {
  const [items, setItems] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinked = useCallback(async () => {
    try {
      const res = await fetch(config.endpoints.linked(proposalId));
      const json = await res.json();
      const linked = json[config.responseKeys.linked] || [];
      setItems(
        linked.map((rec: Record<string, unknown>) => rec[config.nestedKey] as AssetItem)
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [config, proposalId]);

  useEffect(() => {
    fetchLinked();
  }, [fetchLinked, refreshKey]);

  if (loading) return null;
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No {config.labelPlural.toLowerCase()} selected yet.
      </p>
    );
  }

  return (
    <div className="space-y-1.5 mt-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{config.getTitle(item)}</p>
            <p className="text-xs text-muted-foreground truncate">{config.getSubtitle(item)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
