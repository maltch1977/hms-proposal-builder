"use client";

import { useAuth } from "@/lib/providers/auth-provider";

export function useUser() {
  const { user, profile, loading } = useAuth();
  return { user, profile, loading };
}

export function useIsAdmin() {
  const { profile } = useAuth();
  return profile?.role === "super_admin" || profile?.role === "hms_admin";
}

export function useIsSuperAdmin() {
  const { profile } = useAuth();
  return profile?.role === "super_admin";
}
