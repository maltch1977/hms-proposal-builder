"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface ConnectorLine {
  reqId: string;
  reqType: "addressed" | "needs_input";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface RequirementConnectorsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  editorRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  activeReqId: string | null;
}

function getScrollViewport(container: HTMLElement): HTMLElement | null {
  return container.querySelector("[data-slot='scroll-area-viewport']");
}

export function RequirementConnectors({
  containerRef,
  editorRef,
  panelRef,
  activeReqId,
}: RequirementConnectorsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [line, setLine] = useState<ConnectorLine | null>(null);
  const rafRef = useRef<number>(0);

  const computeLine = useCallback(() => {
    if (!activeReqId) {
      setLine(null);
      return;
    }

    const container = containerRef.current;
    const editor = editorRef.current;
    const panel = panelRef.current;
    if (!container || !editor || !panel) return;

    const editorViewport = getScrollViewport(editor);
    const panelViewport = getScrollViewport(panel);
    if (!editorViewport || !panelViewport) return;

    const containerRect = container.getBoundingClientRect();

    // Find the mark (narrative sections) or target anchor (structured sections)
    const mark =
      editorViewport.querySelector<HTMLElement>(`mark[data-req-id="${activeReqId}"]`) ||
      editorViewport.querySelector<HTMLElement>(`mark[data-req-id="req_${activeReqId}"]`) ||
      editorViewport.querySelector<HTMLElement>(`[data-req-target="${activeReqId}"]`);
    if (!mark) {
      setLine(null);
      return;
    }

    // Find the card
    const card = panelViewport.querySelector<HTMLElement>(
      `[data-req-card-id="${activeReqId}"]`
    );
    if (!card) {
      setLine(null);
      return;
    }

    // Derive status from the card's visual state (green border = done)
    const cardIsDone = card.classList.contains("border-l-green-500");
    const reqType = cardIsDone ? "addressed" : "needs_input";

    const markRect = mark.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    // Hide connector if the mark is scrolled out of the editor viewport
    const editorRect = editorViewport.getBoundingClientRect();
    const markVisible =
      markRect.bottom > editorRect.top && markRect.top < editorRect.bottom;

    // Hide connector if the card is scrolled out of the panel viewport
    const panelRect = panelViewport.getBoundingClientRect();
    const cardVisible =
      cardRect.bottom > panelRect.top && cardRect.top < panelRect.bottom;

    if (!markVisible || !cardVisible) {
      setLine(null);
      return;
    }

    setLine({
      reqId: activeReqId,
      reqType,
      startX: markRect.right - containerRect.left,
      startY: markRect.top + markRect.height / 2 - containerRect.top,
      endX: cardRect.left - containerRect.left,
      endY: cardRect.top + cardRect.height / 2 - containerRect.top,
    });
  }, [containerRef, editorRef, panelRef, activeReqId]);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(computeLine);
  }, [computeLine]);

  // Recompute when activeReqId changes or on scroll/resize
  useEffect(() => {
    const editor = editorRef.current;
    const panel = panelRef.current;
    const container = containerRef.current;
    if (!editor || !panel || !container) return;

    const editorViewport = getScrollViewport(editor);
    const panelViewport = getScrollViewport(panel);

    editorViewport?.addEventListener("scroll", scheduleUpdate, { passive: true });
    panelViewport?.addEventListener("scroll", scheduleUpdate, { passive: true });

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(container);

    // Initial + on activeReqId change
    scheduleUpdate();

    return () => {
      editorViewport?.removeEventListener("scroll", scheduleUpdate);
      panelViewport?.removeEventListener("scroll", scheduleUpdate);
      resizeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [editorRef, panelRef, containerRef, scheduleUpdate]);

  if (!line) return null;

  const color = line.reqType === "addressed" ? "#22c55e" : "#f59e0b";

  // Cubic bezier curve from mark to card
  const dx = line.endX - line.startX;
  const cp1X = line.startX + dx * 0.4;
  const cp1Y = line.startY;
  const cp2X = line.endX - dx * 0.4;
  const cp2Y = line.endY;
  const d = `M ${line.startX} ${line.startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${line.endX} ${line.endY}`;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        opacity={0.8}
      />
      {/* Dot at the mark end */}
      <circle cx={line.startX} cy={line.startY} r={3.5} fill={color} opacity={0.8} />
      {/* Dot at the card end */}
      <circle cx={line.endX} cy={line.endY} r={3.5} fill={color} opacity={0.8} />
    </svg>
  );
}
