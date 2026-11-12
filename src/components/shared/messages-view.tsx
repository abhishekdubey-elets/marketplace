"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Inbox, MessageSquarePlus, Paperclip, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { person } from "@/lib/people";
import { useLookups } from "@/lib/hooks";
import type { Thread } from "@/lib/types";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/overlay";
import { Badge } from "@/components/ui/badge";
import { useTeam } from "@/lib/team";

const CONTEXT_LABEL: Record<Thread["context"]["kind"], string> = {
  requirement: "Requirement",
  opportunity: "Opportunity",
  engagement: "Elets Pro",
  verification: "Profile",
  general: "General",
};

export function MessagesView() {
  const user = useUser();
  const params = useSearchParams();
  const threads = useStore((s) => s.threads);
  const send = useStore((s) => s.sendMessage);
  const markRead = useStore((s) => s.markThreadRead);
  const createThread = useStore((s) => s.createThread);
  const L = useLookups();
  const isAdmin = user.role === "admin";
  const team = useTeam();
  const members = useStore((s) => s.members);

  const mine = React.useMemo(
    () =>
      threads
        .filter((t) => isAdmin || t.participants.includes(user.id))
        .sort((a, b) => (b.messages.at(-1)?.at ?? "").localeCompare(a.messages.at(-1)?.at ?? "")),
    [threads, isAdmin, user.id],
  );
  const [q, setQ] = React.useState("");
  const [activeId, setActiveId] = React.useState<string | null>(params.get("thread"));
  const [mobileShowThread, setMobileShowThread] = React.useState(!!params.get("thread"));
  const [draft, setDraft] = React.useState("");
  const [composeOpen, setComposeOpen] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  const list = mine.filter((t) => !q || (t.subject + t.messages.map((m) => m.text).join(" ")).toLowerCase().includes(q.toLowerCase()));
  const active = mine.find((t) => t.id === activeId) ?? null;

  React.useEffect(() => {
    if (!activeId && mine[0] && typeof window !== "undefined" && window.innerWidth >= 1024) setActiveId(mine[0].id);
  }, [activeId, mine]);

  React.useEffect(() => {
    if (active && active.unreadBy.includes(user.id)) markRead(active.id, user.id);
    endRef.current?.scrollIntoView({ block: "end" });
  }, [active, user.id, markRead]);

  const contextHref = (t: Thread) => {
    const { kind, id } = t.context;
    if (!id) return null;
    if (kind === "requirement") return user.role === "provider" ? `/provider/opportunities/${id}` : `/${user.role}/requirements/${id}`;
    if (kind === "engagement") return user.role === "provider" ? null : `/${user.role}/pro/${id}`;
    if (kind === "opportunity") return user.role === "admin" ? `/admin/opportunities` : user.role === "provider" ? "/provider/leads" : "/buyer/opportunities";
    if (kind === "verification") return user.role === "provider" ? "/provider/verification" : user.role === "admin" ? `/admin/providers/${id}` : null;
    return null;
  };

  const doSend = () => {
    if (!active || !draft.trim()) return;
    send(active.id, user.id, draft.trim());
    setDraft("");
  };

  return (
    <div>
      <PageHeader
        title="Messages"
        description={isAdmin ? "All buyer, provider and internal conversations across the marketplace." : "Conversations with the Elets team about your requirements, opportunities and engagements."}
        actions={
          <Button onClick={() => setComposeOpen(true)}>
            <MessageSquarePlus /> New message
          </Button>
        }
      />
      <div className="grid h-[calc(100dvh-220px)] min-h-[520px] overflow-hidden rounded-2xl border border-line bg-white shadow-card lg:grid-cols-[340px_1fr]">
        {/* thread list */}
        <div className={cn("flex min-h-0 flex-col border-r border-line", mobileShowThread && "hidden lg:flex")}>
          <div className="border-b border-line p-3">
            <Input icon={<Search />} placeholder="Search conversations" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {list.length === 0 && <EmptyState compact icon={<Inbox />} title="No conversations" description="Start a new message to the Elets team." />}
            {list.map((t) => {
              const last = t.messages.at(-1);
              const other = t.participants.find((p) => p !== user.id) ?? t.participants[0];
              const unread = t.unreadBy.includes(user.id);
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveId(t.id);
                    setMobileShowThread(true);
                  }}
                  className={cn("flex w-full gap-3 border-b border-line/60 px-4 py-3.5 text-left transition hover:bg-subtle", t.id === active?.id && "bg-brand-50/50 hover:bg-brand-50/60")}
                >
                  <Avatar initials={person(other).initials} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn("truncate text-[13px] text-ink", unread ? "font-semibold" : "font-medium")}>{t.subject}</p>
                      <span className="shrink-0 text-[11px] text-ink-4">{last && timeAgo(last.at)}</span>
                    </div>
                    <p className="truncate text-xs text-ink-3">{isAdmin ? t.participants.map((p) => person(p).name).join(", ") : person(other).name}</p>
                    <p className={cn("mt-1 line-clamp-1 text-xs", unread ? "text-ink-2" : "text-ink-4")}>{last?.text}</p>
                  </div>
                  {unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* conversation */}
        <div className={cn("flex min-h-0 flex-col", !mobileShowThread && "hidden lg:flex")}>
          {!active ? (
            <EmptyState icon={<Inbox />} title="Select a conversation" description="Choose a thread on the left or start a new message." className="my-auto" />
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
                <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileShowThread(false)} aria-label="Back to conversations">
                  <ArrowLeft />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{active.subject}</p>
                  <p className="truncate text-xs text-ink-3">{active.participants.map((p) => person(p).name).join(" · ")}</p>
                </div>
                <Badge tone="blue">{CONTEXT_LABEL[active.context.kind]}</Badge>
                {contextHref(active) && (
                  <Button variant="secondary" size="sm" asChild className="hidden sm:inline-flex">
                    <Link href={contextHref(active)!}>Open {CONTEXT_LABEL[active.context.kind].toLowerCase()}</Link>
                  </Button>
                )}
              </div>
              <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-subtle/50 px-5 py-5">
                {active.messages.map((m) => {
                  const me = m.authorId === user.id;
                  const p = person(m.authorId);
                  return (
                    <div key={m.id} className={cn("flex gap-2.5", me && "flex-row-reverse")}>
                      <Avatar initials={p.initials} size="sm" />
                      <div className={cn("max-w-[78%]", me && "text-right")}>
                        <p className="mb-1 text-[11px] text-ink-4">
                          <span className="font-medium text-ink-3">{me ? "You" : p.name}</span> · {formatDateTime(m.at)}
                        </p>
                        <div className={cn("inline-block rounded-2xl px-3.5 py-2.5 text-left text-[13px] leading-relaxed", me ? "rounded-tr-md bg-brand-600 text-white" : "rounded-tl-md border border-line bg-white text-ink-2 shadow-xs")}>
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="border-t border-line p-3">
                <div className="flex items-end gap-2 rounded-xl border border-line bg-white p-2 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        doSend();
                      }
                    }}
                    rows={1}
                    placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
                    className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] text-ink outline-none placeholder:text-ink-4"
                    aria-label="Message"
                  />
                  <Button variant="ghost" size="icon-sm" onClick={() => toast.info("Attachments are simulated in this demo")} aria-label="Attach file">
                    <Paperclip />
                  </Button>
                  <Button size="sm" onClick={doSend} disabled={!draft.trim()}>
                    <Send /> Send
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onCreate={(to, subject, text) => {
          const id = createThread({ subject, participants: [user.id, to], context: { kind: "general", id: null } }, user.id, text);
          setActiveId(id);
          setMobileShowThread(true);
          toast.success("Message sent", { description: `To ${person(to).name}` });
        }}
        recipients={
          isAdmin
            ? members.filter((u) => u.role !== "admin" && u.orgId).map((u) => ({ value: u.id, label: `${u.name} — ${u.role === "buyer" ? L.buyer(u.orgId!)?.name : L.provider(u.orgId!)?.name}` }))
            : team.map((t) => ({ value: t.id, label: `${t.name} — ${t.title}` }))
        }
      />
    </div>
  );
}

function ComposeModal({
  open,
  onOpenChange,
  onCreate,
  recipients,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (to: string, subject: string, text: string) => void;
  recipients: { value: string; label: string }[];
}) {
  const [to, setTo] = React.useState(recipients[0]?.value ?? "");
  const [subject, setSubject] = React.useState("");
  const [text, setText] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    if (open) {
      setSubject("");
      setText("");
      setErr({});
    }
  }, [open]);
  const submit = () => {
    const e: Record<string, string> = {};
    if (!subject.trim()) e.subject = "Add a subject";
    if (!text.trim()) e.text = "Write a message";
    setErr(e);
    if (Object.keys(e).length) return;
    onCreate(to, subject.trim(), text.trim());
    onOpenChange(false);
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New message"
      description="Messages are logged against your account and visible to the Elets operations team."
      icon={<MessageSquarePlus />}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <Send /> Send message
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="To">
          <Select value={to} onValueChange={setTo} options={recipients} />
        </Field>
        <Field label="Subject" error={err.subject}>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} invalid={!!err.subject} placeholder="e.g. Question about my requirement" />
        </Field>
        <Field label="Message" error={err.text}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} invalid={!!err.text} rows={5} />
        </Field>
      </div>
    </Modal>
  );
}
