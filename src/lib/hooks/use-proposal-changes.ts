"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ChangeAuthor {
  id: string;
  name: string;
  avatar_url: string | null;
  email: string;
  color: string | null;
}

export interface ProposalChange {
  id: string;
  section_id: string;
  section_slug: string;
  section_name: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  change_type: "human" | "ai" | "system";
  summary: string | null;
  created_at: string;
  author: ChangeAuthor | null;
}

const POLL_INTERVAL = 15_000; // 15 seconds

export function useProposalChanges(proposalId: string) {
  const [changes, setChanges] = useState<ProposalChange[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchChanges = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/changes`);
      if (res.ok) {
        const data = await res.json();
        setChanges(data);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [proposalId]);

  useEffect(() => {
    fetchChanges();
    intervalRef.current = setInterval(fetchChanges, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchChanges]);

  return { changes, loading, refetch: fetchChanges };
}
