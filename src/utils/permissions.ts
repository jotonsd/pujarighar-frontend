import { User } from "@/lib/types";

export function hasPermission(user: User | null | undefined, module: string, action: string): boolean {
  if (!user) return false;
  if (user.role.code === "ADMIN") return true;
  return (user.permissions ?? []).includes(`${module}.${action}`);
}
