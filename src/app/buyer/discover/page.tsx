import { Suspense } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { DiscoveryView } from "@/components/shared/discovery";
import { PageHeader, PageSkeleton } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Explore providers" };

export default function DiscoverPage() {
  return (
    <>
      <PageHeader
        title="Explore providers"
        description="Search verified technology companies by capability, product, industry and region. Save searches and compare up to four providers."
        actions={
          <Button variant="secondary" asChild>
            <Link href="/buyer/requirements/new">
              <ClipboardList /> Let Elets match for you
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<PageSkeleton />}>
        <DiscoveryView basePath="/buyer/discover" profileHref="/buyer/providers" />
      </Suspense>
    </>
  );
}
