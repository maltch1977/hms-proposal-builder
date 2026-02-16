"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Library, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/types/database";

type LibraryItem = Tables<"library_items">;

interface LibrarySelectorProps {
  sectionTypeId: string;
  selectedItemId: string | null;
  onSelect: (item: LibraryItem) => void;
  disabled?: boolean;
}

export function LibrarySelector({
  sectionTypeId,
  selectedItemId,
  onSelect,
  disabled = false,
}: LibrarySelectorProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!open || !profile) return;

    const fetchItems = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("library_items")
        .select("*")
        .eq("section_type_id", sectionTypeId)
        .eq("organization_id", profile.organization_id)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });

      setItems(data || []);
      setLoading(false);
    };

    fetchItems();
  }, [open, sectionTypeId, profile, supabase]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={disabled}
        >
          <Library className="h-3.5 w-3.5" />
          {selectedItem ? selectedItem.name : "Library"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search library..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No items found."}
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 flex-shrink-0",
                      selectedItemId === item.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm truncate">{item.name}</span>
                      {item.is_default && (
                        <Badge
                          variant="secondary"
                          className="h-4 px-1 text-[10px] gap-0.5 flex-shrink-0"
                        >
                          <Star className="h-2.5 w-2.5" />
                          Default
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
