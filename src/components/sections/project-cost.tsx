"use client";

import { useState, useCallback } from "react";
import { FileUpload } from "@/components/editor/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, FileText, GripVertical } from "lucide-react";
import type { ProjectCostContent, PricingColumn, PricingRow } from "@/lib/types/section";

interface ProjectCostProps {
  content: ProjectCostContent;
  onChange: (content: ProjectCostContent) => void;
  proposalId: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

const DEFAULT_COLUMNS: PricingColumn[] = [
  { id: "base", name: "Base Cost", type: "base" },
];

const DEFAULT_ROWS: PricingRow[] = [
  { id: genId(), description: "", values: {} },
];

const COLUMN_TYPE_LABELS: Record<string, string> = {
  base: "Base Cost",
  alternate: "Add Alternate",
  value_engineering: "Value Engineering",
};

export function ProjectCost({ content, onChange, proposalId }: ProjectCostProps) {
  const columns = content.columns?.length ? content.columns : DEFAULT_COLUMNS;
  const rows = content.rows?.length ? content.rows : DEFAULT_ROWS;
  const files = content.files || [];
  const notes = content.notes || "";

  const update = useCallback(
    (patch: Partial<ProjectCostContent>) => {
      onChange({ ...content, ...patch });
    },
    [content, onChange]
  );

  // --- Column management ---
  const [addColType, setAddColType] = useState<"alternate" | "value_engineering">("alternate");

  const handleAddColumn = () => {
    const id = genId();
    const count = columns.filter((c) => c.type === addColType).length + 1;
    const label = addColType === "alternate"
      ? `Add Alternate ${count}`
      : `Value Engineering ${count}`;
    update({ columns: [...columns, { id, name: label, type: addColType }] });
  };

  const handleRemoveColumn = (colId: string) => {
    const updated = columns.filter((c) => c.id !== colId);
    // Clean column values from rows
    const updatedRows = rows.map((r) => {
      const vals = { ...r.values };
      delete vals[colId];
      return { ...r, values: vals };
    });
    update({ columns: updated, rows: updatedRows });
  };

  const handleRenameColumn = (colId: string, name: string) => {
    update({ columns: columns.map((c) => (c.id === colId ? { ...c, name } : c)) });
  };

  // --- Row management ---
  const handleAddRow = () => {
    update({ rows: [...rows, { id: genId(), description: "", values: {} }] });
  };

  const handleRemoveRow = (rowId: string) => {
    update({ rows: rows.filter((r) => r.id !== rowId) });
  };

  const handleRowDescription = (rowId: string, description: string) => {
    update({
      rows: rows.map((r) => (r.id === rowId ? { ...r, description } : r)),
    });
  };

  const handleCellChange = (rowId: string, colId: string, value: string) => {
    update({
      rows: rows.map((r) =>
        r.id === rowId ? { ...r, values: { ...r.values, [colId]: value } } : r
      ),
    });
  };

  // --- Column totals ---
  const getColumnTotal = (colId: string) => {
    let total = 0;
    for (const row of rows) {
      const val = parseFloat((row.values[colId] || "").replace(/[^0-9.-]/g, ""));
      if (!isNaN(val)) total += val;
    }
    return total;
  };

  // --- File upload ---
  const handleUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "proposal-files");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return null;

    const data = await res.json();
    const newFile = {
      url: data.url,
      path: data.path,
      filename: data.filename,
      type: file.type,
    };
    update({ files: [...files, newFile] });
    return data.url;
  };

  const handleRemoveFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    update({ files: updated });
  };

  return (
    <div className="space-y-6">
      {/* Pricing Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">Pricing</h4>
          <div className="flex items-center gap-2">
            <Select
              value={addColType}
              onValueChange={(v) => setAddColType(v as "alternate" | "value_engineering")}
            >
              <SelectTrigger className="h-8 w-[170px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alternate">Add Alternate</SelectItem>
                <SelectItem value="value_engineering">Value Engineering</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleAddColumn}>
              <Plus className="h-3.5 w-3.5" />
              Add Column
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-2.5 px-3 font-medium text-muted-foreground min-w-[200px]">
                  Line Item
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="text-right py-2.5 px-3 font-medium text-muted-foreground min-w-[150px]"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <Input
                        value={col.name}
                        onChange={(e) => handleRenameColumn(col.id, e.target.value)}
                        className="h-6 text-xs text-right font-medium border-0 bg-transparent p-0 focus:ring-0 max-w-[120px]"
                      />
                      {col.type !== "base" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(col.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 font-normal">
                      {COLUMN_TYPE_LABELS[col.type]}
                    </span>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="py-1.5 px-3">
                    <Input
                      value={row.description}
                      onChange={(e) => handleRowDescription(row.id, e.target.value)}
                      placeholder="Description..."
                      className="h-8 text-sm border-0 bg-transparent p-0 focus:ring-0"
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col.id} className="py-1.5 px-3">
                      <Input
                        value={row.values[col.id] || ""}
                        onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                        placeholder="$0.00"
                        className="h-8 text-sm text-right border-0 bg-transparent p-0 focus:ring-0"
                      />
                    </td>
                  ))}
                  <td className="py-1.5 px-1">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="py-2.5 px-3 text-sm font-semibold text-foreground">
                  Total
                </td>
                {columns.map((col) => {
                  const total = getColumnTotal(col.id);
                  return (
                    <td key={col.id} className="py-2.5 px-3 text-sm font-semibold text-right text-foreground">
                      {total > 0
                        ? `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                  );
                })}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <Button variant="ghost" size="sm" className="mt-2 h-8 gap-1.5 text-muted-foreground" onClick={handleAddRow}>
          <Plus className="h-3.5 w-3.5" />
          Add Row
        </Button>
      </div>

      {/* Notes */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Notes & Clarifications</h4>
        <Textarea
          value={notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Add any pricing notes, exclusions, or clarifications..."
          className="min-h-[80px] text-sm"
        />
      </div>

      {/* File Upload */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2">Supporting Documents</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Upload detailed pricing breakdowns, spreadsheets, or any supporting cost documentation.
        </p>

        {files.length > 0 && (
          <div className="space-y-2 mb-3">
            {files.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.type === "application/pdf" ? "PDF" : f.type.split("/").pop()?.toUpperCase() || "File"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => handleRemoveFile(idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <FileUpload
          accept={{
            "application/pdf": [".pdf"],
            "image/*": [".png", ".jpg", ".jpeg", ".webp"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
            "application/msword": [".doc"],
          }}
          maxSize={25 * 1024 * 1024}
          onUpload={handleUpload}
          label="Upload pricing document (PDF, Excel, Word, or image)"
        />
      </div>
    </div>
  );
}
