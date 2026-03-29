"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { investorApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatUSDC, formatPercent, formatNumber, formatDate } from "@/lib/utils";
import type { Portfolio, Claim } from "@/types";
import {
  TrendingUp, CircleDollarSign, Wallet, ArrowUpRight,
  Clock, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";

export default function PortfolioPage() {
  const { user, devSwitchRole } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [claims, setClaims]       = useState<Claim[]>([]);
  const [loading, setLoading]     = useState(true);
  const [claiming, setClaiming]   = useState<string | null>(null);
  const [msg, setMsg]             = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.allSettled([
      investorApi.portfolio(),
      investorApi.claims(),
    ]).then(([p, c]) => {
      setPortfolio(p.status === "fulfilled" ? p.value : MOCK_PORTFOLIO);
      setClaims(c.status === "fulfilled" ? c.value.items : MOCK_CLAIMS);
    }).finally(() => setLoading(false));
  }, [user]);

  async function handleClaim(assetId: string, epochId: string, label: string) {
    setClaiming(assetId);
    setMsg("");
    try {
      await investorApi.prepareClaim(assetId, epochId);
      setMsg(`Claim prepared for ${label}. Sign in your wallet.`);
    } catch {
      setMsg(`Demo: Claim for ${label} simulated.`);
    } finally {
      setClaiming(null);
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-surface-100 border border-slate-200 dark:border-surface-200/60 flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">Connect to view your portfolio</h1>
        <p className="text-slate-500 text-sm mb-8">Sign in through Telegram to see your positions, yield, and claims.</p>
        <button onClick={() => devSwitchRole("investor")} className="btn-primary px-8">
          Demo Login as Investor
        </button>
      </div>
    );
  }

  if (loading) return <PortfolioSkeleton />;

  const p = portfolio!;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <p className="label-text mb-1">My Portfolio</p>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Welcome back, {user.display_name}</h1>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            icon: <CircleDollarSign className="w-5 h-5 text-emerald-400" />,
            label: "Total Invested",
            value: formatUSDC(p.total_invested_usdc),
            sub: "USDC principal",
            color: "text-emerald-400",
          },
          {
            icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
            label: "Unclaimed Yield",
            value: formatUSDC(p.total_unclaimed_usdc),
            sub: "Ready to claim",
            color: "text-amber-400",
          },
          {
            icon: <CheckCircle2 className="w-5 h-5 text-sky-400" />,
            label: "Total Claimed",
            value: formatUSDC(p.total_claimed_usdc),
            sub: "Lifetime earnings",
            color: "text-sky-400",
          },
        ].map(s => (
          <div key={s.label} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-3">
              {s.icon}
              <span className="label-text">{s.label}</span>
            </div>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Positions */}
      <div>
        <h2 className="section-title mb-4">Active Positions</h2>
        {p.positions.length === 0 ? (
          <div className="glass-card p-10 text-center text-slate-500">
            <p className="mb-4">No positions yet.</p>
            <Link href="/assets" className="btn-primary text-sm">Browse Assets</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {p.positions.map(pos => (
              <div key={pos.asset_id} className="glass-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">{pos.title}</h3>
                    <div className="flex gap-4 text-sm text-slate-500">
                      <span>{formatNumber(pos.shares_amount)} shares</span>
                      <span>{formatPercent(pos.shares_percentage)} of total</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {pos.unclaimed_usdc > 0 && (
                      <div className="text-right">
                        <p className="text-amber-400 font-bold text-lg">{formatUSDC(pos.unclaimed_usdc)}</p>
                        <p className="text-xs text-slate-500">Unclaimed</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/assets/${pos.asset_id}`}
                            className="btn-ghost text-xs px-3 py-2 border border-slate-200 dark:border-surface-200/60 rounded-lg">
                        <ArrowUpRight className="w-3.5 h-3.5" /> View
                      </Link>

                      {pos.unclaimed_usdc > 0 && (
                        <button
                          onClick={() => handleClaim(pos.asset_id, "epoch-latest", pos.title)}
                          disabled={claiming === pos.asset_id}
                          className="btn-primary text-xs px-4 py-2"
                        >
                          {claiming === pos.asset_id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Claim"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Share bar */}
                <div className="mt-4">
                  <div className="h-1.5 rounded-full bg-surface-200/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                      style={{ width: `${Math.min(pos.shares_percentage * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Claim message */}
      {msg && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300">
          {msg}
        </div>
      )}

      {/* Claim history */}
      <div>
        <h2 className="section-title mb-4">Claim History</h2>
        {claims.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-500 text-sm">No claims yet.</div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-surface-200/40">
                  {["Asset", "Amount", "Status", "Tx Signature"].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 label-text">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.map(c => (
                  <tr key={c.claim_id} className="border-b border-slate-50 dark:border-surface-200/20 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <Link href={`/assets/${c.asset_id}`} className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        {c.asset_id}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-emerald-700 dark:text-emerald-400 font-semibold">{formatUSDC(c.claim_amount_usdc)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        c.status === "confirmed" ? "text-emerald-400" :
                        c.status === "pending"   ? "text-amber-400" : "text-red-400"
                      }`}>
                        {c.status === "confirmed" ? <CheckCircle2 className="w-3 h-3" /> :
                         c.status === "pending"   ? <Clock className="w-3 h-3" /> :
                         <XCircle className="w-3 h-3" />}
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {c.transaction_signature ? c.transaction_signature.slice(0, 12) + "…" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 animate-pulse">
      <div className="h-8 bg-surface-200/40 rounded w-64" />
      <div className="grid grid-cols-3 gap-5">
        {[0,1,2].map(i => <div key={i} className="glass-card h-28" />)}
      </div>
      <div className="space-y-4">
        {[0,1,2].map(i => <div key={i} className="glass-card h-24" />)}
      </div>
    </div>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PORTFOLIO: Portfolio = {
  total_invested_usdc: 1200, total_claimed_usdc: 84, total_unclaimed_usdc: 19,
  positions: [
    { asset_id: "asset-1", title: "Almaty Solar Farm A",    shares_amount: 120, shares_percentage: 0.0024, unclaimed_usdc: 12.4 },
    { asset_id: "asset-3", title: "Shymkent Wind Park",     shares_amount: 20,  shares_percentage: 0.002,  unclaimed_usdc: 6.6  },
    { asset_id: "asset-6", title: "Atyrau Hydro Station",   shares_amount: 10,  shares_percentage: 0.001,  unclaimed_usdc: 0    },
  ],
};

const MOCK_CLAIMS: Claim[] = [
  { claim_id: "c1", asset_id: "asset-1", revenue_epoch_id: "r2", claim_amount_usdc: 48, status: "confirmed", transaction_signature: "5xTgN..." },
  { claim_id: "c2", asset_id: "asset-3", revenue_epoch_id: "r1", claim_amount_usdc: 36, status: "confirmed", transaction_signature: "3aPmK..." },
];
