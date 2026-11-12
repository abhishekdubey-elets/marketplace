"use client";

import * as React from "react";
import { Copy, KeyRound, Mail, MoreHorizontal, Pencil, Phone, Plus, ShieldCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { isActive } from "@/lib/team";
import type { TeamMember } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger, Modal } from "@/components/ui/overlay";

const initialsOf = (s: string) =>
  s
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

const newId = () => `t-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

type Draft = Pick<TeamMember, "name" | "title" | "email" | "phone" | "focus"> & { id?: string };
const EMPTY: Draft = { name: "", title: "", email: "", phone: "", focus: [] };

export function TeamManager({ opsPath }: { opsPath: string }) {
  const user = useUser();
  const team = useStore((s) => s.team);
  const industries = useStore((s) => s.industries);
  const requirements = useStore((s) => s.requirements);
  const engagements = useStore((s) => s.engagements);
  const opportunities = useStore((s) => s.opportunities);
  const upsert = useStore((s) => s.upsertTeamMember);
  const [editing, setEditing] = React.useState<Draft | null>(null);
  const [secret, setSecret] = React.useState<{ name: string; email: string; password: string } | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const active = team.filter(isActive);
  const inactive = team.filter((t) => !isActive(t));
  const load = (id: string) => ({
    reqs: requirements.filter((r) => r.assignedTo === id && r.stage !== "completed").length,
    eng: engagements.filter((e) => e.rmId === id && e.status !== "completed").length,
    opps: opportunities.filter((o) => o.ownerId === id && o.stage !== "won" && o.stage !== "lost").length,
  });
  const industryName = (id: string) => industries.find((i) => i.id === id)?.name ?? id;

  const save = (d: Draft) => {
    const existing = d.id ? team.find((t) => t.id === d.id) : undefined;
    const member: TeamMember = {
      ...(existing ?? { active: true, hasLogin: false }),
      id: existing?.id ?? newId(),
      name: d.name.trim(),
      title: d.title.trim(),
      email: d.email.trim(),
      phone: d.phone.trim(),
      initials: initialsOf(d.name),
      focus: d.focus,
    };
    upsert(member, user.id, existing ? "Updated team member" : "Added team member");
    toast.success(existing ? "Team member updated" : "Team member added", { description: member.name });
  };

  const signIn = async (t: TeamMember, action: "create" | "reset" | "revoke") => {
    if (action === "revoke" && !window.confirm(`Remove ${t.name}'s operations sign-in? They will no longer be able to sign in.`)) return;
    if (action === "reset" && !window.confirm(`Reset ${t.name}'s password? Their current password stops working.`)) return;
    setBusy(t.id);
    const res = await fetch("/api/admin/team/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: t.id, action }) });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error(j.error ?? "Couldn't update the sign-in.");
    const label = action === "create" ? "Created operations sign-in" : action === "reset" ? "Reset operations password" : "Removed operations sign-in";
    upsert({ ...t, hasLogin: action !== "revoke" }, user.id, label);
    if (j.password) setSecret({ name: t.name, email: j.email, password: j.password });
    else toast.success("Sign-in removed", { description: t.name });
  };

  const setActive = async (t: TeamMember, on: boolean) => {
    if (!on) {
      if (t.id === user.id) return toast.error("You can't deactivate yourself.");
      if (!window.confirm(`Deactivate ${t.name}? They keep their history but can't be assigned new work${t.hasLogin ? ", and their sign-in is removed" : ""}.`)) return;
      if (t.hasLogin) {
        const res = await fetch("/api/admin/team/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: t.id, action: "revoke" }) });
        if (!res.ok) return toast.error((await res.json().catch(() => ({}))).error ?? "Couldn't remove the sign-in.");
      }
    }
    upsert({ ...t, active: on, hasLogin: on ? t.hasLogin : false }, user.id, on ? "Reactivated team member" : "Deactivated team member");
    toast.success(on ? "Team member reactivated" : "Team member deactivated", { description: t.name });
  };

  return (
    <div>
      <PageHeader
        title="Team"
        description="Elets relationship managers, analysts and operations staff. Active members can be assigned requirements, engagements and opportunities, and appear as the Elets contact for buyers and providers."
        actions={
          <Button onClick={() => setEditing({ ...EMPTY })}>
            <Plus /> Add team member
          </Button>
        }
      />

      {team.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={<Users />} title="No team members yet" description="Add the people who manage buyers and providers. You can give each of them an operations sign-in." />
        </Card>
      ) : (
        <div className="space-y-6">
          <MemberGrid members={active} meId={user.id} load={load} industryName={industryName} busy={busy} onEdit={(t) => setEditing({ ...t })} onSignIn={signIn} onActive={setActive} />
          {inactive.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-ink-3">Inactive</h2>
              <MemberGrid members={inactive} meId={user.id} load={load} industryName={industryName} busy={busy} onEdit={(t) => setEditing({ ...t })} onSignIn={signIn} onActive={setActive} />
            </div>
          )}
        </div>
      )}

      <MemberModal
        draft={editing}
        lockedEmail={!!editing?.id && !!team.find((t) => t.id === editing.id)?.hasLogin}
        emailInUse={(email, id) => team.some((t) => t.id !== id && t.email.trim().toLowerCase() === email.trim().toLowerCase())}
        industries={industries.filter((i) => i.active)}
        onClose={() => setEditing(null)}
        onSave={save}
      />

      <Modal
        open={!!secret}
        onOpenChange={(v) => !v && setSecret(null)}
        title="Operations sign-in ready"
        description="Share these details with them privately. The password is shown only once."
        icon={<KeyRound />}
        footer={<Button onClick={() => setSecret(null)}>Done</Button>}
      >
        {secret && (
          <div className="space-y-3 text-[13px]">
            <CopyRow label="Sign-in page" value={`${window.location.origin}${opsPath}`} />
            <CopyRow label="Email" value={secret.email} />
            <CopyRow label="Password" value={secret.password} mono />
            <p className="text-xs leading-relaxed text-ink-3">They sign in at this unlisted address, not the public login page. Keep the address within the team.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CopyRow({ label, value, mono, copy = true }: { label: string; value: string; mono?: boolean; copy?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
      <span className="w-24 shrink-0 text-xs text-ink-3">{label}</span>
      <span className={mono ? "min-w-0 flex-1 break-all font-mono text-ink" : "min-w-0 flex-1 break-all text-ink"}>{value}</span>
      {copy && (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Copy ${label.toLowerCase()}`}
          onClick={() => {
            void navigator.clipboard?.writeText(value);
            toast.success(`${label} copied`);
          }}
        >
          <Copy />
        </Button>
      )}
    </div>
  );
}

function MemberGrid({
  members,
  meId,
  load,
  industryName,
  busy,
  onEdit,
  onSignIn,
  onActive,
}: {
  members: TeamMember[];
  meId: string;
  load: (id: string) => { reqs: number; eng: number; opps: number };
  industryName: (id: string) => string;
  busy: string | null;
  onEdit: (t: TeamMember) => void;
  onSignIn: (t: TeamMember, action: "create" | "reset" | "revoke") => void;
  onActive: (t: TeamMember, on: boolean) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {members.map((t) => {
        const l = load(t.id);
        const on = isActive(t);
        return (
          <Card key={t.id} className={on ? "p-4" : "p-4 opacity-70"}>
            <div className="flex items-start gap-3">
              <Avatar initials={t.initials} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {t.name} {t.id === meId && <span className="font-normal text-ink-3">(you)</span>}
                </p>
                <p className="truncate text-xs text-ink-3">{t.title || "No title"}</p>
              </div>
              <Dropdown>
                <DropdownTrigger asChild>
                  <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${t.name}`} disabled={busy === t.id}>
                    <MoreHorizontal />
                  </Button>
                </DropdownTrigger>
                <DropdownContent align="end">
                  <DropdownItem icon={<Pencil />} onSelect={() => onEdit(t)}>
                    Edit details
                  </DropdownItem>
                  {on && !t.hasLogin && (
                    <DropdownItem icon={<UserPlus />} onSelect={() => onSignIn(t, "create")}>
                      Create operations sign-in
                    </DropdownItem>
                  )}
                  {on && t.hasLogin && (!t.owner || t.id === meId) && (
                    <DropdownItem icon={<KeyRound />} onSelect={() => onSignIn(t, "reset")}>
                      Reset password
                    </DropdownItem>
                  )}
                  {t.hasLogin && t.id !== meId && !t.owner && (
                    <DropdownItem icon={<UserMinus />} onSelect={() => onSignIn(t, "revoke")}>
                      Remove sign-in
                    </DropdownItem>
                  )}
                  {t.id !== meId && !t.owner && (
                    <>
                      <DropdownSeparator />
                      <DropdownItem danger={on} onSelect={() => onActive(t, !on)}>
                        {on ? "Deactivate" : "Reactivate"}
                      </DropdownItem>
                    </>
                  )}
                </DropdownContent>
              </Dropdown>
            </div>

            <div className="mt-3 space-y-1 text-xs text-ink-3">
              {t.email && (
                <p className="flex items-center gap-2 truncate">
                  <Mail className="size-3.5 shrink-0 text-ink-4" /> {t.email}
                </p>
              )}
              {t.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 text-ink-4" /> {t.phone}
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.hasLogin && (
                <Badge tone="green" dot>
                  <ShieldCheck className="size-3" /> {t.owner ? "Account owner" : "Operations sign-in"}
                </Badge>
              )}
              {!on && <Badge tone="neutral">Inactive</Badge>}
              {t.focus.map((f) => (
                <Badge key={f} tone="blue">
                  {industryName(f)}
                </Badge>
              ))}
            </div>

            {on && (
              <p className="mt-3 border-t border-line pt-3 text-xs text-ink-3">
                <span className="font-medium text-ink">{l.reqs}</span> requirements · <span className="font-medium text-ink">{l.eng}</span> Pro engagements ·{" "}
                <span className="font-medium text-ink">{l.opps}</span> opportunities
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function MemberModal({
  draft,
  lockedEmail,
  emailInUse,
  industries,
  onClose,
  onSave,
}: {
  draft: Draft | null;
  lockedEmail: boolean;
  emailInUse: (email: string, id?: string) => boolean;
  industries: { id: string; name: string }[];
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = React.useState<Draft>(EMPTY);
  const [err, setErr] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    if (draft) {
      setD(draft);
      setErr({});
    }
  }, [draft]);

  const submit = () => {
    const e: Record<string, string> = {};
    if (d.name.trim().length < 2) e.name = "Enter their name.";
    if (d.email.trim() && !/^\S+@\S+\.\S+$/.test(d.email.trim())) e.email = "Enter a valid email.";
    else if (d.email.trim() && emailInUse(d.email, d.id)) e.email = "Another team member already uses this email.";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave(d);
    onClose();
  };

  return (
    <Modal
      open={!!draft}
      onOpenChange={(v) => !v && onClose()}
      title={d.id ? "Edit team member" : "Add team member"}
      description="Contact details are shown to buyers and providers when this person is their Elets contact."
      icon={<Users />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="tm-name" error={err.name}>
          <Input id="tm-name" value={d.name} invalid={!!err.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        </Field>
        <Field label="Title" htmlFor="tm-title" optional>
          <Input id="tm-title" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="e.g. Relationship Manager — Healthcare" />
        </Field>
        <Field label="Email" htmlFor="tm-email" error={err.email} optional={!lockedEmail} hint={lockedEmail ? "This is their sign-in email. Remove the sign-in to change it." : "Needed to give them an operations sign-in."}>
          <Input id="tm-email" type="email" value={d.email} disabled={lockedEmail} invalid={!!err.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
        </Field>
        <Field label="Phone" htmlFor="tm-phone" optional>
          <Input id="tm-phone" type="tel" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} />
        </Field>
        <Field label="Sectors they look after" optional hint="Used to suggest a relationship manager for new buyers and providers." className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {industries.map((i) => (
              <Chip key={i.id} selected={d.focus.includes(i.id)} onClick={() => setD({ ...d, focus: d.focus.includes(i.id) ? d.focus.filter((x) => x !== i.id) : [...d.focus, i.id] })}>
                {i.name}
              </Chip>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
