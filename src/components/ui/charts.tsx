"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

/**
 * Chart palette — fixed categorical order, lightness-staggered so adjacent
 * series stay distinguishable. Identity is never colour-alone: every multi-series
 * chart ships with a legend and a hover tooltip.
 */
export const SERIES = ["#2149e8", "#14ae9f", "#e8a33d", "#7c5cf0", "#94a6cc", "#0c1631"];

const AXIS = { fontSize: 11, fill: "#667085" };

function TooltipBox({ active, payload, label, unit }: { active?: boolean; payload?: { name?: string; value?: number; color?: string; payload?: { fill?: string } }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-overlay">
      {label && <p className="mb-1 font-medium text-ink">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="size-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          <span className="text-ink-3">{p.name}</span>
          <span className="ml-auto pl-4 font-semibold tabular-nums text-ink">
            {p.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items, className }: { items: { label: string; color: string; value?: React.ReactNode }[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-3", className)}>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: i.color }} />
          {i.label}
          {i.value !== undefined && <span className="font-semibold text-ink">{i.value}</span>}
        </span>
      ))}
    </div>
  );
}

/** Avoids SSR/CSR mismatch: recharts measures the DOM. */
function useMounted() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => setM(true), []);
  return m;
}

function Frame({ height, children }: { height: number; children: React.ReactElement }) {
  const mounted = useMounted();
  return (
    <div style={{ height }} className="w-full">
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="skeleton h-full w-full rounded-xl" />
      )}
    </div>
  );
}

export function AreaTrend({
  data,
  x,
  series,
  height = 220,
  unit,
}: {
  data: Record<string, string | number>[];
  x: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
  unit?: string;
}) {
  const id = React.useId().replace(/:/g, "");
  return (
    <Frame height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? SERIES[i]} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color ?? SERIES[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="#eef0f4" />
        <XAxis dataKey={x} tick={AXIS} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<TooltipBox unit={unit} />} cursor={{ stroke: "#c3cee6", strokeDasharray: "3 3" }} />
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? SERIES[i]}
            strokeWidth={2}
            fill={`url(#${id}-${i})`}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />
        ))}
      </AreaChart>
    </Frame>
  );
}

export function Bars({
  data,
  x,
  series,
  height = 220,
  stacked,
  layout = "horizontal",
  unit,
}: {
  data: Record<string, string | number>[];
  x: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
  stacked?: boolean;
  layout?: "horizontal" | "vertical";
  unit?: string;
}) {
  const vertical = layout === "vertical";
  return (
    <Frame height={height}>
      <BarChart data={data} layout={vertical ? "vertical" : "horizontal"} margin={{ top: 8, right: 8, left: vertical ? 4 : -18, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={vertical} horizontal={!vertical} stroke="#eef0f4" />
        {vertical ? (
          <>
            <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey={x} tick={AXIS} axisLine={false} tickLine={false} width={120} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} tick={AXIS} axisLine={false} tickLine={false} dy={6} interval={0} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          </>
        )}
        <Tooltip content={<TooltipBox unit={unit} />} cursor={{ fill: "#f2f5fb" }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? "a" : undefined}
            fill={s.color ?? SERIES[i]}
            stroke="#fff"
            strokeWidth={stacked ? 1 : 0}
            radius={stacked ? (i === series.length - 1 ? (vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0) : vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            maxBarSize={vertical ? 18 : 28}
          />
        ))}
      </BarChart>
    </Frame>
  );
}

export function Donut({
  data,
  height = 180,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  centerLabel?: string;
  centerValue?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Frame height={height}>
        <PieChart>
          <Tooltip content={<TooltipBox />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="96%" paddingAngle={2} stroke="#fff" strokeWidth={2} cornerRadius={4}>
            {data.map((d, i) => (
              <Cell key={d.name} fill={d.color ?? SERIES[i % SERIES.length]} />
            ))}
          </Pie>
        </PieChart>
      </Frame>
      {(centerLabel || centerValue !== undefined) && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{centerValue}</p>
            <p className="text-[11px] text-ink-3">{centerLabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sparkline({ values, color = SERIES[0], height = 36 }: { values: number[]; color?: string; height?: number }) {
  const data = values.map((v, i) => ({ i, v }));
  const id = React.useId().replace(/:/g, "");
  return (
    <Frame height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#${id})`} isAnimationActive={false} />
      </AreaChart>
    </Frame>
  );
}

/** Horizontal funnel / pipeline built from plain HTML for crisp labels. */
export function Funnel({ steps }: { steps: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => (
        <div key={s.label} className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-3 text-xs">
          <span className="truncate text-ink-2">{s.label}</span>
          <div className="h-6 overflow-hidden rounded-md bg-navy-50">
            <div
              className="flex h-full items-center rounded-md transition-all duration-700"
              style={{ width: `${Math.max(4, (s.value / max) * 100)}%`, background: s.color ?? SERIES[0], opacity: 1 - i * 0.07 }}
            />
          </div>
          <span className="w-6 text-right font-semibold tabular-nums text-ink">{s.value}</span>
        </div>
      ))}
    </div>
  );
}
