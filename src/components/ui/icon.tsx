import {
  Boxes,
  BrainCircuit,
  Building2,
  ChartLine,
  Cloud,
  Factory,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  Radio,
  School,
  ShieldCheck,
  Stethoscope,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";

// Icons referenced by name from taxonomy data (so admins can configure categories).
export const ICONS: Record<string, LucideIcon> = {
  BrainCircuit,
  Cloud,
  ShieldCheck,
  Boxes,
  Workflow,
  ChartLine,
  Stethoscope,
  School,
  Wallet,
  Landmark,
  Radio,
  Factory,
  HeartPulse,
  GraduationCap,
  Building2,
  Layers,
};

export const ICON_NAMES = Object.keys(ICONS);

export function DynIcon({ name, className }: { name: string; className?: string }) {
  const I = ICONS[name] ?? Layers;
  return <I className={className} />;
}
