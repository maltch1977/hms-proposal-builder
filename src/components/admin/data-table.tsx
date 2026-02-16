"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  searchField?: keyof T;
  searchPlaceholder?: string;
  onAdd?: () => void;
  addLabel?: string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  loading?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchField,
  searchPlaceholder = "Search...",
  onAdd,
  addLabel = "Add New",
  onRowClick,
  actions,
  loading,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");

  const filtered = searchField
    ? data.filter((item) => {
        const val = item[searchField];
        return typeof val === "string" && val.toLowerCase().includes(search.toLowerCase());
      })
    : data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {searchField && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-9"
            />
          </div>
        )}
        {onAdd && (
          <Button size="sm" className="h-9 gap-2" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" />
            {addLabel}
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left py-2.5 px-4 font-medium text-muted-foreground ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="text-right py-2.5 px-4 font-medium text-muted-foreground w-20">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-8 text-center text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="py-8 text-center text-muted-foreground"
                >
                  {search ? "No results found." : "No items yet."}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-border last:border-0 ${
                    onRowClick ? "cursor-pointer hover:bg-muted/30" : ""
                  }`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`py-2.5 px-4 ${col.className || ""}`}>
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                  {actions && (
                    <td className="py-2.5 px-4 text-right">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "item" : "items"}
        {search && ` matching "${search}"`}
      </p>
    </div>
  );
}
