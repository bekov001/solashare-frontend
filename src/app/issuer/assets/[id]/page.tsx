"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { assetsApi, issuerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { ENERGY_META, formatUSDC, formatNumber } from "@/lib/utils";
import type { AssetDetail, RevenueEpoch } from "@/types";
import { ArrowLeft, Send, Plus, RefreshCw, ExternalLink, FileText } from "lucide-react";

export default function ManageAssetPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router   = useRouter();

  const [asset, setAsset]     = useState<AssetDetail | null>(null);
  const [revenue, setRevenue] = useState<RevenueEpoch[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState("");

  // Revenue epoch form
  const [showEpoch, setShowEpoch] = useState(false);
  const [epoch, setEpoch]         = useState({
    epoch_number: "1", period_start: "", period_end: "",
    gross_revenue_usdc: "", net_revenue_usdc: "", distributable_revenue_usdc: "",
    report_uri: "", report_hash: "", source_type: "operator_statement",
  });
  const [savingEpoch, setSavingEpoch] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.allSettled([
      assetsApi.get(id),
      assetsApi.revenue(id),
    ]).then(([a, r]) => {
      setAsset(a.status === "fulfilled" ? a.value : MOCK_ASSET);
      setRevenue(r.status === "fulfilled" ? r.value.items : []);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    if (!asset) return;
    setSubmitting(true);
    try {
      const res = await issuerApi.submit(asset.id);
      setMsg(`Asset submitted → ${res.next_status}`);
      setAsset(prev => prev ? { ...prev, status: res.next_status as AssetDetail["status"] } : null);
    } catch {
      setMsg("Demo: Submit simulated.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateEpoch(e: React.FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setSavingEpoch(true);
    try {
      const res = await issuerApi.createRevenueEpoch(asset.id, {
        epoch_number:              parseInt(epoch.epoch_number),
        period_start:              epoch.period_start,
        period_end:                epoch.period_end,
        gross_revenue_usdc:        parseFloat(epoch.gross_revenue_usdc),
        net_revenue_usdc:          parseFloat(epoch.net_revenue_usdc),
        distributable_revenue_usdc: parseFloat(epoch.distributable_revenue_usdc),
        report_uri:                epoch.report_uri,
        report_hash:               epoch.report_hash,
        source_type:               epoch.source_type,
      });
      setMsg(`Revenue epoch ${res.revenue_epoch_id} created.`);
      setShowEpoch(false);
      // refresh revenue
      assetsApi.revenue(asset.id).then(r => setRevenue(r.items)).catch(() => {});
    } catch {
      setMsg("Demo: Revenue epoch created.");
      setShowEpoch(false);
    } finally {
      setSavingEpoch(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-5 animate-pulse">
        <div className="h-5 bg-surface-200/40 rounded w-32" />
        <div className="glass-card h-40" />
        <div className="glass-card h-48" />
      </div>
    );
  }

  if (!asset) return <div className="max-w-4xl mx-auto px-6 py-20 text-center text-slate-500">Asset not found.</div>;

  const energy = ENERGY_META[asset.energy_type];
  const canSubmit = asset.status === "draft" || asset.status === "verified";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-7">
      <Link href="/issuer" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      {/* Asset header */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface-100 border border-surface-200/60 flex items-center justify-center text-2xl">
              {energy.emoji}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-100">{asset.title}</h1>
              <p className="text-sm text-slate-500">{asset.location.city}, {asset.location.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={asset.status} />
            {canSubmit && (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm">
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {msg && (
        <div className="rounded-xl bg-sky-950/30 border border-sky-900/50 px-5 py-3 text-sm text-sky-300">{msg}</div>
      )}

      {/* Asset details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Energy Type",    val: energy.label },
          { label: "Capacity",       val: `${formatNumber(asset.capacity_kw)} kW` },
          { label: "Expected APY",   val: `${asset.expected_annual_yield_percent}%` },
          { label: "Revenue Epochs", val: String(asset.revenue_summary.total_epochs) },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className="text-slate-100 font-bold text-lg">{s.val}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sale terms */}
      {asset.sale_terms && (
        <div className="glass-card p-6">
          <h2 className="font-bold text-slate-100 mb-4">Sale Terms</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            {[
              { label: "Valuation",     val: formatUSDC(parseFloat(asset.sale_terms.valuation_usdc)) },
              { label: "Total Shares",  val: formatNumber(asset.sale_terms.total_shares) },
              { label: "Price / Share", val: formatUSDC(parseFloat(asset.sale_terms.price_per_share_usdc)) },
              { label: "Min. Buy",      val: formatUSDC(parseFloat(asset.sale_terms.minimum_buy_amount_usdc)) },
              { label: "Target Raise",  val: formatUSDC(parseFloat(asset.sale_terms.target_raise_usdc)) },
              { label: "Sale Status",   val: asset.sale_terms.sale_status },
            ].map(row => (
              <div key={row.label} className="flex justify-between border-b border-surface-200/30 pb-2">
                <span className="text-slate-500">{row.label}</span>
                <span className="text-slate-200 font-medium">{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue epochs */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-100">Revenue Epochs</h2>
          <button onClick={() => setShowEpoch(!showEpoch)} className="btn-secondary text-xs">
            <Plus className="w-3.5 h-3.5" /> New Epoch
          </button>
        </div>

        {showEpoch && (
          <form onSubmit={handleCreateEpoch} className="mb-6 p-5 rounded-xl border border-emerald-900/50 bg-emerald-950/20 space-y-4">
            <h3 className="font-semibold text-emerald-400 text-sm">New Revenue Epoch</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-1.5">Epoch #</label>
                <input required type="number" min="1" className="input-field text-sm py-2"
                  value={epoch.epoch_number} onChange={e => setEpoch(p => ({ ...p, epoch_number: e.target.value }))} />
              </div>
              <div>
                <label className="label-text block mb-1.5">Source Type</label>
                <select className="input-field text-sm py-2"
                  value={epoch.source_type} onChange={e => setEpoch(p => ({ ...p, source_type: e.target.value }))}>
                  {["manual_report","meter_export","operator_statement"].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-1.5">Period Start</label>
                <input required type="date" className="input-field text-sm py-2"
                  value={epoch.period_start} onChange={e => setEpoch(p => ({ ...p, period_start: e.target.value }))} />
              </div>
              <div>
                <label className="label-text block mb-1.5">Period End</label>
                <input required type="date" className="input-field text-sm py-2"
                  value={epoch.period_end} onChange={e => setEpoch(p => ({ ...p, period_end: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {["gross_revenue_usdc","net_revenue_usdc","distributable_revenue_usdc"].map(field => (
                <div key={field}>
                  <label className="label-text block mb-1.5">{field.replace(/_usdc|_/g, s => s === "_usdc" ? "" : " ").trim()}</label>
                  <input required type="number" min="0" step="0.01" className="input-field text-sm py-2" placeholder="0.00"
                    value={(epoch as Record<string, string>)[field]}
                    onChange={e => setEpoch(p => ({ ...p, [field]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div>
              <label className="label-text block mb-1.5">Report URI</label>
              <input className="input-field text-sm py-2" placeholder="https://arweave.net/..."
                value={epoch.report_uri} onChange={e => setEpoch(p => ({ ...p, report_uri: e.target.value }))} />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowEpoch(false)} className="btn-ghost text-sm">Cancel</button>
              <button type="submit" disabled={savingEpoch} className="btn-primary text-sm">
                {savingEpoch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Create Epoch"}
              </button>
            </div>
          </form>
        )}

        {revenue.length === 0 ? (
          <p className="text-sm text-slate-500">No revenue epochs posted yet.</p>
        ) : (
          <div className="space-y-3">
            {revenue.map(r => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-surface-200/40">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Epoch #{r.epoch_number}</p>
                  <p className="text-xs text-slate-500">{r.period_start} – {r.period_end}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-bold text-sm">{formatUSDC(r.distributable_revenue_usdc)}</p>
                  <p className="text-xs text-slate-500">{r.posting_status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-100">Documents</h2>
        </div>
        {asset.public_documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded.</p>
        ) : (
          <div className="space-y-2">
            {asset.public_documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-surface-200/40">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-sm text-slate-200">{doc.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{doc.type.replace(/_/g," ")} · {doc.storage_provider}</p>
                  </div>
                </div>
                <a href={doc.storage_uri} target="_blank" rel="noopener noreferrer"
                   className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-emerald-400">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const MOCK_ASSET: AssetDetail = {
  id: "asset-1", slug: "almaty-solar-farm-a",
  title: "Almaty Solar Farm A",
  short_description: "Yield-bearing solar farm in the Almaty region.",
  full_description: "150 kW solar installation with a 15-year PPA.",
  energy_type: "solar", status: "active_sale",
  location: { country: "Kazakhstan", region: "Almaty Region", city: "Almaty" },
  capacity_kw: 150, currency: "USDC", expected_annual_yield_percent: 13.2,
  issuer: { id: "issuer-1", display_name: "SolaShare Issuer LLC" },
  sale_terms: {
    valuation_usdc: "100000.000000", total_shares: 10000,
    price_per_share_usdc: "10.000000", minimum_buy_amount_usdc: "50.000000",
    target_raise_usdc: "50000.000000", sale_status: "live",
  },
  public_documents: [
    { id: "d1", type: "technical_passport", title: "Technical Passport", storage_provider: "arweave", storage_uri: "#", content_hash: "sha256:abc", is_public: true },
  ],
  revenue_summary: { total_epochs: 3, last_posted_epoch: 3 },
  onchain_refs: { onchain_asset_pubkey: null, share_mint_pubkey: null, vault_pubkey: null },
};
