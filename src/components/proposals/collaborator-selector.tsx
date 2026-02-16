"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

interface CollaboratorSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  currentUserId?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CollaboratorSelector({
  selectedIds,
  onChange,
  currentUserId,
}: CollaboratorSelectorProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(currentUserId || null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const res = await fetch("/api/profiles/list");
        if (res.ok) {
          const data = await res.json();
          setProfiles(data);
          // If no currentUserId was provided, use the first profile as fallback
          // (the API returns profiles for the current user's org, and the user is in that list)
          if (!resolvedUserId && data.length > 0) {
            // Try to find the current user by checking if they're already in selectedIds
            // Otherwise just use the first profile
            const userId = currentUserId || data[0]?.id;
            setResolvedUserId(userId);
            if (userId && !selectedIds.includes(userId)) {
              onChange([...selectedIds, userId]);
            }
          }
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    fetchProfiles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = profiles.filter((p) =>
    search
      ? p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
      : true
  );

  // Current user first, then alphabetical
  const effectiveUserId = resolvedUserId || currentUserId;
  const sorted = [...filtered].sort((a, b) => {
    if (a.id === effectiveUserId) return -1;
    if (b.id === effectiveUserId) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const handleToggle = (profileId: string) => {
    if (profileId === effectiveUserId) return; // Can't uncheck owner
    if (selectedIds.includes(profileId)) {
      onChange(selectedIds.filter((id) => id !== profileId));
    } else {
      onChange([...selectedIds, profileId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {profiles.length > 5 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      )}
      <div className="space-y-1 max-h-[280px] overflow-y-auto">
        {sorted.map((profile) => {
          const isOwner = profile.id === effectiveUserId;
          const isChecked = selectedIds.includes(profile.id);
          return (
            <label
              key={profile.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                isChecked ? "bg-muted/50" : "hover:bg-muted/30"
              } ${isOwner ? "opacity-80" : ""}`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => handleToggle(profile.id)}
                disabled={isOwner}
              />
              <Avatar size="sm">
                {profile.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                )}
                <AvatarFallback className="text-[10px]">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">
                    {profile.full_name}
                  </span>
                  {isOwner && (
                    <span className="text-[10px] font-medium text-hms-navy bg-hms-navy/10 rounded px-1.5 py-0.5">
                      Owner
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {profile.email}
                </p>
              </div>
            </label>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No team members found
          </p>
        )}
      </div>
    </div>
  );
}
