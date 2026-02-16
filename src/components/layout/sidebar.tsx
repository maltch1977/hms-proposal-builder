"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/lib/hooks/use-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Settings,
  Plus,
  Upload,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { ProposalStatus } from "@/lib/utils/constants";

const STATUS_DOT_COLORS: Record<ProposalStatus, string> = {
  draft: "bg-gray-400",
  submitted: "bg-blue-500",
  in_review: "bg-amber-500",
  approved: "bg-emerald-500",
  returned: "bg-orange-500",
  exported: "bg-hms-navy",
  archived: "bg-gray-300",
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 260;
const COLLAPSED_WIDTH = 52;

interface ProposalSummary {
  id: string;
  title: string;
  client_name: string;
  status: string;
  updated_at: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Persist width + collapsed state
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-state");
    if (saved) {
      try {
        const { width: w, collapsed: c } = JSON.parse(saved);
        if (typeof w === "number" && w >= MIN_WIDTH && w <= MAX_WIDTH) setWidth(w);
        if (typeof c === "boolean") setCollapsed(c);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-state", JSON.stringify({ width, collapsed }));
  }, [width, collapsed]);

  // Extract current proposal ID from pathname
  const currentProposalId = pathname.match(/^\/proposals\/([^/]+)/)?.[1] || null;

  const fetchProposals = useCallback(async () => {
    try {
      const res = await fetch("/api/proposals/list");
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch {
      // Silent fail — sidebar is non-critical
    }
    setLoadingProposals(false);
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Refresh list when navigating to proposals page (e.g., after creating one)
  useEffect(() => {
    if (pathname === "/proposals" || pathname.startsWith("/proposals/")) {
      fetchProposals();
    }
  }, [pathname, fetchProposals]);

  // Drag-to-resize handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;
    },
    [width]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    if (diffDays === 0) return `Today ${time}`;
    if (diffDays === 1) return `Yesterday ${time}`;
    if (diffDays < 7) return `${diffDays}d ago ${time}`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : width;

  // -- Collapsed view --
  if (collapsed) {
    return (
      <aside
        ref={sidebarRef}
        className="flex h-full flex-col border-r border-border bg-sidebar items-center"
        style={{ width: COLLAPSED_WIDTH, minWidth: COLLAPSED_WIDTH }}
      >
        <div className="py-3">
          <button
            onClick={() => setCollapsed(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border w-full" />

        <div className="flex flex-col items-center gap-1 pt-3">
          <Link
            href="/proposals"
            className="rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            title="Proposals"
          >
            <FileText className="h-4 w-4" />
          </Link>
          <Link
            href="/proposals"
            className="rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            title="New Proposal"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>

        {/* Proposal dots */}
        <ScrollArea className="flex-1 overflow-hidden w-full">
          <div className="flex flex-col items-center gap-1.5 py-2">
            {proposals.map((proposal) => {
              const isActive = proposal.id === currentProposalId;
              const dotColor =
                STATUS_DOT_COLORS[proposal.status as ProposalStatus] || "bg-gray-400";
              return (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className={cn(
                    "rounded-md p-2 transition-colors",
                    isActive
                      ? "bg-sidebar-accent"
                      : "hover:bg-sidebar-accent/50"
                  )}
                  title={proposal.title}
                >
                  <span className={cn("inline-block h-2 w-2 rounded-full", dotColor)} />
                </Link>
              );
            })}
          </div>
        </ScrollArea>

        <div className="border-t border-border w-full">
          {isAdmin && (
            <div className="flex justify-center py-2">
              <Link
                href="/admin"
                className={cn(
                  "rounded-md p-2 transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
                title="Admin"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </aside>
    );
  }

  // -- Expanded view --
  return (
    <aside
      ref={sidebarRef}
      className="relative flex h-full flex-col border-r border-border bg-sidebar flex-shrink-0"
      style={{ width: sidebarWidth }}
    >
      {/* Logo + collapse button */}
      <div className="flex flex-col items-center gap-2 border-b border-border px-5 py-5 relative">
        <button
          onClick={() => setCollapsed(true)}
          className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
        <Link href="/proposals" className="flex flex-col items-center gap-2">
          <div className="relative h-20 w-48">
            <Image
              src="/images/hms_logo.png"
              alt="HMS Commercial Service"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-sm font-bold uppercase tracking-[0.06em] text-foreground/80">
            Proposal Builder
          </span>
        </Link>
      </div>

      {/* Proposals header + actions */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link
          href="/proposals"
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          Proposals
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/proposals"
            className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            title="Upload RFP"
          >
            <Upload className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/proposals"
            className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            title="New Proposal"
          >
            <Plus className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Proposal list */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="px-2 pb-2 space-y-1">
          {loadingProposals && (
            <div className="space-y-2 px-2 py-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-sidebar-accent/30 animate-pulse" />
              ))}
            </div>
          )}

          {!loadingProposals && proposals.length === 0 && (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">
              No proposals yet
            </p>
          )}

          {!loadingProposals &&
            proposals.map((proposal) => {
              const isActive = proposal.id === currentProposalId;
              const dotColor =
                STATUS_DOT_COLORS[proposal.status as ProposalStatus] || "bg-gray-400";

              return (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 transition-all duration-200 border-l-[3px] border-l-transparent",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border-l-hms-navy"
                      : "text-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  )}
                >
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      isActive ? "font-medium" : ""
                    )}
                    title={proposal.title}
                  >
                    {proposal.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("inline-block h-2 w-2 rounded-full flex-shrink-0", dotColor)} />
                    <span className="text-[10px] truncate opacity-80">
                      {proposal.client_name}
                    </span>
                    <span className="ml-auto text-[10px] opacity-60 flex-shrink-0">
                      {formatDate(proposal.updated_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
        </div>
      </ScrollArea>

      {/* Admin + Footer */}
      <div className="border-t border-border">
        {isAdmin && (
          <div className="px-3 py-2">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                pathname.startsWith("/admin")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              Admin
            </Link>
          </div>
        )}
        <div className="px-5 py-3">
          <p className="text-[11px] text-muted-foreground">
            HMS Commercial Service
          </p>
        </div>
      </div>

      {/* Drag handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize z-10 transition-colors hover:bg-hms-navy/20",
          isDragging && "bg-hms-navy/30"
        )}
        onMouseDown={handleDragStart}
      />
    </aside>
  );
}
