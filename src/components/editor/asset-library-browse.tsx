"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { AssetCard, SortableAssetCard } from "@/components/editor/asset-library-card";
import type { AssetItem, AssetTypeConfig } from "@/lib/types/asset-library";

interface SelectedItem {
  junctionId: string;
  item: AssetItem;
  orderIndex: number;
}

interface AssetLibraryBrowseProps {
  config: AssetTypeConfig;
  selectedItems: SelectedItem[];
  filteredAvailable: AssetItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: (item: AssetItem) => void;
  onRemove: (junctionId: string) => void;
  onReorder: (items: SelectedItem[]) => void;
  onEdit: (item: AssetItem) => void;
  onDelete: (item: AssetItem) => void;
  onCreate: () => void;
  loading: boolean;
}

export function AssetLibraryBrowse({
  config,
  selectedItems,
  filteredAvailable,
  search,
  onSearchChange,
  onAdd,
  onRemove,
  onReorder,
  onEdit,
  onDelete,
  onCreate,
  loading,
}: AssetLibraryBrowseProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedItems.findIndex((s) => s.junctionId === active.id);
    const newIndex = selectedItems.findIndex((s) => s.junctionId === over.id);

    const newOrder = [...selectedItems];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    onReorder(newOrder.map((s, i) => ({ ...s, orderIndex: i + 1 })));
  };

  const atMax = config.maxItems ? selectedItems.length >= config.maxItems : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + Create */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${config.labelPlural.toLowerCase()}...`}
            className="pl-9 h-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 shrink-0"
          onClick={onCreate}
          title={`Create new ${config.label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
        {/* Selected items */}
        {selectedItems.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Selected ({selectedItems.length}{config.maxItems ? `/${config.maxItems}` : ""})
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={selectedItems.map((s) => s.junctionId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {selectedItems.map((selected) => (
                    <SortableAssetCard
                      key={selected.junctionId}
                      id={selected.junctionId}
                      item={selected.item}
                      config={config}
                      onEdit={() => onEdit(selected.item)}
                      onDelete={() => onDelete(selected.item)}
                      onRemove={() => onRemove(selected.junctionId)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Available items */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Available
          </p>
          {filteredAvailable.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {search ? "No matches found" : `All ${config.labelPlural.toLowerCase()} are selected`}
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredAvailable.map((item) => (
                <AssetCard
                  key={item.id}
                  item={item}
                  config={config}
                  onAdd={atMax ? undefined : () => onAdd(item)}
                  onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
