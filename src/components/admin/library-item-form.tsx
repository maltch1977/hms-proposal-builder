"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import type { Tables, Json } from "@/lib/types/database";

type LibraryItem = Tables<"library_items">;

interface LibraryItemFormProps {
  item?: LibraryItem | null;
  onSave: (data: {
    name: string;
    description: string;
    content: Json;
    is_default: boolean;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function LibraryItemForm({
  item,
  onSave,
  onCancel,
  saving,
}: LibraryItemFormProps) {
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [body, setBody] = useState(
    ((item?.content as Record<string, unknown>)?.body as string) || ""
  );
  const [isDefault, setIsDefault] = useState(item?.is_default || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      content: { body } as unknown as Json,
      is_default: isDefault,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lib-name">Name</Label>
        <Input
          id="lib-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Library item name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lib-desc">Description</Label>
        <Textarea
          id="lib-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <RichTextEditor
          content={body}
          onChange={setBody}
          placeholder="Write the library content..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={isDefault}
          onCheckedChange={setIsDefault}
          id="lib-default"
        />
        <Label htmlFor="lib-default" className="font-normal cursor-pointer">
          Set as default for this section type
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name || saving}>
          {saving ? "Saving..." : item ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
