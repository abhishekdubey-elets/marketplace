import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import type { Role } from "@/lib/types";
import { AppShell } from "./app-shell";
import { opsLoginPath } from "@/lib/auth/ops";

/** Server-side guard (defence in depth behind src/proxy.ts) + shell. */
export async function PortalLayout({ role, children }: { role: Role; children: React.ReactNode }) {
  const user = await getCurrentUser();
  // valid cookie but no account (deleted, or lookup failed): /login clears the session instead of bouncing back here
  if (!user) redirect(role === "admin" ? `${opsLoginPath()}?expired=1` : `/login?role=${role}&expired=1`);
  if (user.role !== role) redirect(`/${user.role}?denied=${role}`);
  return (
    <AppShell role={role} user={user}>
      {children}
    </AppShell>
  );
}
