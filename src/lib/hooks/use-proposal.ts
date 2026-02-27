"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Tables, Json } from "@/lib/types/database";

type Proposal = Tables<"proposals">;
type ProposalSection = Tables<"proposal_sections">;
type SectionType = Tables<"section_types">;

export interface SectionWithType extends ProposalSection {
  section_type: SectionType;
}

export function useProposal(proposalId: string) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sections, setSections] = useState<SectionWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProposal = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}`);
      if (!res.ok) {
        console.error("Failed to load proposal:", res.status);
        setLoading(false);
        return;
      }

      const { proposal: proposalData, sections: sectionsData } = await res.json();

      setProposal(proposalData);
      if (sectionsData) {
        setSections(
          sectionsData.map((s: Record<string, unknown>) => ({
            ...s,
            section_type: (s as unknown as { section_type: SectionType }).section_type,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load proposal:", err);
    }
    setLoading(false);
  }, [proposalId]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  const updateProposal = useCallback(
    async (updates: Partial<Proposal>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/proposals/${proposalId}/update`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          setProposal((prev) => (prev ? { ...prev, ...updates } : prev));
          setSaving(false);
          return true;
        }
      } catch (err) {
        console.error("Failed to update proposal:", err);
      }
      setSaving(false);
      return false;
    },
    [proposalId]
  );

  // Debounced save: collect the latest updates per section and flush after 800ms of inactivity
  const pendingRef = useRef<Record<string, { updates: { content?: Json; is_enabled?: boolean; order_index?: number; library_item_id?: string | null }; changeType?: "human" | "ai" }>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveCompleteRef = useRef<(() => void) | null>(null);

  const flushSave = useCallback(async () => {
    const pending = { ...pendingRef.current };
    pendingRef.current = {};
    const entries = Object.entries(pending);
    if (entries.length === 0) return;

    setSaving(true);
    await Promise.all(
      entries.map(async ([sectionId, { updates, changeType }]) => {
        try {
          const payload = changeType ? { ...updates, _changeType: changeType } : updates;
          const res = await fetch(`/api/sections/${sectionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            setSections((prev) =>
              prev.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
            );
          }
        } catch (err) {
          console.error("Failed to update section:", err);
        }
      })
    );
    setSaving(false);
    onSaveCompleteRef.current?.();
  }, []);

  // Flush on unmount so nothing is lost
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Fire synchronously on unmount
      const pending = Object.entries(pendingRef.current);
      if (pending.length > 0) {
        for (const [sectionId, { updates, changeType }] of pending) {
          const payload = changeType ? { ...updates, _changeType: changeType } : updates;
          navigator.sendBeacon?.(
            `/api/sections/${sectionId}`,
            new Blob([JSON.stringify(payload)], { type: "application/json" })
          );
        }
        pendingRef.current = {};
      }
    };
  }, []);

  const updateSection = useCallback(
    async (sectionId: string, updates: { content?: Json; is_enabled?: boolean; order_index?: number; library_item_id?: string | null }, changeType?: "human" | "ai") => {
      // Non-content updates (toggle, reorder, library) save immediately
      if (updates.content === undefined) {
        setSaving(true);
        try {
          const payload = changeType ? { ...updates, _changeType: changeType } : updates;
          const res = await fetch(`/api/sections/${sectionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            setSections((prev) =>
              prev.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
            );
            setSaving(false);
            return true;
          }
        } catch (err) {
          console.error("Failed to update section:", err);
        }
        setSaving(false);
        return false;
      }

      // Content updates are debounced — update local state immediately, save after pause
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
      );
      pendingRef.current[sectionId] = { updates, changeType };
      setSaving(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        flushSave();
      }, 800);

      return true;
    },
    [flushSave]
  );

  const reorderSections = useCallback(
    async (orderedIds: string[]) => {
      setSaving(true);

      // Optimistic update
      setSections((prev) => {
        const sectionMap = new Map(prev.map((s) => [s.id, s]));
        return orderedIds
          .map((id, index) => {
            const section = sectionMap.get(id);
            return section ? { ...section, order_index: index + 1 } : null;
          })
          .filter(Boolean) as SectionWithType[];
      });

      try {
        await fetch("/api/sections/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        });
      } catch (err) {
        console.error("Failed to reorder sections:", err);
      }

      setSaving(false);
    },
    []
  );

  const toggleSection = useCallback(
    async (sectionId: string, enabled: boolean) => {
      return updateSection(sectionId, { is_enabled: enabled });
    },
    [updateSection]
  );

  const addSection = useCallback(
    async (sectionTypeId: string) => {
      if (!proposal) return false;
      setSaving(true);
      try {
        const res = await fetch(`/api/proposals/${proposalId}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionTypeId }),
        });
        if (res.ok) {
          const newSection = await res.json();
          setSections((prev) => [...prev, {
            ...newSection,
            section_type: newSection.section_type,
          } as SectionWithType]);
          setSaving(false);
          return true;
        }
      } catch (err) {
        console.error("Failed to add section:", err);
      }
      setSaving(false);
      return false;
    },
    [proposalId, proposal]
  );

  const deleteSection = useCallback(
    async (sectionId: string) => {
      setSaving(true);
      // Optimistic removal
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      try {
        const res = await fetch(`/api/sections/${sectionId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          // Revert on failure
          await fetchProposal();
          setSaving(false);
          return false;
        }
      } catch (err) {
        console.error("Failed to delete section:", err);
        await fetchProposal();
        setSaving(false);
        return false;
      }
      setSaving(false);
      return true;
    },
    [fetchProposal]
  );

  return {
    proposal,
    sections,
    loading,
    saving,
    updateProposal,
    updateSection,
    reorderSections,
    toggleSection,
    addSection,
    deleteSection,
    refetch: fetchProposal,
    onSaveCompleteRef,
  };
}
