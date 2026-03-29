import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { ENERGY_META, formatUSDC, formatPercent, formatNumber } from "@/lib/utils";
import type { AssetListItem } from "@/types";
import { Zap, TrendingUp, DollarSign } from "lucide-react";

export function AssetCard({ asset }: { asset: AssetListItem }) {
  const energy = ENERGY_META[asset.energy_type];

  return (
    <Link href={`/assets/${asset.id}`} className="glass-card-hover block p-5 group animate-fade-in">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl
                          bg-slate-100 dark:bg-surface-100
                          border border-slate-200 dark:border-surface-200/60">
            {energy.emoji}
          </div>
          <div>
            <p className="label-text">{energy.label}</p>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight
                           group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              {asset.title}
            </h3>
          </div>
        </div>
        <StatusBadge status={asset.status} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-amber-50 dark:bg-surface-100/50
                        border border-amber-100 dark:border-transparent p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-amber-600 dark:text-amber-400 font-bold text-base">
            {formatPercent(asset.expected_annual_yield_percent)}
          </p>
          <p className="text-slate-400 dark:text-slate-600 text-xs mt-0.5">APY</p>
        </div>

        <div className="rounded-xl bg-emerald-50 dark:bg-surface-100/50
                        border border-emerald-100 dark:border-transparent p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-emerald-700 dark:text-emerald-400 font-bold text-base">
            {formatUSDC(asset.price_per_share_usdc)}
          </p>
          <p className="text-slate-400 dark:text-slate-600 text-xs mt-0.5">/ share</p>
        </div>

        <div className="rounded-xl bg-sky-50 dark:bg-surface-100/50
                        border border-sky-100 dark:border-transparent p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-sky-700 dark:text-sky-400 font-bold text-base">
            {formatNumber(asset.capacity_kw)}
          </p>
          <p className="text-slate-400 dark:text-slate-600 text-xs mt-0.5">kW</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3
                      border-t border-slate-100 dark:border-surface-200/40">
        <span className="text-xs text-slate-400 dark:text-slate-500">View details</span>
        <span className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold
                         group-hover:translate-x-0.5 transition-transform inline-block">
          Explore →
        </span>
      </div>
    </Link>
  );
}

export function AssetCardSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-surface-200/40" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-surface-200/40 rounded w-16" />
          <div className="h-4 bg-slate-200 dark:bg-surface-200/40 rounded w-40" />
        </div>
        <div className="h-6 bg-slate-200 dark:bg-surface-200/40 rounded-lg w-20" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0,1,2].map(i => (
          <div key={i} className="rounded-xl bg-slate-100 dark:bg-surface-200/20 h-14" />
        ))}
      </div>
      <div className="h-px bg-slate-100 dark:bg-surface-200/40 mb-3" />
      <div className="h-3 bg-slate-100 dark:bg-surface-200/20 rounded w-24" />
    </div>
  );
}
