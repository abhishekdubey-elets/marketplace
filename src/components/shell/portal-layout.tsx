import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import type { Role } from "@/lib/types";
import { AppShell } from "./app-shell";

/** Server-side guard (defence in depth behind src/proxy.ts) + shell. */
export async function PortalLayout({ role, children }: { role: Role; children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?role=${role}`);
  if (user.role !== role) redirect(`/${user.role}?denied=${role}`);
  return (
    <AppShell role={role} user={user}>
      {children}
    </AppShell>
  );
}
