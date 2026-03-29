"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { assetsApi, investorApi } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { ENERGY_META, formatUSDC, formatPercent, formatNumber, formatDate, shortAddress } from "@/lib/utils";
import type { AssetDetail, HoldersSummary, RevenueEpoch, AssetDocument } from "@/types";
import {
  ArrowLeft, MapPin, Zap, TrendingUp, DollarSign, Users, FileText,
  ExternalLink, Shield, CircleDollarSign, Activity, ChevronDown, ChevronUp,
} from "lucide-react";

type Tab = "overview" | "documents" | "revenue" | "holders";

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset]           = useState<AssetDetail | null>(null);
  const [holders, setHolders]       = useState<HoldersSummary | null>(null);
  const [revenue, setRevenue]       = useState<RevenueEpoch[]>([]);
  const [documents, setDocuments]   = useState<AssetDocument[]>([]);
  const [tab, setTab]               = useState<Tab>("overview");
  const [loading, setLoading]       = useState(true);

  // invest modal state
  const [investAmount, setInvestAmount] = useState("");
  const [quote, setQuote]               = useState<{ shares_to_receive: number; fees_usdc: number } | null>(null);
  const [investing, setInvesting]       = useState(false);
  const [investMsg, setInvestMsg]       = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.allSettled([
      assetsApi.get(id),
      assetsApi.holdersSummary(id),
      assetsApi.revenue(id),
      assetsApi.documents(id),
    ]).then(([a, h, r, d]) => {
      if (a.status === "fulfilled") setAsset(a.value);
      else setAsset(MOCK_ASSET);
      if (h.status === "fulfilled") setHolders(h.value);
      else setHolders(MOCK_HOLDERS);
      if (r.status === "fulfilled") setRevenue(r.value.items);
      else setRevenue(MOCK_REVENUE);
      if (d.status === "fulfilled") setDocuments(d.value.items);
      else setDocuments(MOCK_DOCS);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleQuote() {
    if (!asset || !investAmount) return;
    try {
      const q = await investorApi.quote(asset.id, parseFloat(investAmount));
      setQuote(q);
    } catch {
      setQuote({ shares_to_receive: Math.floor(parseFloat(investAmount) / 10), fees_usdc: 0 });
    }
  }

  async function handleInvest() {
    if (!asset || !investAmount) return;
    setInvesting(true);
    try {
      await investorApi.prepare(asset.id, parseFloat(investAmount));
      setInvestMsg("Investment payload prepared. Sign in your wallet to confirm.");
    } catch {
      setInvestMsg("Demo mode — investment flow simulated successfully.");
    } finally {
      setInvesting(false);
    }
  }

  if (loading) return <AssetDetailSkeleton />;
  if (!asset) return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-center text-slate-500">Asset not found.</div>
  );

  const energy = ENERGY_META[asset.energy_type];
  const fundedPct = holders?.funded_percent ?? 0;

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview",   label: "Overview" },
    { key: "documents",  label: `Documents (${documents.length})` },
    { key: "revenue",    label: `Revenue (${revenue.length})` },
    { key: "holders",    label: "Holders" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back */}
      <Link href="/assets" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title card */}
          <div className="glass-card p-7">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                                bg-slate-100 dark:bg-surface-100
                                border border-slate-200 dark:border-surface-200/60">
                  {energy.emoji}
                </div>
                <div>
                  <p className="label-text">{energy.label}</p>
                  <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{asset.title}</h1>
                </div>
              </div>
              <StatusBadge status={asset.status} />
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">{asset.short_description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                {asset.location.city}, {asset.location.country}
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                {formatNumber(asset.capacity_kw)} kW capacity
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                Issuer: {asset.issuer.display_name}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="glass-card overflow-hidden">
            <div className="flex border-b border-slate-100 dark:border-surface-200/40">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 py-3.5 px-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    tab === t.key
                      ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Overview */}
              {tab === "overview" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">About this asset</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{asset.full_description}</p>
                  </div>
                  {asset.onchain_refs.onchain_asset_pubkey && (
                    <div>
                      <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">On-chain references</h3>
                      <div className="space-y-2">
                        {[
                          { label: "Asset Account", val: asset.onchain_refs.onchain_asset_pubkey },
                          { label: "Share Mint",    val: asset.onchain_refs.share_mint_pubkey },
                          { label: "Vault",         val: asset.onchain_refs.vault_pubkey },
                        ].filter(r => r.val).map(r => (
                          <div key={r.label} className="flex items-center justify-between p-3 rounded-lg
                                                        bg-slate-50 dark:bg-surface-100/40
                                                        border border-slate-200 dark:border-surface-200/40">
                            <span className="text-xs text-slate-500">{r.label}</span>
                            <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">{shortAddress(r.val!)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              {tab === "documents" && (
                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <p className="text-slate-500 text-sm">No public documents yet.</p>
                  ) : documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl transition-colors group
                                                  border border-slate-200 dark:border-surface-200/50
                                                  hover:border-emerald-300 dark:hover:border-emerald-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center
                                        bg-emerald-50 dark:bg-surface-100
                                        border border-emerald-100 dark:border-surface-200/40">
                          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{doc.title}</p>
                          <p className="text-xs text-slate-400 capitalize">{doc.type.replace(/_/g, " ")} · {doc.storage_provider}</p>
                        </div>
                      </div>
                      <a href={doc.storage_uri} target="_blank" rel="noopener noreferrer"
                         className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400
                                    hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Revenue */}
              {tab === "revenue" && (
                <div className="space-y-3">
                  {revenue.length === 0 ? (
                    <p className="text-slate-500 text-sm">No revenue epochs posted yet.</p>
                  ) : revenue.map(epoch => (
                    <div key={epoch.id} className="p-4 rounded-xl space-y-3
                                                    border border-slate-200 dark:border-surface-200/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Epoch #{epoch.epoch_number}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                          epoch.posting_status === "posted"
                            ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                            : epoch.posting_status === "settled"
                            ? "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50"
                            : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50"
                        }`}>
                          {epoch.posting_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatDate(epoch.period_start)} — {formatDate(epoch.period_end)}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-surface-100/30">
                          <p className="text-slate-400 text-xs mb-0.5">Gross</p>
                          <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">{formatUSDC(epoch.gross_revenue_usdc)}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-surface-100/30">
                          <p className="text-slate-400 text-xs mb-0.5">Net</p>
                          <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">{formatUSDC(epoch.net_revenue_usdc)}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                          <p className="text-amber-500 text-xs mb-0.5">Distributable</p>
                          <p className="text-amber-600 dark:text-amber-400 text-sm font-bold">{formatUSDC(epoch.distributable_revenue_usdc)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Holders */}
              {tab === "holders" && holders && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Total Investors",   val: formatNumber(holders.total_investors),        color: "text-emerald-700 dark:text-emerald-400" },
                    { label: "Funded",            val: formatPercent(holders.funded_percent),          color: "text-amber-600 dark:text-amber-400" },
                    { label: "Total Distributed", val: formatUSDC(holders.total_distributed_usdc),    color: "text-sky-600 dark:text-sky-400" },
                    { label: "Total Claimed",     val: formatUSDC(holders.total_claimed_usdc),         color: "text-purple-600 dark:text-purple-400" },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-xl
                                                   bg-slate-50 dark:bg-surface-100/50
                                                   border border-slate-200 dark:border-surface-200/40">
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{s.label}</p>
                      <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Sale terms */}
          {asset.sale_terms && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Sale Terms</h3>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Funded</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatPercent(fundedPct)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-surface-200/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                    style={{ width: `${Math.min(fundedPct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: "Valuation",     val: formatUSDC(parseFloat(asset.sale_terms.valuation_usdc)) },
                  { label: "Total Shares",  val: formatNumber(asset.sale_terms.total_shares) },
                  { label: "Price / Share", val: formatUSDC(parseFloat(asset.sale_terms.price_per_share_usdc)) },
                  { label: "Min. Buy",      val: formatUSDC(parseFloat(asset.sale_terms.minimum_buy_amount_usdc)) },
                  { label: "Target Raise",  val: formatUSDC(parseFloat(asset.sale_terms.target_raise_usdc)) },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm
                                                   border-b border-slate-100 dark:border-surface-200/30 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-500">{row.label}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{row.val}</span>
                  </div>
                ))}
              </div>

              <div className="yield-tag justify-center w-full">
                <TrendingUp className="w-3.5 h-3.5" />
                {formatPercent(asset.expected_annual_yield_percent)} Expected APY
              </div>
            </div>
          )}

          {/* Invest widget */}
          {asset.status === "active_sale" && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Invest</h3>
              <div>
                <label className="label-text block mb-2">Amount (USDC)</label>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="0.00" min="0"
                    value={investAmount}
                    onChange={e => { setInvestAmount(e.target.value); setQuote(null); setInvestMsg(""); }}
                    className="input-field flex-1"
                  />
                  <button onClick={handleQuote} disabled={!investAmount} className="btn-secondary text-xs px-3 py-2">
                    Quote
                  </button>
                </div>
              </div>

              {quote && (
                <div className="rounded-xl p-3 space-y-1.5 text-sm
                                bg-emerald-50 dark:bg-emerald-950/30
                                border border-emerald-200 dark:border-emerald-900/50">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shares to receive</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{formatNumber(quote.shares_to_receive)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fees</span>
                    <span className="text-slate-600 dark:text-slate-300">{formatUSDC(quote.fees_usdc)}</span>
                  </div>
                </div>
              )}

              {investMsg && (
                <div className="rounded-xl p-3 text-xs
                                bg-sky-50 dark:bg-sky-950/30
                                border border-sky-200 dark:border-sky-900/50
                                text-sky-700 dark:text-sky-300">
                  {investMsg}
                </div>
              )}

              <button onClick={handleInvest} disabled={investing || !investAmount} className="btn-primary w-full justify-center">
                {investing ? "Preparing…" : "Invest Now"}
              </button>
              <p className="text-xs text-slate-400 text-center">Gasless first transaction · Powered by Solana</p>
            </div>
          )}

          {/* Revenue summary */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 text-sm">Revenue Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-surface-100/50 border border-emerald-100 dark:border-transparent">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{asset.revenue_summary.total_epochs}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Epochs</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-surface-100/50 border border-amber-100 dark:border-transparent">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{asset.revenue_summary.last_posted_epoch}</p>
                <p className="text-xs text-slate-400 mt-0.5">Last Epoch</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 animate-pulse space-y-6">
      <div className="h-4 bg-surface-200/40 rounded w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-7 space-y-4">
            <div className="h-6 bg-surface-200/40 rounded w-1/2" />
            <div className="h-4 bg-surface-200/20 rounded w-3/4" />
          </div>
          <div className="glass-card h-64" />
        </div>
        <div className="space-y-5">
          <div className="glass-card h-52" />
          <div className="glass-card h-40" />
        </div>
      </div>
    </div>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_DOCS: AssetDocument[] = [
  { id: "d1", type: "technical_passport", title: "Technical Passport", storage_provider: "arweave", storage_uri: "#", content_hash: "sha256:abc", is_public: true },
  { id: "d2", type: "ownership_doc",       title: "Ownership Certificate", storage_provider: "arweave", storage_uri: "#", content_hash: "sha256:def", is_public: true },
  { id: "d3", type: "financial_model",     title: "Financial Model (2024–2039)", storage_provider: "ipfs", storage_uri: "#", content_hash: "sha256:ghi", is_public: true },
];

const MOCK_REVENUE: RevenueEpoch[] = [
  { id: "r1", epoch_number: 3, period_start: "2026-03-01", period_end: "2026-03-31", gross_revenue_usdc: 2800, net_revenue_usdc: 2300, distributable_revenue_usdc: 2000, report_uri: "#", posting_status: "posted" },
  { id: "r2", epoch_number: 2, period_start: "2026-02-01", period_end: "2026-02-28", gross_revenue_usdc: 2500, net_revenue_usdc: 2100, distributable_revenue_usdc: 1800, report_uri: "#", posting_status: "settled" },
  { id: "r3", epoch_number: 1, period_start: "2026-01-01", period_end: "2026-01-31", gross_revenue_usdc: 2200, net_revenue_usdc: 1900, distributable_revenue_usdc: 1600, report_uri: "#", posting_status: "settled" },
];

const MOCK_HOLDERS: HoldersSummary = {
  total_investors: 93, funded_percent: 71.5, total_distributed_usdc: 14320, total_claimed_usdc: 12904,
};

const MOCK_ASSET: AssetDetail = {
  id: "asset-1", slug: "almaty-solar-farm-a",
  title: "Almaty Solar Farm A",
  short_description: "Yield-bearing solar farm asset in the Almaty region with verified 150 kW capacity.",
  full_description: "This solar installation is located on a 2-hectare plot in the Almaty region of Kazakhstan. It operates under a 15-year power purchase agreement with a local energy cooperative, providing a stable and predictable revenue stream. All documents are verified and stored on Arweave.",
  energy_type: "solar", status: "active_sale",
  location: { country: "Kazakhstan", region: "Almaty Region", city: "Almaty" },
  capacity_kw: 150, currency: "USDC", expected_annual_yield_percent: 13.2,
  issuer: { id: "issuer-1", display_name: "SolaShare Issuer LLC" },
  sale_terms: {
    valuation_usdc: "100000.000000", total_shares: 10000,
    price_per_share_usdc: "10.000000", minimum_buy_amount_usdc: "50.000000",
    target_raise_usdc: "50000.000000", sale_status: "live",
  },
  public_documents: MOCK_DOCS,
  revenue_summary: { total_epochs: 3, last_posted_epoch: 3 },
  onchain_refs: { onchain_asset_pubkey: "GkXyZ123...", share_mint_pubkey: "Mm9PqR456...", vault_pubkey: "Vt7WuS789..." },
};
