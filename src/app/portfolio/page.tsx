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
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 sol-gradient">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black mb-3" style={{ color: "var(--text)" }}>Connect to view your portfolio</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Sign in through Telegram to see your positions, yield, and claims.</p>
        <button onClick={() => devSwitchRole("investor")} className="btn-sol px-8">
          Demo Login as Investor
        </button>
      </div>
    );
  }

  if (loading) return <PortfolioSkeleton />;

  const p = portfolio!;

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-10 animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <p className="label-xs mb-2">My Portfolio</p>
        <h1 className="text-4xl font-black" style={{ color: "var(--text)" }}>Welcome back, {user.display_name}</h1>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            icon: <CircleDollarSign className="w-6 h-6 text-[#14F195]" />,
            label: "Total Invested",
            value: formatUSDC(p.total_invested_usdc),
            sub: "USDC principal",
            color: "text-[#14F195]",
          },
          {
            icon: <TrendingUp className="w-6 h-6 text-[#9945FF]" />,
            label: "Unclaimed Yield",
            value: formatUSDC(p.total_unclaimed_usdc),
            sub: "Ready to claim",
            color: "text-[#9945FF]",
          },
          {
            icon: <CheckCircle2 className="w-6 h-6 text-[#00693e]" />,
            label: "Total Claimed",
            value: formatUSDC(p.total_claimed_usdc),
            sub: "Lifetime earnings",
            color: "text-[#00693e]",
          },
        ].map(s => (
          <div key={s.label} className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              {s.icon}
              <span className="label-xs">{s.label}</span>
            </div>
            <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-faint)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Positions */}
      <div>
        <h2 className="text-2xl font-black mb-4" style={{ color: "var(--text)" }}>Active Positions</h2>
        {p.positions.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="mb-4" style={{ color: "var(--text-muted)" }}>No positions yet.</p>
            <Link href="/assets" className="btn-sol text-sm">Browse Assets</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {p.positions.map(pos => (
              <div key={pos.asset_id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-black text-lg mb-1" style={{ color: "var(--text)" }}>{pos.title}</h3>
                    <div className="flex gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
                      <span>{formatNumber(pos.shares_amount)} shares</span>
                      <span>{formatPercent(pos.shares_percentage)} of total</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {pos.unclaimed_usdc > 0 && (
                      <div className="text-right">
                        <p className="text-[#9945FF] font-black text-lg">{formatUSDC(pos.unclaimed_usdc)}</p>
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>Unclaimed</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/assets/${pos.asset_id}`} className="btn-outline text-xs px-3 py-2">
                        <ArrowUpRight className="w-3.5 h-3.5" /> View
                      </Link>

                      {pos.unclaimed_usdc > 0 && (
                        <button
                          onClick={() => handleClaim(pos.asset_id, "epoch-latest", pos.title)}
                          disabled={claiming === pos.asset_id}
                          className="btn-sol text-xs px-4 py-2"
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
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-low)" }}>
                    <div
                      className="h-full rounded-full sol-gradient"
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
        <div className="rounded-2xl px-5 py-4 text-sm font-medium" style={{ background: "var(--surface-low)", color: "var(--text)" }}>
          {msg}
        </div>
      )}

      {/* Claim history */}
      <div>
        <h2 className="text-2xl font-black mb-4" style={{ color: "var(--text)" }}>Claim History</h2>
        {claims.length === 0 ? (
          <div className="card p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No claims yet.</div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Asset", "Amount", "Status", "Tx Signature"].map(h => (
                    <th key={h} className="text-left px-5 py-4 label-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.map(c => (
                  <tr key={c.claim_id} className="border-b transition-colors hover:bg-[#9945FF]/5"
                      style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-4">
                      <Link href={`/assets/${c.asset_id}`} className="font-medium hover:text-[#9945FF] transition-colors"
                            style={{ color: "var(--text-muted)" }}>
                        {c.asset_id}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-black text-[#14F195]">{formatUSDC(c.claim_amount_usdc)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                        c.status === "confirmed" ? "text-[#14F195]" :
                        c.status === "pending"   ? "text-[#9945FF]" : "text-red-400"
                      }`}>
                        {c.status === "confirmed" ? <CheckCircle2 className="w-3 h-3" /> :
                         c.status === "pending"   ? <Clock className="w-3 h-3" /> :
                         <XCircle className="w-3 h-3" />}
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs" style={{ color: "var(--text-faint)" }}>
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
    <div className="max-w-[1440px] mx-auto px-8 py-10 space-y-8 animate-pulse">
      <div className="h-10 rounded-2xl w-64" style={{ background: "var(--surface-low)" }} />
      <div className="grid grid-cols-3 gap-5">
        {[0,1,2].map(i => <div key={i} className="card h-28" />)}
      </div>
      <div className="space-y-4">
        {[0,1,2].map(i => <div key={i} className="card h-24" />)}
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
