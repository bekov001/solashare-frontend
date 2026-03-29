"use client";

import { useEffect, useState, useCallback } from "react";
import { assetsApi } from "@/lib/api";
import { AssetCard, AssetCardSkeleton } from "@/components/AssetCard";
import { EmptyState } from "@/components/EmptyState";
import type { AssetFilters, AssetListItem, AssetStatus, EnergyType, Pagination } from "@/types";
import { ENERGY_META, STATUS_META } from "@/lib/utils";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

const ENERGY_OPTIONS: { value: EnergyType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  ...Object.entries(ENERGY_META).map(([k, v]) => ({
    value: k as EnergyType,
    label: `${v.emoji} ${v.label}`,
  })),
];

const STATUS_OPTIONS: { value: AssetStatus | ""; label: string }[] = [
  { value: "", label: "Any Status" },
  { value: "active_sale", label: "Active Sale" },
  { value: "verified",    label: "Verified" },
  { value: "funded",      label: "Funded" },
];

const SORT_OPTIONS = [
  { value: "newest",    label: "Newest" },
  { value: "yield_desc", label: "Highest Yield" },
  { value: "price_asc", label: "Lowest Price" },
];

export default function AssetsPage() {
  const [assets, setAssets]     = useState<AssetListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState<AssetFilters>({ page: 1, limit: 12, sort: "newest" });
  const [showFilters, setShowFilters] = useState(false);

  const fetchAssets = useCallback(async (f: AssetFilters) => {
    setLoading(true);
    try {
      const res = await assetsApi.list(f);
      setAssets(res.items);
      setPagination(res.pagination);
    } catch {
      setAssets(MOCK_ASSETS);
      setPagination({ page: 1, limit: 12, total: MOCK_ASSETS.length });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(filters); }, [filters, fetchAssets]);

  const updateFilter = (patch: Partial<AssetFilters>) =>
    setFilters(f => ({ ...f, ...patch, page: 1 }));

  const totalPages = pagination ? Math.ceil(pagination.total / (pagination.limit || 12)) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="label-text mb-1">Marketplace</p>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Explore Solar Assets</h1>
        {pagination && (
          <p className="text-slate-500 text-sm mt-1">{pagination.total} assets found</p>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Sort */}
        <select
          value={filters.sort ?? "newest"}
          onChange={e => updateFilter({ sort: e.target.value as AssetFilters["sort"] })}
          className="input-field w-auto text-xs py-2 px-3 rounded-lg"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Energy type */}
        <select
          value={filters.energy_type ?? ""}
          onChange={e => updateFilter({ energy_type: (e.target.value as EnergyType) || undefined })}
          className="input-field w-auto text-xs py-2 px-3 rounded-lg"
        >
          {ENERGY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Status */}
        <select
          value={filters.status ?? ""}
          onChange={e => updateFilter({ status: (e.target.value as AssetStatus) || undefined })}
          className="input-field w-auto text-xs py-2 px-3 rounded-lg"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Clear */}
        {(filters.energy_type || filters.status) && (
          <button
            onClick={() => setFilters({ page: 1, limit: 12, sort: "newest" })}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2"
          >
            Clear filters ×
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => <AssetCardSkeleton key={i} />)}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          title="No assets found"
          description="Try adjusting your filters to see more results."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {assets.map(a => <AssetCard key={a.id} asset={a} />)}
        </div>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={!pagination || pagination.page <= 1}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
            className="p-2 rounded-lg border border-surface-200/60 hover:border-emerald-700/60 disabled:opacity-40 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setFilters(f => ({ ...f, page: p }))}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                pagination?.page === p
                  ? "bg-emerald-600 text-white"
                  : "border border-surface-200/60 text-slate-400 hover:border-emerald-700/60 hover:text-emerald-400"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={!pagination || pagination.page >= totalPages}
            onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
            className="p-2 rounded-lg border border-surface-200/60 hover:border-emerald-700/60 disabled:opacity-40 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

const MOCK_ASSETS: AssetListItem[] = [
  { id: "asset-1", title: "Almaty Solar Farm A",    energy_type: "solar",       capacity_kw: 150, status: "active_sale", price_per_share_usdc: 10, expected_annual_yield_percent: 13.2 },
  { id: "asset-2", title: "Nur-Sultan Rooftop B",   energy_type: "solar",       capacity_kw: 80,  status: "active_sale", price_per_share_usdc: 5,  expected_annual_yield_percent: 11.8 },
  { id: "asset-3", title: "Shymkent Wind Park",     energy_type: "wind",        capacity_kw: 300, status: "active_sale", price_per_share_usdc: 25, expected_annual_yield_percent: 14.5 },
  { id: "asset-4", title: "Astana EV Hub",          energy_type: "ev_charging", capacity_kw: 50,  status: "verified",    price_per_share_usdc: 15, expected_annual_yield_percent: 9.4  },
  { id: "asset-5", title: "Karaganda Solar Fields", energy_type: "solar",       capacity_kw: 200, status: "funded",      price_per_share_usdc: 10, expected_annual_yield_percent: 12.1 },
  { id: "asset-6", title: "Atyrau Hydro Station",   energy_type: "hydro",       capacity_kw: 500, status: "active_sale", price_per_share_usdc: 50, expected_annual_yield_percent: 10.5 },
  { id: "asset-7", title: "Taraz Solar Micro-Grid", energy_type: "solar",       capacity_kw: 60,  status: "active_sale", price_per_share_usdc: 8,  expected_annual_yield_percent: 12.8 },
  { id: "asset-8", title: "Semey Wind Cluster",     energy_type: "wind",        capacity_kw: 450, status: "verified",    price_per_share_usdc: 30, expected_annual_yield_percent: 15.0 },
  { id: "asset-9", title: "Aktobe Rooftop Array",   energy_type: "solar",       capacity_kw: 90,  status: "active_sale", price_per_share_usdc: 7,  expected_annual_yield_percent: 11.2 },
];
