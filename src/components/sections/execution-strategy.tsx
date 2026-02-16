"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ProjectScheduleContent } from "@/lib/types/section";

interface ExecutionStrategyProps {
  content: ProjectScheduleContent;
  onChange: (content: ProjectScheduleContent) => void;
}

export function ExecutionStrategy({ content, onChange }: ExecutionStrategyProps) {
  const strategy = content.execution_strategy || {};
  const phases = strategy.phases || [];

  const updateStrategy = (
    updates: Partial<NonNullable<ProjectScheduleContent["execution_strategy"]>>
  ) => {
    onChange({
      ...content,
      execution_strategy: { ...strategy, ...updates },
    });
  };

  const updatePhase = (
    index: number,
    updates: Partial<{ name: string; duration: string; description: string; milestones: string[] }>
  ) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], ...updates };
    updateStrategy({ phases: newPhases });
  };

  const addPhase = () => {
    updateStrategy({
      phases: [
        ...phases,
        { name: "", duration: "", description: "", milestones: [] },
      ],
    });
  };

  const removePhase = (index: number) => {
    updateStrategy({ phases: phases.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-5 rounded-lg border border-border bg-muted/20 p-4">
      <h4 className="text-sm font-medium text-foreground">
        Execution Strategy
      </h4>

      <div className="space-y-2">
        <Label htmlFor="project-duration">Project Duration</Label>
        <Input
          id="project-duration"
          placeholder="e.g., 18 months"
          value={strategy.project_duration || ""}
          onChange={(e) => updateStrategy({ project_duration: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Phases</Label>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={addPhase}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Phase
          </Button>
        </div>

        {phases.map((phase, idx) => (
          <div
            key={idx}
            className="space-y-2 rounded-lg border border-border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Phase {idx + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removePhase(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                placeholder="Phase name"
                value={phase.name}
                onChange={(e) => updatePhase(idx, { name: e.target.value })}
              />
              <Input
                placeholder="Duration (e.g., 3 months)"
                value={phase.duration}
                onChange={(e) =>
                  updatePhase(idx, { duration: e.target.value })
                }
              />
            </div>
            <Textarea
              placeholder="Phase description..."
              value={phase.description}
              onChange={(e) =>
                updatePhase(idx, { description: e.target.value })
              }
              className="min-h-[60px]"
            />
            <div className="space-y-1">
              <Label className="text-xs">
                Milestones (one per line)
              </Label>
              <Textarea
                placeholder="Key milestone 1&#10;Key milestone 2"
                value={(phase.milestones || []).join("\n")}
                onChange={(e) =>
                  updatePhase(idx, {
                    milestones: e.target.value
                      .split("\n")
                      .filter((m) => m.trim()),
                  })
                }
                className="min-h-[50px] text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Critical Path Items (one per line)</Label>
        <Textarea
          placeholder="Critical activity 1&#10;Critical activity 2"
          value={(strategy.critical_path || []).join("\n")}
          onChange={(e) =>
            updateStrategy({
              critical_path: e.target.value
                .split("\n")
                .filter((c) => c.trim()),
            })
          }
          className="min-h-[60px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Approach Narrative</Label>
        <Textarea
          placeholder="Describe the overall execution approach..."
          value={strategy.approach_narrative || ""}
          onChange={(e) =>
            updateStrategy({ approach_narrative: e.target.value })
          }
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
