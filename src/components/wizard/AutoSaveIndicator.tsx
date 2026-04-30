"use client";

import { useEffect, useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

// Global save state — updated by draft persistence service
let globalSaveState: SaveState = "idle";
const listeners = new Set<(state: SaveState) => void>();

export function notifySaveState(state: SaveState) {
  globalSaveState = state;
  listeners.forEach((fn) => fn(state));
}

export function AutoSaveIndicator() {
  const [state, setState] = useState<SaveState>(globalSaveState);

  useEffect(() => {
    const handler = (s: SaveState) => setState(s);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (state === "idle") return null;

  const labels: Record<SaveState, string> = {
    idle: "",
    saving: "Saving…",
    saved: "Saved",
    error: "Save failed",
  };

  const colors: Record<SaveState, string> = {
    idle: "",
    saving: "text-muted-foreground",
    saved: "text-green-600",
    error: "text-destructive",
  };

  return (
    <span
      role="status"
      aria-live="polite"
      className={`text-xs transition-opacity ${colors[state]}`}
    >
      {labels[state]}
    </span>
  );
}
