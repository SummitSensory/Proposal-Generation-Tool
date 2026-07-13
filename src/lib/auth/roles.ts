export const ROLES = [
  "owner",
  "sales",
  "fulfillment",
  "installation",
  "accounting",
  "read_only",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner / Admin",
  sales: "Sales / Proposal Creator",
  fulfillment: "Fulfillment / Production",
  installation: "Installation",
  accounting: "Accounting",
  read_only: "Read-only",
};

// Coarse capability map. Each screen/action checks this instead of hard-coding role names,
// so permissions can be adjusted in one place as the founder confirms the real matrix
// (see Section 4 of the requirements doc — this is a starting assumption).
export const CAN_SEE_COST_MARGIN: Role[] = ["owner", "accounting"];
export const CAN_MANAGE_USERS: Role[] = ["owner"];
export const CAN_EDIT_PRODUCTS: Role[] = ["owner"];
export const CAN_CREATE_PROPOSALS: Role[] = ["owner", "sales"];
export const CAN_VIEW_BOM: Role[] = ["owner", "sales", "fulfillment"];
export const CAN_MANAGE_SOURCING: Role[] = ["owner", "fulfillment"];
export const CAN_MANAGE_FREIGHT: Role[] = ["owner", "sales", "fulfillment"];

export function roleCan(role: string, allowed: Role[]): boolean {
  return allowed.includes(role as Role);
}
