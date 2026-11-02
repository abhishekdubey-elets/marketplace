"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Briefcase, Download, FileWarning, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import type { Provider } from "@/lib/types";
import { LISTING_LABEL, VERIFICATION_LABEL } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader, ProviderLogo, StatCard, VerificationBadge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { Tooltip } from "@/components/ui/overlay";
import { downloadCsv, EligibilityBadge, FilterSelect, ListingBadge } from "./common";

export function ProvidersList() {
  const user = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const L = useLookups();
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const setVerification = useStore((s) => s.setVerification);
  const setEligible = useStore((s) => s.setMatchingEligible);
  const updateProvider = useStore((s) => s.updateProvider);

  const initialVer = params.get("verification") ?? params.get("status") ?? "all";
  const [ver, setVer] = React.useState(initialVer === "pending" ? "needs_review" : initialVer);
  const [listing, setListing] = React.useState("all");
  const [elig, setElig] = React.useState("all");
  const [acct, setAcct] = React.useState("all");
  const [cat, setCat] = React.useState("all");

  const rows = providers.filter(
    (p) =>
      (ver === "all" || (ver === "needs_review" ? ["pending", "docs_requested", "unverified"].includes(p.verification) : p.verification === ver)) &&
      (listing === "all" || p.listing === listing) &&
      (elig === "all" || String(p.matchingEligible) === elig) &&
      (acct === "all" || p.accountStatus === acct) &&
      (cat === "all" || p.categories.includes(cat)),
  );

  const columns: Column<Provider>[] = [
    {
      key: "name",
      header: "Provider",
      sortValue: (p) => p.name,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <ProviderLogo provider={p} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{p.name}</p>
            <p className="truncate text-xs text-ink-3">
              {p.hq} · {p.categories.map((c) => L.categoryName(c)).slice(0, 2).join(", ")}
            </p>
          </div>
        </div>
      ),
    },
    { key: "verification", header: "Verification", sortValue: (p) => p.verification, cell: (p) => <VerificationBadge status={p.verification} compact /> },
    {
      key: "eligible",
      header: (
        <Tooltip content="Whether the provider can appear in match results. Controlled independently of verification.">
          <span className="inline-flex items-center gap-1">
            Matching <Info className="size-3" />
          </span>
        </Tooltip>
      ),
      cell: (p) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Switch
            aria-label={`Matching eligibility for ${p.name}`}
            checked={p.matchingEligible}
            disabled={p.accountStatus === "suspended"}
            onCheckedChange={(v) => {
              setEligible(p.id, v, user.id);
              toast.success(v ? "Matching enabled" : "Matching disabled", { description: p.name });
            }}
          />
          <span className="text-xs text-ink-3">{p.matchingEligible ? "Eligible" : "Off"}</span>
        </div>
      ),
    },
    {
      key: "listing",
      header: (
        <Tooltip content="Paid listing package. Display only — never read by the matching engine.">
          <span className="inline-flex items-center gap-1">
            Listing <Info className="size-3" />
          </span>
        </Tooltip>
      ),
      sortValue: (p) => p.listing,
      cell: (p) => <ListingBadge listing={p.listing} />,
      hideOnMobile: true,
    },
    { key: "account", header: "Account", sortValue: (p) => p.accountStatus, cell: (p) => <EligibilityBadge provider={{ matchingEligible: true, accountStatus: p.accountStatus }} />, hideOnMobile: true },
    { key: "docs", header: "Docs", align: "right", sortValue: (p) => p.documents.filter((d) => d.status === "accepted").length, cell: (p) => <span className="tabular-nums">{p.documents.filter((d) => d.status === "accepted").length}/{p.documents.length}</span>, hideOnMobile: true },
    { key: "joined", header: "Joined", align: "right", sortValue: (p) => p.joinedAt, cell: (p) => <span className="whitespace-nowrap text-xs text-ink-3">{formatDate(p.joinedAt)}</span>, hideOnMobile: true },
  ];

  const pending = providers.filter((p) => ["pending", "docs_requested", "unverified"].includes(p.verification)).length;

  return (
    <div>
      <PageHeader
        title="Providers"
        description="Review company profiles, verify providers and manage matching eligibility. Verification, matching eligibility and listing packages are independent controls."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              downloadCsv("elets-providers.csv", [
                ["Name", "HQ", "Verification", "Matching eligible", "Listing", "Account", "Joined"],
                ...rows.map((p) => [p.name, p.hq, VERIFICATION_LABEL[p.verification], p.matchingEligible ? "Yes" : "No", LISTING_LABEL[p.listing], p.accountStatus, p.joinedAt]),
              ]);
              toast.success("Export started", { description: `${rows.length} providers` });
            }}
          >
            <Download /> Export CSV
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="All providers" value={providers.length} icon={<Briefcase />} />
        <StatCard label="Verified" value={providers.filter((p) => p.verification === "verified").length} icon={<BadgeCheck />} accent="accent" />
        <StatCard label="Needs review" value={pending} icon={<ShieldCheck />} accent="amber" />
        <StatCard label="Matching eligible" value={providers.filter((p) => p.matchingEligible && p.accountStatus === "active").length} icon={<FileWarning />} accent="violet" />
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        searchText={(p) => `${p.name} ${p.hq} ${p.capabilities.join(" ")} ${p.tagline}`}
        searchPlaceholder="Search providers, capabilities…"
        onRowClick={(p) => router.push(`/admin/providers/${p.id}`)}
        selectable
        initialSort={{ key: "joined", dir: "desc" }}
        toolbar={
          <>
            <FilterSelect
              label="Verification"
              value={ver}
              onChange={setVer}
              options={[{ value: "needs_review", label: "Needs review" }, ...(["verified", "pending", "docs_requested", "unverified", "rejected"] as const).map((v) => ({ value: v, label: VERIFICATION_LABEL[v] }))]}
            />
            <FilterSelect label="Listings" value={listing} onChange={setListing} options={(["standard", "featured", "premium"] as const).map((v) => ({ value: v, label: LISTING_LABEL[v] }))} />
            <FilterSelect label="Eligibility" value={elig} onChange={setElig} options={[{ value: "true", label: "Eligible" }, { value: "false", label: "Not eligible" }]} />
            <FilterSelect label="Accounts" value={acct} onChange={setAcct} options={[{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }]} />
            <FilterSelect label="Categories" value={cat} onChange={setCat} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          </>
        }
        bulkActions={(ids, clear) => (
          <>
            <Button
              size="xs"
              onClick={() => {
                ids.forEach((id) => setVerification(id, "verified", user.id, "Bulk approval"));
                toast.success(`Verified ${ids.length} providers`);
                clear();
              }}
            >
              <BadgeCheck /> Approve verification
            </Button>
            <Button
              size="xs"
              variant="secondary"
              onClick={() => {
                ids.forEach((id) => {
                  updateProvider(id, (p) => ({ ...p, documents: p.documents.map((d) => (d.status === "accepted" ? d : { ...d, status: "requested" })) }));
                  setVerification(id, "docs_requested", user.id, "Bulk document request");
                });
                toast.success(`Requested documents from ${ids.length} providers`);
                clear();
              }}
            >
              <FileWarning /> Request documents
            </Button>
          </>
        )}
        empty={{ title: "No providers match these filters", icon: <Briefcase />, action: <Button variant="secondary" size="sm" onClick={() => { setVer("all"); setListing("all"); setElig("all"); setAcct("all"); setCat("all"); }}>Reset filters</Button> }}
      />
      <p className="mt-3 text-xs text-ink-3">
        Tip: verification badges are shown to buyers; matching eligibility controls whether a provider appears in match results. See{" "}
        <Link href="/admin/audit" className="font-medium text-brand-600 hover:underline">
          audit log
        </Link>{" "}
        for every change.
      </p>
    </div>
  );
}
