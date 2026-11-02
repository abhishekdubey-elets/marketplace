import { PortalLayout } from "@/components/shell/portal-layout";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout role="buyer">{children}</PortalLayout>;
}
