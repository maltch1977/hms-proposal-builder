"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/lib/types/database";

type EmrRating = Tables<"emr_ratings">;

export function EmrManager() {
  const [ratings, setRatings] = useState<EmrRating[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();

  const fetchRatings = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("emr_ratings")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("year", { ascending: false });

    setRatings(data || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const handleAdd = async () => {
    if (!profile) return;
    const currentYear = new Date().getFullYear();
    const existingYears = new Set(ratings.map((r) => r.year));
    let newYear = currentYear;
    while (existingYears.has(newYear)) newYear--;

    const { error } = await supabase.from("emr_ratings").insert({
      organization_id: profile.organization_id,
      year: newYear,
      rating: 1.0,
    });

    if (error) {
      toast.error("Failed to add EMR rating");
    } else {
      fetchRatings();
    }
  };

  const handleUpdate = async (
    id: string,
    field: "year" | "rating",
    value: number
  ) => {
    setRatings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );

    await supabase.from("emr_ratings").update({ [field]: value }).eq("id", id);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("emr_ratings").delete().eq("id", id);
    if (!error) {
      setRatings((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Experience Modification Rating (EMR)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage yearly EMR ratings displayed in proposals.
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" />
          Add Year
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : ratings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No EMR ratings yet.</p>
      ) : (
        <div className="space-y-2">
          {ratings.map((rating) => (
            <div
              key={rating.id}
              className="flex items-center gap-3 group"
            >
              <Input
                type="number"
                value={rating.year}
                onChange={(e) =>
                  handleUpdate(rating.id, "year", parseInt(e.target.value) || 0)
                }
                className="w-24 h-9"
              />
              <Input
                type="number"
                step="0.01"
                value={rating.rating}
                onChange={(e) =>
                  handleUpdate(
                    rating.id,
                    "rating",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-24 h-9"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(rating.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
