import "server-only";
import { APPLICATION_STATUS_TRANSITIONS } from "@/lib/constants";
import type { ApplicationStatus } from "@/schemas/application";

// Application state machine
// Status enum values MUST match spec.md exactly (T093):
//   Draft → Submitted → UnderScrutiny → AtConvenor → AtDirectorGeneral →
//   AtSecretary → Approved → CertificateIssued | Rejected

export interface TransitionResult {
  success: boolean;
  error?: string;
  newStatus?: ApplicationStatus;
}

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  const allowed = APPLICATION_STATUS_TRANSITIONS[from];
  return allowed?.includes(to) ?? false;
}

export function transition(from: ApplicationStatus, to: ApplicationStatus): TransitionResult {
  if (!canTransition(from, to)) {
    return {
      success: false,
      error: `Cannot transition from '${from}' to '${to}'`,
    };
  }
  return { success: true, newStatus: to };
}

// Map approval stage to next application status
export function approvalStageToStatus(stage: string): ApplicationStatus {
  const stageMap: Record<string, ApplicationStatus> = {
    Scrutiniser: "AtConvenor",
    Convenor: "AtDirectorGeneral",
    DirectorGeneral: "AtSecretary",
    Secretary: "Approved",
  };
  return stageMap[stage] ?? "UnderScrutiny";
}

// Map approval stage to bounce-back status (for Raise Objection)
export function objectionBounceStatus(stage: string): ApplicationStatus {
  // Upper-stage objections (Convenor, DG, Secretary) bounce to Scrutiniser, not applicant
  const bounceMap: Record<string, ApplicationStatus> = {
    Scrutiniser: "Draft",
    Convenor: "UnderScrutiny",
    DirectorGeneral: "UnderScrutiny",
    Secretary: "UnderScrutiny",
  };
  return bounceMap[stage] ?? "UnderScrutiny";
}

// Check if a status is terminal (no further transitions possible)
export function isTerminal(status: ApplicationStatus): boolean {
  const transitions = APPLICATION_STATUS_TRANSITIONS[status];
  return !transitions || transitions.length === 0;
}

// Get all valid next statuses from a given status
export function getValidNextStatuses(from: ApplicationStatus): ApplicationStatus[] {
  return (APPLICATION_STATUS_TRANSITIONS[from] ?? []) as ApplicationStatus[];
}
