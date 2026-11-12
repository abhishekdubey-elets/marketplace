import { TeamManager } from "@/components/admin/team-manager";
import { opsLoginPath } from "@/lib/auth/ops";

export const metadata = { title: "Team" };

// Admin-only page (src/proxy.ts), so it's fine to hand the unlisted sign-in path to the client here.
export default function Page() {
  return <TeamManager opsPath={opsLoginPath()} />;
}
