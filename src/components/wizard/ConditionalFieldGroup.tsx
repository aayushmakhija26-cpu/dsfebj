"use client";

import type { MembershipType, FirmType } from "@/schemas/application";

interface Props {
  membershipType?: MembershipType;
  firmType?: FirmType;
  showFor?: {
    membershipTypes?: MembershipType[];
    firmTypes?: FirmType[];
  };
  children: React.ReactNode;
}

export function ConditionalFieldGroup({ membershipType, firmType, showFor, children }: Props) {
  if (!showFor) return <>{children}</>;

  const membershipMatch =
    !showFor.membershipTypes ||
    (membershipType && showFor.membershipTypes.includes(membershipType));

  const firmMatch =
    !showFor.firmTypes || (firmType && showFor.firmTypes.includes(firmType));

  if (!membershipMatch || !firmMatch) return null;

  return <>{children}</>;
}
