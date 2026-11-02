"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import type { NotificationType } from "@/lib/types";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Select } from "@/components/ui/select";
import { NOTIF_ICON } from "@/components/shell/topbar";

const TYPE_LABEL: Record<NotificationType, string> = {
  requirement_submitted: "Requirement submitted",
  requirement_reviewed: "Requirement reviewed",
  provider_matched: "Provider matched",
  intro_requested: "Introductions",
  provider_shortlisted: "Shortlist",
  meeting_scheduled: "Meetings",
  pro_updated: "Elets Pro",
  document_uploaded: "Documents",
  verification_approved: "Verification",
  new_opportunity: "Opportunities",
};

export function NotificationsView() {
  const user = useUser();
  const router = useRouter();
  const all = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [type, setType] = React.useState<string>("any");

  const mine = all.filter((n) => n.audience === user.role && (n.userId === null || n.userId === user.id));
  const types = Array.from(new Set(mine.map((n) => n.type)));
  const list = mine.filter((n) => (filter === "all" || !n.read) && (type === "any" || n.type === type));
  const unread = mine.filter((n) => !n.read).length;

  const groups = list.reduce<Record<string, typeof list>>((acc, n) => {
    const d = Date.now() - new Date(n.at).getTime();
    const k = d < 86400000 ? "Today" : d < 86400000 * 7 ? "This week" : "Earlier";
    (acc[k] ??= []).push(n);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        description={`${unread} unread · updates on requirements, matches, introductions, meetings and engagements.`}
        actions={
          <Button
            variant="secondary"
            disabled={!unread}
            onClick={() => {
              markAll(user.role, user.id);
              toast.success("All notifications marked as read");
            }}
          >
            <CheckCheck /> Mark all read
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "unread", label: `Unread (${unread})` }]} />
        <div className="w-52">
          <Select size="sm" value={type} onValueChange={setType} options={[{ value: "any", label: "All types" }, ...types.map((t) => ({ value: t, label: TYPE_LABEL[t] }))]} />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        {list.length === 0 ? (
          <EmptyState icon={<BellOff />} title="No notifications" description={filter === "unread" ? "You're all caught up." : "Activity on your account will appear here."} />
        ) : (
          (["Today", "This week", "Earlier"] as const)
            .filter((g) => groups[g]?.length)
            .map((g) => (
              <div key={g}>
                <p className="border-b border-line bg-subtle/70 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">{g}</p>
                {groups[g].map((n) => {
                  const I = NOTIF_ICON[n.type];
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        router.push(n.href);
                      }}
                      className={cn("flex w-full gap-4 border-b border-line/60 px-5 py-4 text-left transition last:border-0 hover:bg-subtle", !n.read && "bg-brand-50/30")}
                    >
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", n.read ? "bg-navy-50 text-ink-3" : "bg-brand-100 text-brand-700")}>
                        <I className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className={cn("text-sm text-ink", !n.read && "font-semibold")}>{n.title}</span>
                          <span className="text-xs text-ink-4" title={formatDateTime(n.at)}>
                            {timeAgo(n.at)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-3">{n.body}</span>
                      </span>
                      {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand-600" />}
                    </button>
                  );
                })}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
