"use client";

import * as React from "react";
import {
  Award,
  Check,
  Compass,
  FileSearch,
  Handshake,
  ListChecks,
  Mail,
  Phone,
  Scale,
  ScrollText,
  SkipForward,
  Telescope,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PRO_MODULES, type ModuleState, type ProEngagement, type ProModuleKey } from "@/lib/types";
import { useStore } from "@/lib/store";
import type { Tone } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger, Sheet, Tooltip } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

// ------------------------------------------------------------------ module metadata

export const MODULE_ICON: Record<ProModuleKey, LucideIcon> = {
  discovery: Compass,
  intelligence: Telescope,
  shortlisting: ListChecks,
  diligence: FileSearch,
  rfp: ScrollText,
  evaluation: Scale,
  negotiation: Handshake,
  post_award: Award,
};

export const MODULE_DESCRIPTION: Record<ProModuleKey, string> = {
  discovery: "Elets works with the buyer to understand the actual problem and convert it into a structured technology requirement.",
  intelligence: "Research into available technologies, vendors, implementation partners and relevant market solutions.",
  shortlisting: "Relevant providers are identified and shortlisted against the requirement and their capabilities.",
  diligence: "Review of vendor experience, capabilities, credentials, certifications and relevant case studies.",
  rfp: "Preparation of a structured RFP, technical requirements, evaluation criteria and tender documentation.",
  evaluation: "Technical and commercial proposals are compared using structured, weighted evaluation criteria.",
  negotiation: "Elets coordinates discussions and supports negotiations to move the opportunity to closure.",
  post_award: "The outcome is tracked and feedback is collected after the solution is selected.",
};

export const MODULE_NAME = Object.fromEntries(PRO_MODULES.map((m) => [m.key, m.name])) as Record<ProModuleKey, string>;
export const MODULE_SHORT = Object.fromEntries(PRO_MODULES.map((m) => [m.key, m.short])) as Record<ProModuleKey, string>;
const KEYS = PRO_MODULES.map((m) => m.key) as ProModuleKey[];

export const STATUS_LABEL: Record<ProEngagement["status"], string> = { active: "Active", on_hold: "On hold", completed: "Completed" };
export const STATUS_TONE: Record<ProEngagement["status"], Tone> = { active: "teal", on_hold: "amber", completed: "green" };

export const MODULE_STATE_LABEL: Record<ModuleState, string> = { done: "Completed", active: "In progress", upcoming: "Upcoming", skipped: "Not in scope" };

// ------------------------------------------------------------------ helpers

export function currentModule(e: ProEngagement): ProModuleKey {
  return (
    KEYS.find((k) => e.modules[k] === "active") ??
    KEYS.find((k) => e.modules[k] === "upcoming") ??
    KEYS.filter((k) => e.modules[k] !== "skipped").at(-1) ??
    "discovery"
  );
}

export function engagementProgress(e: ProEngagement) {
  if (e.status === "completed") return 100;
  const inScope = KEYS.filter((k) => e.modules[k] !== "skipped");
  if (!inScope.length) return 0;
  const done = inScope.filter((k) => e.modules[k] === "done").length;
  const active = inScope.filter((k) => e.modules[k] === "active").length;
  return Math.round(((done + active * 0.4) / inScope.length) * 100);
}

/** Marks the active module done and activates the next in-scope module. */
export function advanceModules(modules: ProEngagement["modules"]): { modules: ProEngagement["modules"]; next: ProModuleKey | null } {
  const m = { ...modules };
  const activeIdx = KEYS.findIndex((k) => m[k] === "active");
  if (activeIdx >= 0) m[KEYS[activeIdx]] = "done";
  const nextKey = KEYS.find((k, i) => i > activeIdx && m[k] === "upcoming") ?? null;
  if (nextKey) m[nextKey] = "active";
  return { modules: m, next: nextKey };
}

export function evaluationTotals(e: ProEngagement) {
  const totalWeight = e.criteria.reduce((s, c) => s + c.weight, 0) || 1;
  return Object.fromEntries(
    Object.entries(e.scores).map(([pid, sc]) => {
      const scored = e.criteria.filter((c) => typeof sc[c.id] === "number");
      const w = scored.reduce((s, c) => s + c.weight, 0);
      const raw = scored.reduce((s, c) => s + (sc[c.id] / 10) * c.weight, 0);
      const technical = e.criteria.filter((c) => c.group === "technical");
      const commercial = e.criteria.filter((c) => c.group === "commercial");
      const part = (cs: typeof e.criteria) => {
        const ww = cs.filter((c) => typeof sc[c.id] === "number").reduce((s, c) => s + c.weight, 0);
        return ww ? Math.round((cs.reduce((s, c) => s + ((sc[c.id] ?? 0) / 10) * c.weight, 0) / ww) * 100) : null;
      };
      return [
        pid,
        {
          total: w ? Math.round((raw / w) * 100) : 0,
          coverage: Math.round((w / totalWeight) * 100),
          scored: scored.length,
          of: e.criteria.length,
          technical: part(technical),
          commercial: part(commercial),
        },
      ];
    }),
  ) as Record<string, { total: number; coverage: number; scored: number; of: number; technical: number | null; commercial: number | null }>;
}

