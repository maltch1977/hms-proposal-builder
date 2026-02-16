"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { CaseStudyCard } from "@/components/sections/case-study-card";
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
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/lib/types/database";

type PastProject = Tables<"past_projects">;
type ProposalCaseStudy = Tables<"proposal_case_studies">;

interface CaseStudySelectorProps {
  proposalId: string;
}

export function CaseStudySelector({ proposalId }: CaseStudySelectorProps) {
  const [allProjects, setAllProjects] = useState<PastProject[]>([]);
  const [selectedStudies, setSelectedStudies] = useState<
    (ProposalCaseStudy & { project: PastProject })[]
  >([]);
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      const [{ data: projects }, { data: studies }] = await Promise.all([
        supabase
          .from("past_projects")
          .select("*")
          .eq("organization_id", profile.organization_id)
          .order("project_name"),
        supabase
          .from("proposal_case_studies")
          .select("*, project:past_projects(*)")
          .eq("proposal_id", proposalId)
          .order("order_index"),
      ]);

      setAllProjects(projects || []);
      setSelectedStudies(
        (studies || []).map((s) => ({
          ...s,
          project: (s as unknown as { project: PastProject }).project,
        }))
      );
    };

    fetchData();
  }, [profile, proposalId, supabase]);

  const selectedIds = new Set(selectedStudies.map((s) => s.past_project_id));
  const availableProjects = allProjects.filter((p) => !selectedIds.has(p.id));

  const handleAdd = async (project: PastProject) => {
    if (selectedStudies.length >= 5) {
      toast.error("Maximum 5 case studies allowed");
      return;
    }

    const { data, error } = await supabase
      .from("proposal_case_studies")
      .insert({
        proposal_id: proposalId,
        past_project_id: project.id,
        order_index: selectedStudies.length + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setSelectedStudies((prev) => [
        ...prev,
        { ...data, project },
      ]);
    }

    setOpen(false);
  };

  const handleRemove = async (studyId: string) => {
    const { error } = await supabase
      .from("proposal_case_studies")
      .delete()
      .eq("id", studyId);

    if (!error) {
      setSelectedStudies((prev) => prev.filter((s) => s.id !== studyId));
    }
  };

  return (
    <div className="space-y-3">
      {selectedStudies.map((study) => (
        <CaseStudyCard
          key={study.id}
          project={study.project}
          onRemove={() => handleRemove(study.id)}
        />
      ))}

      {selectedStudies.length < 5 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Case Study
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search projects..." />
              <CommandList>
                <CommandEmpty>No projects available.</CommandEmpty>
                <CommandGroup>
                  {availableProjects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={project.project_name}
                      onSelect={() => handleAdd(project)}
                      className="flex items-start gap-2 py-2"
                    >
                      <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {project.project_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {project.client_name} &middot;{" "}
                          {project.building_type}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
