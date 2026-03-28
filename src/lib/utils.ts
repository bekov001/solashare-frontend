import type { AssetStatus, EnergyType } from "@/types";

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatUSDC(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export const STATUS_META: Record<AssetStatus, { label: string; color: string; dot: string }> = {
  draft:          { label: "Draft",          color: "text-slate-400 bg-slate-800/60 border-slate-700",         dot: "bg-slate-400" },
  pending_review: { label: "Under Review",   color: "text-amber-400 bg-amber-900/30 border-amber-800/60",      dot: "bg-amber-400" },
  verified:       { label: "Verified",       color: "text-sky-400 bg-sky-900/30 border-sky-800/60",            dot: "bg-sky-400" },
  active_sale:    { label: "Active Sale",    color: "text-emerald-400 bg-emerald-900/30 border-emerald-800/60", dot: "bg-emerald-400" },
  funded:         { label: "Fully Funded",   color: "text-purple-400 bg-purple-900/30 border-purple-800/60",   dot: "bg-purple-400" },
  frozen:         { label: "Frozen",         color: "text-red-400 bg-red-900/30 border-red-800/60",            dot: "bg-red-400" },
  closed:         { label: "Closed",         color: "text-slate-500 bg-slate-800/40 border-slate-700/60",      dot: "bg-slate-500" },
};

export const ENERGY_META: Record<EnergyType, { label: string; emoji: string; color: string }> = {
  solar:      { label: "Solar",       emoji: "☀️",  color: "text-amber-400" },
  wind:       { label: "Wind",        emoji: "💨",  color: "text-sky-400" },
  hydro:      { label: "Hydro",       emoji: "💧",  color: "text-blue-400" },
  ev_charging:{ label: "EV Charging", emoji: "⚡",  color: "text-yellow-400" },
  other:      { label: "Other",       emoji: "🔋",  color: "text-slate-400" },
};

export function shortAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}
