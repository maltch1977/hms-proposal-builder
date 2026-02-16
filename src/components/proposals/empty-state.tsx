"use client";

import { FileText, Plus, Settings, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/lib/providers/auth-provider";

interface EmptyStateProps {
  onCreateNew: () => void;
}

export function EmptyState({ onCreateNew }: EmptyStateProps) {
  const { profile } = useAuth();
  const isAdmin =
    profile?.role === "super_admin" || profile?.role === "hms_admin";

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-hms-navy/10">
        <FileText className="h-10 w-10 text-hms-navy" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-foreground">
        Welcome to Proposal Builder
      </h2>
      <p className="mt-3 max-w-md text-center text-muted-foreground">
        Create professional proposals for HMS Commercial Service. Select a
        client, configure sections, add your team, and export a polished PDF.
      </p>
      <Button
        onClick={onCreateNew}
        size="lg"
        className="mt-8 bg-hms-navy hover:bg-hms-navy-light"
      >
        <Plus className="mr-2 h-5 w-5" />
        Create Your First Proposal
      </Button>

      {isAdmin && (
        <div className="mt-12 w-full max-w-lg">
          <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
            Get started by setting up your data:
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/admin/personnel"
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-colors hover:bg-muted/50"
            >
              <Users className="h-6 w-6 text-hms-blue" />
              <span className="text-sm font-medium">Add Personnel</span>
            </Link>
            <Link
              href="/admin/libraries"
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-colors hover:bg-muted/50"
            >
              <BookOpen className="h-6 w-6 text-hms-blue" />
              <span className="text-sm font-medium">Section Library</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-colors hover:bg-muted/50"
            >
              <Settings className="h-6 w-6 text-hms-blue" />
              <span className="text-sm font-medium">Org Settings</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
