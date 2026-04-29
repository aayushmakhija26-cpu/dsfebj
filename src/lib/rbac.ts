// RBAC permission matrix — pure data, safe to import on both server and client.

export type AppRole =
  | "Applicant"
  | "Member"
  | "Scrutiniser"
  | "Convenor"
  | "DirectorGeneral"
  | "Secretary"
  | "PaymentOfficer"
  | "Admin";

export type Permission =
  // Application lifecycle
  | "application:create"
  | "application:read:own"
  | "application:read:any"
  | "application:edit:own"
  | "application:edit:any"
  | "application:submit"
  | "application:approve"
  | "application:reject"
  | "application:raiseObjection"
  // Documents
  | "document:upload"
  | "document:read:own"
  | "document:read:any"
  | "document:verify"
  // Payments
  | "payment:initiate"
  | "payment:record:offline"
  | "payment:read:own"
  | "payment:read:any"
  | "payment:reverse"
  // Vault
  | "vault:read:own"
  | "vault:read:any"
  // Members
  | "member:read:own"
  | "member:read:any"
  | "member:revoke"
  | "member:renew"
  // Renewals
  | "renewal:create"
  | "renewal:read:own"
  | "renewal:read:any"
  | "renewal:approve"
  // Certificates
  | "certificate:generate"
  | "certificate:read:own"
  | "certificate:read:any"
  | "certificate:revoke"
  // Admin
  | "admin:staff:manage"
  | "admin:president:manage"
  | "admin:audit:read"
  | "admin:dsar:manage"
  | "admin:stats:operational"
  | "admin:stats:member"
  | "admin:stats:kpi";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  Applicant: [
    "application:create",
    "application:read:own",
    "application:edit:own",
    "application:submit",
    "document:upload",
    "document:read:own",
    "payment:initiate",
    "payment:read:own",
    "vault:read:own",
    "certificate:read:own",
    "renewal:create",
    "renewal:read:own",
    "member:read:own",
    "member:renew",
  ],

  Member: [
    "application:read:own",
    "document:read:own",
    "payment:initiate",
    "payment:read:own",
    "vault:read:own",
    "certificate:read:own",
    "renewal:create",
    "renewal:read:own",
    "member:read:own",
    "member:renew",
  ],

  Scrutiniser: [
    "application:read:any",
    "application:edit:any",
    "application:approve",
    "application:reject",
    "application:raiseObjection",
    "document:read:any",
    "document:verify",
    "payment:read:any",
    "vault:read:any",
    "member:read:any",
    "renewal:read:any",
    "renewal:approve",
    "certificate:read:any",
    "admin:stats:operational",
  ],

  Convenor: [
    "application:read:any",
    "application:approve",
    "application:reject",
    "application:raiseObjection",
    "document:read:any",
    "payment:read:any",
    "vault:read:any",
    "member:read:any",
    "renewal:read:any",
    "renewal:approve",
    "certificate:read:any",
    "admin:stats:operational",
  ],

  DirectorGeneral: [
    "application:read:any",
    "application:approve",
    "application:reject",
    "application:raiseObjection",
    "document:read:any",
    "payment:read:any",
    "vault:read:any",
    "member:read:any",
    "renewal:read:any",
    "renewal:approve",
    "certificate:read:any",
    "admin:stats:operational",
  ],

  Secretary: [
    "application:read:any",
    "application:approve",
    "application:reject",
    "application:raiseObjection",
    "document:read:any",
    "payment:read:any",
    "vault:read:any",
    "member:read:any",
    "member:revoke",
    "renewal:read:any",
    "renewal:approve",
    "certificate:generate",
    "certificate:read:any",
    "certificate:revoke",
    "admin:stats:operational",
    "admin:stats:member",
    "admin:stats:kpi",
    "admin:audit:read",
  ],

  PaymentOfficer: [
    "application:read:any",
    "document:read:any",
    "payment:record:offline",
    "payment:read:any",
    "payment:reverse",
    "vault:read:any",
    "member:read:any",
    "renewal:read:any",
  ],

  Admin: [
    "application:read:any",
    "document:read:any",
    "payment:read:any",
    "vault:read:any",
    "member:read:any",
    "renewal:read:any",
    "certificate:read:any",
    "admin:staff:manage",
    "admin:president:manage",
    "admin:audit:read",
    "admin:dsar:manage",
    "admin:stats:operational",
    "admin:stats:member",
    "admin:stats:kpi",
  ],
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRolePermissions(role: AppRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function isStaffRole(role: AppRole): boolean {
  return !["Applicant", "Member"].includes(role);
}

// Which approval stage maps to which staff role
export const APPROVAL_STAGE_ROLE: Record<string, AppRole> = {
  Scrutiniser: "Scrutiniser",
  Convenor: "Convenor",
  DirectorGeneral: "DirectorGeneral",
  Secretary: "Secretary",
};
