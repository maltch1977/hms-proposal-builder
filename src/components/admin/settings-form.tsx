"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { EmrManager } from "@/components/admin/emr-manager";
import { toast } from "sonner";
import { Building2, Palette, FileText } from "lucide-react";
import type { Tables, Json } from "@/lib/types/database";

type Organization = Tables<"organizations">;

interface CompanyExtras {
  fax?: string;
  license_number?: string;
  description?: string;
}

function getExtras(org: Organization): CompanyExtras {
  const config = org.theme_config as Record<string, unknown> | null;
  return {
    fax: (config?.company_fax as string) || "",
    license_number: (config?.company_license_number as string) || "",
    description: (config?.company_description as string) || "",
  };
}

export function SettingsForm() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [extras, setExtras] = useState<CompanyExtras>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  const fetchOrg = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single();

    setOrg(data);
    if (data) setExtras(getExtras(data));
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setSaving(true);

    const existingConfig = (org.theme_config as Record<string, unknown>) || {};
    const updatedConfig = {
      ...existingConfig,
      company_fax: extras.fax || null,
      company_license_number: extras.license_number || null,
      company_description: extras.description || null,
    };

    const { error } = await supabase
      .from("organizations")
      .update({
        company_name: org.company_name,
        company_address: org.company_address,
        company_phone: org.company_phone,
        company_website: org.company_website,
        company_email: org.company_email,
        footer_text: org.footer_text,
        primary_color: org.primary_color,
        secondary_color: org.secondary_color,
        accent_color: org.accent_color,
        theme_config: updatedConfig as unknown as Json,
      })
      .eq("id", org.id);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved");
    }

    setSaving(false);
  };

  const update = (field: keyof Organization, value: string) => {
    setOrg((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateExtra = (field: keyof CompanyExtras, value: string) => {
    setExtras((prev) => ({ ...prev, [field]: value }));
  };

  if (loading || !org) {
    return <p className="text-sm text-muted-foreground">Loading settings...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Company Profile
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          This information is used to auto-populate proposals and PDF exports.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Company Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-hms-navy" />
            <h3 className="text-sm font-semibold text-foreground">
              Company Information
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-name">Company Name</Label>
              <Input
                id="s-name"
                value={org.company_name || ""}
                onChange={(e) => update("company_name", e.target.value)}
                placeholder="HMS Commercial Service, Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-website">Website</Label>
              <Input
                id="s-website"
                value={org.company_website || ""}
                onChange={(e) => update("company_website", e.target.value)}
                placeholder="www.hmscommercialservice.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-address">Address</Label>
            <Input
              id="s-address"
              value={org.company_address || ""}
              onChange={(e) => update("company_address", e.target.value)}
              placeholder="123 Main St, City, State ZIP"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="s-phone">Phone</Label>
              <Input
                id="s-phone"
                value={org.company_phone || ""}
                onChange={(e) => update("company_phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-fax">Fax</Label>
              <Input
                id="s-fax"
                value={extras.fax || ""}
                onChange={(e) => updateExtra("fax", e.target.value)}
                placeholder="(555) 123-4568"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-email">Email</Label>
              <Input
                id="s-email"
                type="email"
                value={org.company_email || ""}
                onChange={(e) => update("company_email", e.target.value)}
                placeholder="info@hmscommercialservice.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-license">License / Certification Number</Label>
            <Input
              id="s-license"
              value={extras.license_number || ""}
              onChange={(e) => updateExtra("license_number", e.target.value)}
              placeholder="Contractor License #12345"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-description">Company Description</Label>
            <Textarea
              id="s-description"
              value={extras.description || ""}
              onChange={(e) => updateExtra("description", e.target.value)}
              placeholder="Brief description of your company used when generating proposal content..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Used when generating content — include your specialties, years in business, service area, etc.
            </p>
          </div>
        </div>

        <Separator />

        {/* PDF Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-hms-navy" />
            <h3 className="text-sm font-semibold text-foreground">
              PDF Settings
            </h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-footer">PDF Footer Text</Label>
            <Input
              id="s-footer"
              value={org.footer_text || ""}
              onChange={(e) => update("footer_text", e.target.value)}
              placeholder="Text shown at the bottom of each PDF page"
            />
          </div>
        </div>

        <Separator />

        {/* Brand Colors */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-hms-navy" />
            <h3 className="text-sm font-semibold text-foreground">
              Brand Colors
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="s-primary">Primary (Navy)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={org.primary_color}
                  onChange={(e) => update("primary_color", e.target.value)}
                  className="h-9 w-9 rounded border border-border cursor-pointer"
                />
                <Input
                  id="s-primary"
                  value={org.primary_color}
                  onChange={(e) => update("primary_color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-secondary">Secondary (Blue)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={org.secondary_color}
                  onChange={(e) => update("secondary_color", e.target.value)}
                  className="h-9 w-9 rounded border border-border cursor-pointer"
                />
                <Input
                  id="s-secondary"
                  value={org.secondary_color}
                  onChange={(e) => update("secondary_color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-accent">Accent (Gold)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={org.accent_color}
                  onChange={(e) => update("accent_color", e.target.value)}
                  className="h-9 w-9 rounded border border-border cursor-pointer"
                />
                <Input
                  id="s-accent"
                  value={org.accent_color}
                  onChange={(e) => update("accent_color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="bg-hms-navy hover:bg-hms-navy-light">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>

      <Separator />

      <EmrManager />
    </div>
  );
}
