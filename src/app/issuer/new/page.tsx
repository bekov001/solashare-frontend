"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { issuerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, ArrowRight, Check, Sun, FileText, DollarSign } from "lucide-react";

type Step = "info" | "sale" | "documents" | "done";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "info", label: "Asset Info", icon: <Sun className="w-4 h-4" /> },
  { key: "sale", label: "Sale Terms", icon: <DollarSign className="w-4 h-4" /> },
  { key: "documents", label: "Documents", icon: <FileText className="w-4 h-4" /> },
  { key: "done", label: "Submit", icon: <Check className="w-4 h-4" /> },
];

const ENERGY_OPTIONS = ["solar", "wind", "hydro", "ev_charging", "other"];

export default function NewAssetPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("info");
  const [assetId, setAssetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [info, setInfo] = useState({
    title: "",
    short_description: "",
    full_description: "",
    energy_type: "solar",
    location_country: "Kazakhstan",
    location_city: "",
    capacity_kw: "",
  });

  const [sale, setSale] = useState({
    valuation_usdc: "",
    total_shares: "",
    price_per_share_usdc: "",
    minimum_buy_amount_usdc: "",
    target_raise_usdc: "",
  });

  const [doc, setDoc] = useState({
    type: "technical_passport",
    title: "",
    storage_provider: "arweave",
    storage_uri: "",
    content_hash: "",
  });

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center animate-fade-in">
        <p className="text-slate-500 mb-6">Sign in as an issuer to create assets.</p>
        <Link href="/login" className="btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  if (user.role !== "issuer") {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center" style={{ color: "var(--text-muted)" }}>
        Access restricted to issuers.
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
        <div className="glass-card h-64" />
      </div>
    );
  }

  const stepIdx = STEPS.findIndex((s) => s.key === step);

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await issuerApi.createAsset({
        ...info,
        capacity_kw: parseFloat(info.capacity_kw),
      });
      setAssetId(res.asset_id);
      setStep("sale");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create asset draft.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetId) return;

    setLoading(true);
    setError("");

    try {
      await issuerApi.setSaleTerms(assetId, {
        valuation_usdc: parseFloat(sale.valuation_usdc),
        total_shares: parseInt(sale.total_shares),
        price_per_share_usdc: parseFloat(sale.price_per_share_usdc),
        minimum_buy_amount_usdc: parseFloat(sale.minimum_buy_amount_usdc),
        target_raise_usdc: parseFloat(sale.target_raise_usdc),
      });
      setStep("documents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sale terms.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDocSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetId) return;

    setLoading(true);
    setError("");

    try {
      await issuerApi.uploadDocument(assetId, doc);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSubmit() {
    if (!assetId) return;

    setLoading(true);
    setError("");

    try {
      await issuerApi.submit(assetId);
      router.push("/issuer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit asset.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <Link href="/issuer" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="mb-8">
        <p className="label-text mb-1">New Asset</p>
        <h1 className="text-2xl font-extrabold text-slate-100">Create Solar Asset</h1>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const done = i < stepIdx;
          const current = s.key === step;

          return (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  current
                    ? "bg-emerald-600/20 border border-emerald-700/60 text-emerald-400"
                    : done
                      ? "text-emerald-600"
                      : "text-slate-600"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${done ? "bg-emerald-800/60" : "bg-surface-200/40"}`} />}
            </div>
          );
        })}
      </div>

      {step === "info" && (
        <form onSubmit={handleInfoSubmit} className="glass-card p-7 space-y-5">
          <h2 className="font-bold text-slate-100 text-lg">Asset Information</h2>

          <div>
            <label className="label-text block mb-2">Title *</label>
            <input required className="input-field" placeholder="e.g. Almaty Solar Farm A" value={info.title} onChange={(e) => setInfo((p) => ({ ...p, title: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-2">Energy Type *</label>
              <select required className="input-field" value={info.energy_type} onChange={(e) => setInfo((p) => ({ ...p, energy_type: e.target.value }))}>
                {ENERGY_OPTIONS.map((o) => (
                  <option key={o} value={o} className="capitalize">
                    {o.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text block mb-2">Capacity (kW) *</label>
              <input required type="number" min="1" className="input-field" placeholder="150" value={info.capacity_kw} onChange={(e) => setInfo((p) => ({ ...p, capacity_kw: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-2">Country *</label>
              <input required className="input-field" placeholder="Kazakhstan" value={info.location_country} onChange={(e) => setInfo((p) => ({ ...p, location_country: e.target.value }))} />
            </div>
            <div>
              <label className="label-text block mb-2">City *</label>
              <input required className="input-field" placeholder="Almaty" value={info.location_city} onChange={(e) => setInfo((p) => ({ ...p, location_city: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label-text block mb-2">Short Description *</label>
            <input required className="input-field" placeholder="Yield-bearing solar asset in…" value={info.short_description} onChange={(e) => setInfo((p) => ({ ...p, short_description: e.target.value }))} />
          </div>

          <div>
            <label className="label-text block mb-2">Full Description</label>
            <textarea rows={4} className="input-field resize-none" placeholder="Detailed description of the installation, legal setup, power purchase agreement…" value={info.full_description} onChange={(e) => setInfo((p) => ({ ...p, full_description: e.target.value }))} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? "Saving…" : <><span>Continue</span> <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      )}

      {step === "sale" && (
        <form onSubmit={handleSaleSubmit} className="glass-card p-7 space-y-5">
          <h2 className="font-bold text-slate-100 text-lg">Sale Terms</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-2">Valuation (USDC) *</label>
              <input required type="number" min="1" className="input-field" placeholder="100000" value={sale.valuation_usdc} onChange={(e) => setSale((p) => ({ ...p, valuation_usdc: e.target.value }))} />
            </div>
            <div>
              <label className="label-text block mb-2">Total Shares *</label>
              <input required type="number" min="1" className="input-field" placeholder="10000" value={sale.total_shares} onChange={(e) => setSale((p) => ({ ...p, total_shares: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-2">Price / Share (USDC) *</label>
              <input required type="number" min="0" step="0.01" className="input-field" placeholder="10.00" value={sale.price_per_share_usdc} onChange={(e) => setSale((p) => ({ ...p, price_per_share_usdc: e.target.value }))} />
            </div>
            <div>
              <label className="label-text block mb-2">Min. Buy (USDC) *</label>
              <input required type="number" min="0" step="0.01" className="input-field" placeholder="50.00" value={sale.minimum_buy_amount_usdc} onChange={(e) => setSale((p) => ({ ...p, minimum_buy_amount_usdc: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label-text block mb-2">Target Raise (USDC) *</label>
            <input required type="number" min="1" className="input-field" placeholder="50000" value={sale.target_raise_usdc} onChange={(e) => setSale((p) => ({ ...p, target_raise_usdc: e.target.value }))} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("info")} className="btn-secondary flex-1 justify-center">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? "Saving…" : <><span>Continue</span> <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      )}

      {step === "documents" && (
        <form onSubmit={handleDocSubmit} className="glass-card p-7 space-y-5">
          <h2 className="font-bold text-slate-100 text-lg">Upload Document</h2>
          <p className="text-sm text-slate-500">Add the first proof document. You can upload more from the asset management page.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-2">Document Type *</label>
              <select required className="input-field" value={doc.type} onChange={(e) => setDoc((p) => ({ ...p, type: e.target.value }))}>
                {["technical_passport", "ownership_doc", "right_to_income_doc", "financial_model", "photo", "meter_info", "revenue_report", "other"].map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text block mb-2">Storage Provider</label>
              <select className="input-field" value={doc.storage_provider} onChange={(e) => setDoc((p) => ({ ...p, storage_provider: e.target.value }))}>
                {["arweave", "ipfs", "s3"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-text block mb-2">Document Title *</label>
            <input required className="input-field" placeholder="Technical Passport 2024" value={doc.title} onChange={(e) => setDoc((p) => ({ ...p, title: e.target.value }))} />
          </div>

          <div>
            <label className="label-text block mb-2">Storage URI *</label>
            <input required className="input-field" placeholder="https://arweave.net/..." value={doc.storage_uri} onChange={(e) => setDoc((p) => ({ ...p, storage_uri: e.target.value }))} />
          </div>

          <div>
            <label className="label-text block mb-2">Content Hash</label>
            <input className="input-field font-mono text-xs" placeholder="sha256:..." value={doc.content_hash} onChange={(e) => setDoc((p) => ({ ...p, content_hash: e.target.value }))} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("sale")} className="btn-secondary flex-1 justify-center">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? "Uploading…" : <><span>Continue</span> <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

          <button type="button" onClick={() => setStep("done")} className="w-full text-center text-xs text-slate-600 hover:text-slate-400 mt-1">
            Skip document upload →
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="glass-card p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Asset Draft Created</h2>
            <p className="text-slate-500 text-sm">
              Your asset has been saved as a draft. Submit it for review to move through the approval pipeline.
            </p>
          </div>
          {assetId && <div className="rounded-xl bg-surface-100/50 border border-surface-200/40 px-4 py-3 text-xs font-mono text-emerald-400">Asset ID: {assetId}</div>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleFinalSubmit} disabled={loading} className="btn-primary px-8">
              {loading ? "Submitting…" : "Submit for Review"}
            </button>
            <Link href="/issuer" className="btn-secondary px-8">
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
