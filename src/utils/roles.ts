export const roleHierarchy = {
  VIEWER: 1,
  ANALYST: 2,
  ADMIN: 3,
} as const;

export type Role = keyof typeof roleHierarchy;