import { teamMember } from "@/lib/team";
export { teamMember };

export function EngagementStatusBadge({ status }: { status: ProEngagement["status"] }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

// ------------------------------------------------------------------ stage rail

export function StageRail({
  engagement,
  editable,
  actorId,
  compact,
}: {
  engagement: ProEngagement;
  editable?: boolean;
  actorId?: string;
  compact?: boolean;
}) {
  const setModuleState = useStore((s) => s.setModuleState);

  if (compact) {
    return (
      <div className="flex items-center gap-1" aria-label="Engagement stages">
        {PRO_MODULES.map((m) => {
          const st = engagement.modules[m.key];
          return (
            <Tooltip key={m.key} content={`${m.name} — ${MODULE_STATE_LABEL[st]}`}>
              <span
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  st === "done" && "bg-navy-900",
                  st === "active" && "bg-flame-600",
                  st === "upcoming" && "bg-navy-100",
                  st === "skipped" && "bg-[repeating-linear-gradient(45deg,#e1e7f4_0,#e1e7f4_2px,transparent_2px,transparent_4px)]",
                )}
              />
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <ol className="flex min-w-[820px] items-start">
        {PRO_MODULES.map((m, i) => {
          const st = engagement.modules[m.key];
          const Icon = MODULE_ICON[m.key];
          const prevDone = i > 0 && ["done", "skipped"].includes(engagement.modules[PRO_MODULES[i - 1].key]) && st !== "upcoming";
          const node = (
            <button
              type="button"
              disabled={!editable}
              className={cn(
                "group relative z-10 flex flex-col items-center text-center outline-none disabled:cursor-default",
                editable && "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "relative grid size-11 place-items-center rounded-2xl border transition",
                  st === "done" && "border-navy-900 bg-navy-900 text-white shadow-[0_6px_16px_-6px_rgb(11_31_77/0.6)]",
                  st === "active" && "border-flame-600 bg-gradient-to-br from-flame-500 to-flame-700 text-white shadow-flame ring-4 ring-flame-100",
                  st === "upcoming" && "border-line-strong bg-white text-ink-4",
                  st === "skipped" && "border-dashed border-line-strong bg-subtle text-ink-4 opacity-70",
                  editable && "group-hover:scale-105",
                )}
              >
                {st === "done" ? <Check className="size-5" strokeWidth={2.5} /> : st === "skipped" ? <SkipForward className="size-4" /> : <Icon className="size-[18px]" />}
                {st === "active" && <span className="absolute inset-0 -z-10 rounded-2xl bg-flame-400 animate-pulse-ring" />}
              </span>
              <span className={cn("mt-2.5 px-1 text-[12px] font-semibold leading-tight", st === "active" ? "text-ink" : st === "done" ? "text-ink-2" : "text-ink-4", st === "skipped" && "line-through decoration-ink-4/50")}>
                {m.short}
              </span>
              <span className={cn("mt-0.5 text-[10px] font-medium uppercase tracking-wider", st === "active" ? "text-flame-600" : st === "done" ? "text-navy-700" : "text-ink-4")}>
                {st === "active" ? "In progress" : st === "done" ? "Done" : st === "skipped" ? "Skipped" : `Stage ${i + 1}`}
              </span>
            </button>
          );
          return (
            <li key={m.key} className="relative flex flex-1 justify-center">
              {i > 0 && (
                <span
                  className={cn(
                    "absolute right-1/2 top-[22px] h-[2px] w-full -translate-y-1/2",
                    prevDone || st === "done" ? "bg-navy-900" : st === "active" ? "bg-gradient-to-r from-navy-900 to-flame-500" : "bg-line",
                  )}
                />
              )}
              {editable && actorId ? (
                <Dropdown>
                  <DropdownTrigger asChild>{node}</DropdownTrigger>
                  <DropdownContent align="center" className="w-60">
                    <DropdownLabel>{m.name}</DropdownLabel>
                    {(["done", "active", "upcoming", "skipped"] as ModuleState[]).map((s) => (
                      <DropdownItem
                        key={s}
                        disabled={s === st}
                        icon={s === st ? <Check /> : <span className="size-4" />}
                        onSelect={() => {
                          setModuleState(engagement.id, m.key, s, actorId);
                          toast.success(`${m.name}: ${MODULE_STATE_LABEL[s]}`);
                        }}
                      >
                        {MODULE_STATE_LABEL[s]}
                      </DropdownItem>
                    ))}
                  </DropdownContent>
                </Dropdown>
              ) : (
                <Tooltip content={MODULE_DESCRIPTION[m.key]}>{node}</Tooltip>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ------------------------------------------------------------------ relationship manager

export function RMCard({ rmId, className, dark }: { rmId: string; className?: string; dark?: boolean }) {
  const rm = teamMember(rmId);
  if (!rm) return null;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={cn("relative grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold", dark ? "bg-flame-500/20 text-flame-200 ring-1 ring-flame-300/30" : "bg-navy-900 text-white")}>
        {rm.initials}
        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[11px] font-semibold uppercase tracking-wider", dark ? "text-navy-300" : "text-ink-4")}>Relationship manager</p>
        <p className={cn("truncate text-sm font-semibold", dark ? "text-white" : "text-ink")}>{rm.name}</p>
        <p className={cn("truncate text-xs", dark ? "text-navy-300" : "text-ink-3")}>{rm.title}</p>
      </div>
      <div className="flex gap-1">
        <Tooltip content={rm.email}>
          <a href={`mailto:${rm.email}`} className={cn("grid size-8 place-items-center rounded-lg transition", dark ? "text-navy-200 hover:bg-white/10" : "text-ink-3 hover:bg-navy-50 hover:text-ink")} aria-label={`Email ${rm.name}`}>
            <Mail className="size-4" />
          </a>
        </Tooltip>
        <Tooltip content={rm.phone}>
          <a href={`tel:${rm.phone.replace(/\s/g, "")}`} className={cn("grid size-8 place-items-center rounded-lg transition", dark ? "text-navy-200 hover:bg-white/10" : "text-ink-3 hover:bg-navy-50 hover:text-ink")} aria-label={`Call ${rm.name}`}>
            <Phone className="size-4" />
          </a>
        </Tooltip>
      </div>
    </div>
  );
}

export function AssigneeAvatar({ id, size = "xs" }: { id: string; size?: "xs" | "sm" }) {
  const t = teamMember(id);
  const initials = t?.initials ?? (id === "u-buyer" ? "KM" : "?");
  const name = t?.name ?? (id === "u-buyer" ? "Buyer (you)" : id);
  return (
    <Tooltip content={name}>
      <span>
        <Avatar initials={initials} size={size} tone={t ? undefined : 1} />
      </span>
    </Tooltip>
  );
}

// ------------------------------------------------------------------ workflow configuration

export function WorkflowConfigSheet({
  engagement,
  open,
  onOpenChange,
  actorId,
}: {
  engagement: ProEngagement | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  actorId: string;
}) {
  const update = useStore((s) => s.updateEngagement);
  const [draft, setDraft] = React.useState<ProEngagement["modules"] | null>(null);
  React.useEffect(() => {
    if (open && engagement) setDraft({ ...engagement.modules });
  }, [open, engagement]);
  if (!engagement || !draft) return null;
  const inScope = KEYS.filter((k) => draft[k] !== "skipped").length;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Configure engagement workflow"
      description={`${engagement.code} · Choose which Elets Pro modules are in scope and set each module's state.`}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={inScope === 0}
            onClick={() => {
              update(engagement.id, (e) => ({ ...e, modules: draft }), actorId, "Configured Pro workflow");
              toast.success("Workflow updated", { description: `${inScope} of 8 modules in scope` });
              onOpenChange(false);
            }}
          >
            Save workflow
          </Button>
        </>
      }
    >
      <p className="mb-4 rounded-xl border border-line bg-subtle p-3 text-xs leading-relaxed text-ink-3">
        The eight-module Elets Pro process is a template. Modules switched off are marked <span className="font-medium text-ink-2">Not in scope</span> and excluded from progress.
      </p>
      <ul className="space-y-2">
        {PRO_MODULES.map((m, i) => {
          const Icon = MODULE_ICON[m.key];
          const st = draft[m.key];
          const on = st !== "skipped";
          return (
            <li key={m.key} className={cn("flex items-center gap-3 rounded-xl border p-3 transition", on ? "border-line bg-white" : "border-dashed border-line bg-subtle/60")}>
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", on ? "bg-navy-900 text-white" : "bg-navy-50 text-ink-4")}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-[13px] font-medium", on ? "text-ink" : "text-ink-3")}>
                  <span className="mr-1.5 text-ink-4">{i + 1}.</span>
                  {m.name}
                </p>
                <p className="line-clamp-1 text-xs text-ink-3">{MODULE_DESCRIPTION[m.key]}</p>
              </div>
              <div className="w-32 shrink-0">
                <Select
                  size="sm"
                  value={st}
                  ariaLabel={`${m.name} state`}
                  onValueChange={(v) => setDraft({ ...draft, [m.key]: v as ModuleState })}
                  options={(["upcoming", "active", "done", "skipped"] as ModuleState[]).map((s) => ({ value: s, label: MODULE_STATE_LABEL[s] }))}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
