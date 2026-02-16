"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { ROLE_LABELS, type UserRole } from "@/lib/utils/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

export function UserMenu() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-3 px-2 py-1.5">
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className="bg-hms-navy text-[11px] font-medium text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent outline-none">
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className="bg-hms-navy text-[11px] font-medium text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden flex-col items-start md:flex">
          <span className="text-sm font-medium leading-tight">
            {profile?.full_name}
          </span>
          <span className="text-[11px] text-muted-foreground leading-tight">
            {profile?.role ? ROLE_LABELS[profile.role as UserRole] : ""}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{profile?.full_name}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
