"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { assetsApi, issuerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { ENERGY_META, formatUSDC, formatNumber } from "@/lib/utils";
import type { AssetListItem } from "@/types";
import { Plus, ArrowUpRight, Send, RefreshCw, BarChart2, Zap } from "lucide-react";

export default function IssuerPage() {
  const { user, devSwitchRole } = useAuth();
  const [assets, setAssets]     = useState<AssetListItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [msg, setMsg]           = useState("");

  useEffect(() => {
    if (!user || user.role !== "issuer") return;
    assetsApi.list({ limit: 50 })
      .then(r => setAssets(r.items))
      .catch(() => setAssets(MOCK_ISSUER_ASSETS))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSubmit(assetId: string) {
    setSubmitting(assetId);
    setMsg("");
    try {
      const res = await issuerApi.submit(assetId);
      setMsg(`Asset submitted → ${res.next_status}`);
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: res.next_status as AssetListItem["status"] } : a));
    } catch {
      setMsg("Demo: Submit simulated.");
    } finally {
      setSubmitting(null);
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 border border-surface-200/60 flex items-center justify-center mx-auto mb-6">
          <BarChart2 className="w-8 h-8 text-sky-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">Issuer Dashboard</h1>
        <p className="text-slate-500 text-sm mb-8">Sign in as an issuer to manage your solar assets.</p>
        <button onClick={() => devSwitchRole("issuer")} className="btn-primary px-8">
          Demo Login as Issuer
        </button>
      </div>
    );
  }

  if (user.role !== "issuer") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center text-slate-500">
        Access restricted to issuers.{" "}
        <button onClick={() => devSwitchRole("issuer")} className="text-sky-400 underline">Switch role</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="label-text mb-1">Issuer Dashboard</p>
          <h1 className="text-3xl font-extrabold text-slate-100">My Assets</h1>
        </div>
        <Link href="/issuer/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Asset
        </Link>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Draft",        count: assets.filter(a => a.status === "draft").length,          color: "text-slate-400" },
          { label: "Under Review", count: assets.filter(a => a.status === "pending_review").length,  color: "text-amber-400" },
          { label: "Active Sale",  count: assets.filter(a => a.status === "active_sale").length,     color: "text-emerald-400" },
          { label: "Funded",       count: assets.filter(a => a.status === "funded").length,          color: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Feedback message */}
      {msg && (
        <div className="rounded-xl bg-sky-950/30 border border-sky-900/50 px-5 py-3 text-sm text-sky-300">
          {msg}
        </div>
      )}

      {/* Assets table */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-24 animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Zap className="w-8 h-8 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-6">No assets yet. Create your first one.</p>
          <Link href="/issuer/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Create Asset
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {assets.map(a => {
            const energy = ENERGY_META[a.energy_type];
            const canSubmit = a.status === "draft" || a.status === "verified";
            return (
              <div key={a.id} className="glass-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-100 border border-surface-200/40 flex items-center justify-center text-xl flex-shrink-0">
                      {energy.emoji}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-100 truncate">{a.title}</h3>
                      <p className="text-xs text-slate-500">
                        {energy.label} · {formatNumber(a.capacity_kw)} kW · {formatUSDC(a.price_per_share_usdc)}/share
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={a.status} />

                    <div className="yield-tag">
                      {a.expected_annual_yield_percent}% APY
                    </div>

                    <Link
                      href={`/issuer/assets/${a.id}`}
                      className="btn-ghost text-xs px-3 py-2 border border-surface-200/60 rounded-lg"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Manage
                    </Link>

                    {canSubmit && (
                      <button
                        onClick={() => handleSubmit(a.id)}
                        disabled={submitting === a.id}
                        className="btn-secondary text-xs px-3 py-2"
                      >
                        {submitting === a.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <><Send className="w-3.5 h-3.5" /> Submit</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MOCK_ISSUER_ASSETS: AssetListItem[] = [
  { id: "asset-1", title: "Almaty Solar Farm A",    energy_type: "solar",       capacity_kw: 150, status: "active_sale",    price_per_share_usdc: 10, expected_annual_yield_percent: 13.2 },
  { id: "asset-7", title: "Taraz Solar Micro-Grid", energy_type: "solar",       capacity_kw: 60,  status: "draft",           price_per_share_usdc: 8,  expected_annual_yield_percent: 12.8 },
  { id: "asset-8", title: "Semey Wind Cluster",     energy_type: "wind",        capacity_kw: 450, status: "pending_review",  price_per_share_usdc: 30, expected_annual_yield_percent: 15.0 },
];
