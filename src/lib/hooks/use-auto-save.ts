"use client";

import { useRef, useCallback, useEffect, useState } from "react";

export function useAutoSave(
  saveFn: () => Promise<boolean>,
  delay: number = 1500
) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const trigger = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus("idle");

    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      const success = await saveFn();
      setStatus(success ? "saved" : "error");

      if (success) {
        savedTimeoutRef.current = setTimeout(() => {
          setStatus("idle");
        }, 2000);
      }
    }, delay);
  }, [saveFn, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  return { trigger, status };
}
