"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/lib/types/database";

type EmrRating = Tables<"emr_ratings">;

export function EmrTable() {
  const [ratings, setRatings] = useState<EmrRating[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;

    supabase
      .from("emr_ratings")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("year", { ascending: false })
      .then(({ data }) => {
        setRatings(data || []);
        setLoading(false);
      });
  }, [profile, supabase]);

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  if (ratings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No EMR ratings configured. Add them in Admin Settings.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-hms-navy/5">
            {ratings.map((r) => (
              <TableHead key={r.id} className="text-center font-semibold">
                {r.year}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            {ratings.map((r) => (
              <TableCell key={r.id} className="text-center font-medium">
                {r.rating}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
