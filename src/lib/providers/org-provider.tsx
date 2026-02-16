"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/types/database";
import { useAuth } from "@/lib/providers/auth-provider";

type Organization = Tables<"organizations">;

interface OrgContextType {
  organization: Organization | null;
  loading: boolean;
}

const OrgContext = createContext<OrgContextType>({
  organization: null,
  loading: true,
});

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    const fetchOrg = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();

      setOrganization(data);
      setLoading(false);
    };

    fetchOrg();
  }, [profile?.organization_id]);

  return (
    <OrgContext.Provider value={{ organization, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
