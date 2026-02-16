"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, X, User } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/lib/types/database";
import type { TeamMemberWithPersonnel } from "@/components/sections/key-personnel";

type Personnel = Tables<"personnel">;

interface TeamSelectorProps {
  proposalId: string;
  selectedMembers: TeamMemberWithPersonnel[];
  onTeamChange: () => void;
}

export function TeamSelector({
  proposalId,
  selectedMembers,
  onTeamChange,
}: TeamSelectorProps) {
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("personnel")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("full_name")
      .then(({ data }) => setAllPersonnel(data || []));
  }, [profile, supabase]);

  const selectedIds = new Set(selectedMembers.map((m) => m.personnel_id));
  const available = allPersonnel.filter((p) => !selectedIds.has(p.id));

  const handleAdd = async (person: Personnel) => {
    const { error } = await supabase.from("proposal_team_members").insert({
      proposal_id: proposalId,
      personnel_id: person.id,
      order_index: selectedMembers.length + 1,
    });

    if (error) {
      toast.error("Failed to add team member");
      return;
    }

    onTeamChange();
    setOpen(false);
  };

  const handleRemove = async (memberId: string) => {
    const { error } = await supabase
      .from("proposal_team_members")
      .delete()
      .eq("id", memberId);

    if (!error) onTeamChange();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedMembers.map((member) => (
          <Badge
            key={member.id}
            variant="secondary"
            className="gap-1.5 py-1.5 pl-2.5 pr-1.5 text-sm"
          >
            <User className="h-3 w-3" />
            {member.personnel.full_name}
            <span className="text-muted-foreground text-xs ml-1">
              {member.personnel.title}
            </span>
            <button
              onClick={() => handleRemove(member.id)}
              className="ml-1 rounded-full hover:bg-background/50 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add Team Member
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search personnel..." />
            <CommandList>
              <CommandEmpty>No personnel available.</CommandEmpty>
              <CommandGroup>
                {available.map((person) => (
                  <CommandItem
                    key={person.id}
                    value={person.full_name}
                    onSelect={() => handleAdd(person)}
                  >
                    <div>
                      <p className="text-sm">{person.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.title} &middot; {person.role_type}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
