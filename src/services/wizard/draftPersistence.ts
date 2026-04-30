"use client";

import { WIZARD_AUTO_SAVE_INTERVAL_MS } from "@/lib/constants";
import { notifySaveState } from "@/components/wizard/AutoSaveIndicator";

interface SaveDraftParams {
  step: number;
  data: Record<string, unknown>;
  applicationId?: string;
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingDraft: SaveDraftParams | null = null;

async function persistDraft(params: SaveDraftParams): Promise<string> {
  notifySaveState("saving");
  try {
    const res = await fetch("/api/wizard/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = (await res.json()) as { applicationId?: string; error?: string };
    if (!res.ok || !json.applicationId) {
      notifySaveState("error");
      throw new Error(json.error ?? "Draft save failed");
    }
    notifySaveState("saved");
    return json.applicationId;
  } catch (err) {
    notifySaveState("error");
    throw err;
  }
}

// Save draft and return applicationId (creates application on first call)
export async function saveDraft(params: SaveDraftParams): Promise<string> {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
    pendingDraft = null;
  }
  return persistDraft(params);
}

// Schedule an auto-save after the configured interval
export function scheduleAutoSave(params: SaveDraftParams): void {
  pendingDraft = params;
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    if (pendingDraft) {
      void persistDraft(pendingDraft).catch(() => { /* errors shown via AutoSaveIndicator */ });
      pendingDraft = null;
    }
    autoSaveTimer = null;
  }, WIZARD_AUTO_SAVE_INTERVAL_MS);
}

export async function loadDraft(applicationId: string): Promise<Record<number, Record<string, unknown>>> {
  const res = await fetch(`/api/wizard/draft?applicationId=${applicationId}`);
  const json = (await res.json()) as { steps?: Record<number, Record<string, unknown>>; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Failed to load draft");
  return json.steps ?? {};
}
