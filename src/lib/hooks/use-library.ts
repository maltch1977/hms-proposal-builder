"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import type { Tables } from "@/lib/types/database";

type LibraryItem = Tables<"library_items">;

export function useLibrary(sectionTypeId?: string) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();

  const fetchItems = useCallback(async () => {
    if (!profile) return;

    let query = supabase
      .from("library_items")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (sectionTypeId) {
      query = query.eq("section_type_id", sectionTypeId);
    }

    const { data } = await query;
    setItems(data || []);
    setLoading(false);
  }, [profile, sectionTypeId, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, refetch: fetchItems };
}
