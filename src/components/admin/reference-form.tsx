"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REFERENCE_CATEGORIES } from "@/lib/utils/constants";
import type { Tables } from "@/lib/types/database";

type Reference = Tables<"references">;

interface ReferenceFormProps {
  item?: Reference | null;
  onSave: (data: {
    contact_name: string;
    title: string;
    company: string;
    phone: string;
    email: string | null;
    category: string;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function ReferenceForm({
  item,
  onSave,
  onCancel,
  saving,
}: ReferenceFormProps) {
  const [contactName, setContactName] = useState(item?.contact_name || "");
  const [title, setTitle] = useState(item?.title || "");
  const [company, setCompany] = useState(item?.company || "");
  const [phone, setPhone] = useState(item?.phone || "");
  const [email, setEmail] = useState(item?.email || "");
  const [category, setCategory] = useState(item?.category || "Owner");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      contact_name: contactName,
      title,
      company,
      phone,
      email: email || null,
      category,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ref-name">Contact Name</Label>
          <Input
            id="ref-name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ref-title">Title</Label>
          <Input
            id="ref-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Project Manager"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ref-company">Company</Label>
          <Input
            id="ref-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REFERENCE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ref-phone">Phone</Label>
          <Input
            id="ref-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(503) 555-0123"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ref-email">Email</Label>
          <Input
            id="ref-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!contactName || !title || !company || !phone || saving}
        >
          {saving ? "Saving..." : item ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
