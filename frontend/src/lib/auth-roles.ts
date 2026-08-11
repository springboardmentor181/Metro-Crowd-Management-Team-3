export const accountRoles = [
  {
    value: "passenger",
    label: "Passenger",
    description: "View crowd guidance, routes, and service alerts.",
  },
  {
    value: "operator",
    label: "Operator",
    description: "Monitor stations, alerts, and schedules.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Manage operators and platform configuration.",
  },
] as const;

export type AccountRole =
  (typeof accountRoles)[number]["value"];

export function isAccountRole(
  value: unknown,
): value is AccountRole {
  return accountRoles.some(
    (role) => role.value === value,
  );
}
