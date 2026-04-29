import { describe, it, expect } from "vitest";
import { hasPermission, getRolePermissions, isStaffRole, APPROVAL_STAGE_ROLE } from "@/lib/rbac";

describe("hasPermission", () => {
  it("Applicant can create and submit applications", () => {
    expect(hasPermission("Applicant", "application:create")).toBe(true);
    expect(hasPermission("Applicant", "application:submit")).toBe(true);
  });

  it("Applicant cannot approve applications", () => {
    expect(hasPermission("Applicant", "application:approve")).toBe(false);
  });

  it("Scrutiniser can approve and edit any application", () => {
    expect(hasPermission("Scrutiniser", "application:approve")).toBe(true);
    expect(hasPermission("Scrutiniser", "application:edit:any")).toBe(true);
  });

  it("Scrutiniser cannot manage staff", () => {
    expect(hasPermission("Scrutiniser", "admin:staff:manage")).toBe(false);
  });

  it("Secretary can generate and revoke certificates", () => {
    expect(hasPermission("Secretary", "certificate:generate")).toBe(true);
    expect(hasPermission("Secretary", "certificate:revoke")).toBe(true);
    expect(hasPermission("Secretary", "member:revoke")).toBe(true);
  });

  it("PaymentOfficer can record offline payments but cannot approve applications", () => {
    expect(hasPermission("PaymentOfficer", "payment:record:offline")).toBe(true);
    expect(hasPermission("PaymentOfficer", "application:approve")).toBe(false);
  });

  it("Admin can manage staff and president", () => {
    expect(hasPermission("Admin", "admin:staff:manage")).toBe(true);
    expect(hasPermission("Admin", "admin:president:manage")).toBe(true);
  });

  it("Admin cannot approve applications", () => {
    expect(hasPermission("Admin", "application:approve")).toBe(false);
  });
});

describe("isStaffRole", () => {
  it("returns true for staff roles", () => {
    expect(isStaffRole("Scrutiniser")).toBe(true);
    expect(isStaffRole("Secretary")).toBe(true);
    expect(isStaffRole("Admin")).toBe(true);
  });

  it("returns false for Applicant and Member", () => {
    expect(isStaffRole("Applicant")).toBe(false);
    expect(isStaffRole("Member")).toBe(false);
  });
});

describe("APPROVAL_STAGE_ROLE mapping", () => {
  it("maps each approval stage to the correct role", () => {
    expect(APPROVAL_STAGE_ROLE["Scrutiniser"]).toBe("Scrutiniser");
    expect(APPROVAL_STAGE_ROLE["Convenor"]).toBe("Convenor");
    expect(APPROVAL_STAGE_ROLE["DirectorGeneral"]).toBe("DirectorGeneral");
    expect(APPROVAL_STAGE_ROLE["Secretary"]).toBe("Secretary");
  });
});
