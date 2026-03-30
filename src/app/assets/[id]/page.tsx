"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { assetsApi, investorApi } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { ENERGY_META, formatUSDC, formatPercent, formatNumber, formatDate, shortAddress } from "@/lib/utils";
import type { AssetDetail, HoldersSummary, RevenueEpoch, AssetDocument } from "@/types";
import {
  ArrowLeft, MapPin, Zap, TrendingUp, Users, FileText,
  ExternalLink, Shield, CircleDollarSign,
} from "lucide-react";

type Tab = "overview" | "documents" | "revenue" | "holders";

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset]         = useState<AssetDetail | null>(null);
  const [holders, setHolders]     = useState<HoldersSummary | null>(null);
  const [revenue, setRevenue]     = useState<RevenueEpoch[]>([]);
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [tab, setTab]             = useState<Tab>("overview");
  const [loading, setLoading]     = useState(true);

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
    <div className="max-w-4xl mx-auto px-6 py-20 text-center" style={{ color: "var(--text-muted)" }}>Asset not found.</div>
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
    <div className="max-w-[1440px] mx-auto px-8 py-8 animate-fade-in">
      {/* Back */}
      <Link href="/assets" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:text-[#9945FF] transition-colors"
            style={{ color: "var(--text-muted)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title card */}
          <div className="card p-7">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                     style={{ background: "var(--surface-low)" }}>
                  {energy.emoji}
                </div>
                <div>
                  <p className="label-xs">{energy.label}</p>
                  <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>{asset.title}</h1>
                </div>
              </div>
              <StatusBadge status={asset.status} />
            </div>

            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>{asset.short_description}</p>

            <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#9945FF]" />
                {asset.location.city}, {asset.location.country}
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#14F195]" />
                {formatNumber(asset.capacity_kw)} kW capacity
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#9945FF]" />
                Issuer: {asset.issuer.display_name}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="card overflow-hidden p-0">
            <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 py-3.5 px-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                    tab === t.key
                      ? "text-[#9945FF] border-b-2 border-[#9945FF]"
                      : "hover:bg-[var(--surface-low)]"
                  }`}
                  style={tab === t.key ? {} : { color: "var(--text-muted)" }}
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
                    <h3 className="font-black mb-2" style={{ color: "var(--text)" }}>About this asset</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{asset.full_description}</p>
                  </div>
                  {asset.onchain_refs.onchain_asset_pubkey && (
                    <div>
                      <h3 className="font-black mb-3" style={{ color: "var(--text)" }}>On-chain references</h3>
                      <div className="space-y-2">
                        {[
                          { label: "Asset Account", val: asset.onchain_refs.onchain_asset_pubkey },
                          { label: "Share Mint",    val: asset.onchain_refs.share_mint_pubkey },
                          { label: "Vault",         val: asset.onchain_refs.vault_pubkey },
                        ].filter(r => r.val).map(r => (
                          <div key={r.label} className="flex items-center justify-between p-3 rounded-2xl"
                               style={{ background: "var(--surface-low)" }}>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.label}</span>
                            <span className="font-mono text-xs text-[#9945FF]">{shortAddress(r.val!)}</span>
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
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No public documents yet.</p>
                  ) : documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl border transition-all hover:border-[#9945FF]/20"
                         style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                             style={{ background: "var(--surface-low)" }}>
                          <FileText className="w-4 h-4 text-[#9945FF]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{doc.title}</p>
                          <p className="text-xs capitalize" style={{ color: "var(--text-faint)" }}>{doc.type.replace(/_/g, " ")} · {doc.storage_provider}</p>
                        </div>
                      </div>
                      <a href={doc.storage_uri} target="_blank" rel="noopener noreferrer"
                         className="p-2 rounded-xl transition-colors hover:bg-[#9945FF]/5 hover:text-[#9945FF]"
                         style={{ color: "var(--text-faint)" }}>
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
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No revenue epochs posted yet.</p>
                  ) : revenue.map(epoch => (
                    <div key={epoch.id} className="p-4 rounded-2xl border space-y-3"
                         style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black" style={{ color: "var(--text)" }}>
                          Epoch #{epoch.epoch_number}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          epoch.posting_status === "posted"
                            ? "text-[#14F195] bg-[#14F195]/10"
                            : epoch.posting_status === "settled"
                            ? "text-[#9945FF] bg-[#9945FF]/10"
                            : "bg-[var(--surface-low)]"
                        }`} style={epoch.posting_status === "draft" ? { color: "var(--text-muted)" } : {}}>
                          {epoch.posting_status}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                        {formatDate(epoch.period_start)} — {formatDate(epoch.period_end)}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Gross", val: formatUSDC(epoch.gross_revenue_usdc), accent: false },
                          { label: "Net", val: formatUSDC(epoch.net_revenue_usdc), accent: false },
                          { label: "Distributable", val: formatUSDC(epoch.distributable_revenue_usdc), accent: true },
                        ].map(s => (
                          <div key={s.label} className="text-center p-2 rounded-xl"
                               style={{ background: "var(--surface-low)" }}>
                            <p className="text-xs mb-0.5" style={{ color: "var(--text-faint)" }}>{s.label}</p>
                            <p className={`text-sm font-bold ${s.accent ? "text-[#9945FF]" : ""}`}
                               style={s.accent ? {} : { color: "var(--text)" }}>{s.val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Holders */}
              {tab === "holders" && holders && (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Total Investors",   val: formatNumber(holders.total_investors),       color: "text-[#14F195]" },
                    { label: "Funded",            val: formatPercent(holders.funded_percent),        color: "text-[#9945FF]" },
                    { label: "Total Distributed", val: formatUSDC(holders.total_distributed_usdc),  color: "text-[#00693e]" },
                    { label: "Total Claimed",     val: formatUSDC(holders.total_claimed_usdc),       color: "text-[#9945FF]" },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-2xl"
                         style={{ background: "var(--surface-low)" }}>
                      <p className="text-xs mb-1 label-xs">{s.label}</p>
                      <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
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
            <div className="card p-6 space-y-4">
              <h3 className="font-black" style={{ color: "var(--text)" }}>Sale Terms</h3>

              <div>
                <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  <span>Funded</span>
                  <span className="font-bold text-[#14F195]">{formatPercent(fundedPct)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-low)" }}>
                  <div
                    className="h-full rounded-full sol-gradient transition-all duration-700"
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
                  <div key={row.label} className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0"
                       style={{ borderColor: "var(--border)" }}>
                    <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                    <span className="font-bold" style={{ color: "var(--text)" }}>{row.val}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl"
                   style={{ background: "var(--surface-low)" }}>
                <TrendingUp className="w-3.5 h-3.5 text-[#9945FF]" />
                <span className="text-sm font-black text-[#9945FF]">
                  {formatPercent(asset.expected_annual_yield_percent)} Expected APY
                </span>
              </div>
            </div>
          )}

          {/* Invest widget */}
          {asset.status === "active_sale" && (
            <div className="card p-6 space-y-4">
              <h3 className="font-black" style={{ color: "var(--text)" }}>Invest</h3>
              <div>
                <label className="label-xs block mb-2">Amount (USDC)</label>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="0.00" min="0"
                    value={investAmount}
                    onChange={e => { setInvestAmount(e.target.value); setQuote(null); setInvestMsg(""); }}
                    className="input-new flex-1"
                  />
                  <button onClick={handleQuote} disabled={!investAmount} className="btn-outline text-xs px-3 py-2">
                    Quote
                  </button>
                </div>
              </div>

              {quote && (
                <div className="rounded-2xl p-3 space-y-1.5 text-sm"
                     style={{ background: "var(--surface-low)" }}>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Shares to receive</span>
                    <span className="font-black text-[#14F195]">{formatNumber(quote.shares_to_receive)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Fees</span>
                    <span className="font-medium" style={{ color: "var(--text)" }}>{formatUSDC(quote.fees_usdc)}</span>
                  </div>
                </div>
              )}

              {investMsg && (
                <div className="rounded-2xl p-3 text-xs font-medium text-[#9945FF]"
                     style={{ background: "#9945FF10" }}>
                  {investMsg}
                </div>
              )}

              <button onClick={handleInvest} disabled={investing || !investAmount} className="btn-sol w-full">
                {investing ? "Preparing…" : "Invest Now"}
              </button>
              <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>Gasless first transaction · Powered by Solana</p>
            </div>
          )}

          {/* Revenue summary */}
          <div className="card p-5">
            <h3 className="font-black text-sm mb-3" style={{ color: "var(--text)" }}>Revenue Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-2xl" style={{ background: "var(--surface-low)" }}>
                <p className="text-2xl font-black text-[#14F195]">{asset.revenue_summary.total_epochs}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Total Epochs</p>
              </div>
              <div className="text-center p-3 rounded-2xl" style={{ background: "var(--surface-low)" }}>
                <p className="text-2xl font-black text-[#9945FF]">{asset.revenue_summary.last_posted_epoch}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Last Epoch</p>
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
    <div className="max-w-[1440px] mx-auto px-8 py-8 animate-pulse space-y-6">
      <div className="h-4 rounded-xl w-32" style={{ background: "var(--surface-low)" }} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-7 space-y-4">
            <div className="h-6 rounded-xl w-1/2" style={{ background: "var(--surface-low)" }} />
            <div className="h-4 rounded-xl w-3/4" style={{ background: "var(--surface-low)" }} />
          </div>
          <div className="card h-64" />
        </div>
        <div className="space-y-5">
          <div className="card h-52" />
          <div className="card h-40" />
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
