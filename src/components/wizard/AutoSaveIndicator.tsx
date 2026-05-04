"use client";

import { useEffect, useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

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

  const colorMap: Record<SaveState, string> = {
    idle: "#64748b",
    saving: "#64748b",
    saved: "#16a34a",
    error: "#dc2626",
  };

  return (
    <span
      role="status"
      aria-live="polite"
      style={{ fontSize: "12px", color: colorMap[state] }}
    >
      {labels[state]}
    </span>
  );
}
