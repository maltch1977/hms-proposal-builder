"use client";

import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAssetLibrary } from "@/lib/hooks/use-asset-library";
import { ASSET_CONFIGS } from "@/lib/config/asset-registry";
import { AssetLibraryBrowse } from "@/components/editor/asset-library-browse";
import { AssetLibraryForm } from "@/components/editor/asset-library-form";
import { DeleteAssetDialog } from "@/components/editor/delete-asset-dialog";
import type { AssetItem, AssetTypeKey, PanelView } from "@/lib/types/asset-library";

interface AssetLibraryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetType: AssetTypeKey;
  proposalId: string;
  /** Called when selected items change (for parent components that need to react) */
  onSelectionChange?: () => void;
  /** If set, opens directly to edit form for this item */
  initialEditItem?: AssetItem | null;
}

export function AssetLibraryPanel({
  open,
  onOpenChange,
  assetType,
  proposalId,
  onSelectionChange,
  initialEditItem,
}: AssetLibraryPanelProps) {
  const config = ASSET_CONFIGS[assetType];
  const library = useAssetLibrary(config, proposalId);

  const [view, setView] = useState<PanelView>("browse");
  const [editingItem, setEditingItem] = useState<AssetItem | null>(null);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<AssetItem | null>(null);
  const [deleteUsage, setDeleteUsage] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = useCallback((item: AssetItem) => {
    setEditingItem(item);
    setView("form");
  }, []);

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    setView("form");
  }, []);

  const handleFormSave = useCallback(
    async (data: Record<string, unknown>) => {
      if (editingItem) {
        const updated = await library.updateItem(editingItem.id, data);
        if (updated) {
          setView("browse");
          onSelectionChange?.();
        }
        return updated;
      } else {
        const created = await library.createItem(data);
        if (created) {
          setView("browse");
        }
        return created;
      }
    },
    [editingItem, library, onSelectionChange]
  );

  const handleFormCancel = useCallback(() => {
    setView("browse");
    setEditingItem(null);
  }, []);

  const handleDeleteStart = useCallback(
    async (item: AssetItem) => {
      setDeleteTarget(item);
      setDeleteUsage(null);
      const count = await library.getUsageCount(item.id);
      setDeleteUsage(count);
    },
    [library]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const success = await library.deleteItem(deleteTarget.id);
    setDeleting(false);
    if (success) {
      setDeleteTarget(null);
      onSelectionChange?.();
    }
  }, [deleteTarget, library, onSelectionChange]);

  const handleAdd = useCallback(
    async (item: AssetItem) => {
      await library.addToProposal(item);
      onSelectionChange?.();
    },
    [library, onSelectionChange]
  );

  const handleRemove = useCallback(
    async (junctionId: string) => {
      await library.removeFromProposal(junctionId);
      onSelectionChange?.();
    },
    [library, onSelectionChange]
  );

  // Reset view when panel opens, or jump to edit if initialEditItem is set
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        if (initialEditItem) {
          setEditingItem(initialEditItem);
          setView("form");
        } else {
          setView("browse");
          setEditingItem(null);
        }
      }
      onOpenChange(isOpen);
    },
    [onOpenChange, initialEditItem]
  );

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="w-[95vw] sm:max-w-xl flex flex-col p-0"
          showCloseButton={view === "browse"}
        >
          <SheetHeader className="px-4 pt-4 pb-0">
            {view === "form" && (
              <Button
                variant="ghost"
                size="sm"
                className="w-fit gap-1.5 -ml-2 mb-1 h-8"
                onClick={handleFormCancel}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            )}
            <SheetTitle>
              {view === "form"
                ? editingItem
                  ? `Edit ${config.label}`
                  : `New ${config.label}`
                : `Manage ${config.labelPlural}`}
            </SheetTitle>
            {view === "browse" && (
              <SheetDescription>
                Select {config.labelPlural.toLowerCase()} for this proposal. Drag to reorder.
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-hidden pt-3">
            {view === "browse" ? (
              <AssetLibraryBrowse
                config={config}
                selectedItems={library.selectedItems}
                filteredAvailable={library.filteredAvailable}
                search={library.search}
                onSearchChange={library.setSearch}
                onAdd={handleAdd}
                onRemove={handleRemove}
                onReorder={library.reorderSelected}
                onEdit={handleEdit}
                onDelete={handleDeleteStart}
                onCreate={handleCreate}
                loading={library.loading}
              />
            ) : (
              <div className="px-4 pb-4 overflow-y-auto h-full">
                <AssetLibraryForm
                  assetType={assetType}
                  item={editingItem}
                  onSave={handleFormSave}
                  onCancel={handleFormCancel}
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <DeleteAssetDialog
        open={deleteTarget !== null}
        onOpenChange={(isOpen) => { if (!isOpen) setDeleteTarget(null); }}
        itemName={deleteTarget ? config.getTitle(deleteTarget) : ""}
        usageCount={deleteUsage}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />
    </>
  );
}
