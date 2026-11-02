import { PortalLayout } from "@/components/shell/portal-layout";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayout role="provider">{children}</PortalLayout>;
}
