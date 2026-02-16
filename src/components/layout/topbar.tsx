"use client";

import { UserMenu } from "@/components/layout/user-menu";

interface TopbarProps {
  title?: string;
  children?: React.ReactNode;
}

export function Topbar({ title, children }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        )}
        {children}
      </div>
      <div className="flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
  );
}
