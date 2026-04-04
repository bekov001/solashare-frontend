"use client";

import { ArrowLeft, ExternalLink, FileText, Plus, RefreshCw, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FileDropInput } from "@/components/FileDropInput";
import { StatusBadge } from "@/components/StatusBadge";
import { assetsApi, issuerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { uploadAssetDocument } from "@/lib/uploads";
import { ENERGY_META, formatNumber, formatUSDC } from "@/lib/utils";
import type { IssuerAssetDetail, RevenueEpoch } from "@/types";

export default function ManageAssetPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [asset, setAsset] = useState<IssuerAssetDetail | null>(null);
  const [revenue, setRevenue] = useState<RevenueEpoch[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showEpoch, setShowEpoch] = useState(false);
  const [epoch, setEpoch] = useState({
    epoch_number: "1",
    period_start: "",
    period_end: "",
    gross_revenue_usdc: "",
    net_revenue_usdc: "",
    distributable_revenue_usdc: "",
    source_type: "operator_statement",
  });
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [savingEpoch, setSavingEpoch] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    setError("");
    setLoading(true);

    Promise.all([issuerApi.getAsset(id), assetsApi.revenue(id).catch(() => ({ items: [] }))])
      .then(([assetRes, revenueRes]) => {
        setAsset(assetRes);
        setRevenue(revenueRes.items);
      })
      .catch((err) => {
        setAsset(null);
        setError(err instanceof Error ? err.message : "Failed to load asset.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    if (!asset) {
      return;
    }

    setSubmitting(true);
    setMsg("");

    try {
      const res = await issuerApi.submit(asset.id);
      setMsg(`Asset submitted → ${res.next_status}`);
      const refreshed = await issuerApi.getAsset(asset.id);
      setAsset(refreshed);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to submit asset.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateEpoch(event: React.FormEvent) {
    event.preventDefault();

    if (!asset) {
      return;
    }

    setSavingEpoch(true);

    try {
      if (!reportFile) {
        throw new Error("Attach a revenue report file before creating the epoch.");
      }

      const uploadedReport = await uploadAssetDocument(reportFile);
      const res = await issuerApi.createRevenueEpoch(asset.id, {
        epoch_number: Number(epoch.epoch_number),
        period_start: epoch.period_start,
        period_end: epoch.period_end,
        gross_revenue_usdc: Number(epoch.gross_revenue_usdc),
        net_revenue_usdc: Number(epoch.net_revenue_usdc),
        distributable_revenue_usdc: Number(epoch.distributable_revenue_usdc),
        report_uri: uploadedReport.file_url,
        report_hash: uploadedReport.content_hash,
        source_type: epoch.source_type,
      });

      setMsg(`Revenue epoch ${res.revenue_epoch_id} created.`);
      setShowEpoch(false);
      setReportFile(null);
      setEpoch({
        epoch_number: String(Number(epoch.epoch_number) + 1),
        period_start: "",
        period_end: "",
        gross_revenue_usdc: "",
        net_revenue_usdc: "",
        distributable_revenue_usdc: "",
        source_type: "operator_statement",
      });
      const revenueRes = await assetsApi.revenue(asset.id).catch(() => ({ items: [] }));
      setRevenue(revenueRes.items);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to create revenue epoch.");
    } finally {
      setSavingEpoch(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center animate-fade-in">
        <p className="text-slate-500 mb-6">Sign in as an issuer to manage assets.</p>
        <Link href="/login" className="btn-sol px-8">
          Go to Login
        </Link>
      </div>
    );
  }

  if (user.role !== "issuer") {
    return (
      <div
        className="max-w-xl mx-auto px-6 py-24 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        Access restricted to issuers.
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-5 animate-pulse">
        <div className="card h-32" />
        <div className="card h-48" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <EmptyState title="Asset unavailable" description={error || "Asset not found."} />
      </div>
    );
  }

  const energy = ENERGY_META[asset.energy_type];
  const canSubmit = asset.status === "draft" || asset.status === "verified";
  const isSaleLive = asset.status === "active_sale" && asset.sale_terms?.sale_status === "live";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-7">
      <Link
        href="/issuer"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: "var(--surface-low)" }}
            >
              {energy.emoji}
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>
                {asset.title}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {asset.location.city ?? "Location pending"}, {asset.location.country}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={asset.status} />
            <Link href={`/assets/${asset.id}`} className="btn-outline text-sm px-5">
              <ExternalLink className="w-4 h-4" /> Public Page
            </Link>
            {canSubmit && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-sol text-sm px-5"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {msg && (
        <div
          className="rounded-2xl px-5 py-3 text-sm font-medium text-[#9945FF]"
          style={{ background: "#9945FF10" }}
        >
          {msg}
        </div>
      )}

      {asset.review_feedback && (
        <div className="card p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label-xs mb-2">Review Feedback</p>
              <h2 className="text-xl font-black" style={{ color: "var(--text)" }}>
                Admin requested changes
              </h2>
            </div>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              {new Date(asset.review_feedback.created_at).toLocaleDateString()}
            </span>
          </div>

          {asset.review_feedback.reason && (
            <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              {asset.review_feedback.reason}
            </p>
          )}

          {asset.review_feedback.issues.length > 0 && (
            <div className="space-y-3">
              {asset.review_feedback.issues.map((issue) => (
                <div
                  key={`${issue.field}-${issue.note}`}
                  className="rounded-[1.25rem] border p-4"
                  style={{
                    borderColor: "rgba(245, 158, 11, 0.2)",
                    background: "rgba(245, 158, 11, 0.06)",
                  }}
                >
                  <p className="text-sm font-bold text-amber-300">{issue.label ?? issue.field}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{issue.note}</p>
                  {(issue.actual_value || issue.expected_value) && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-slate-400">
                      <div>Submitted: {issue.actual_value ?? "n/a"}</div>
                      <div>Expected: {issue.expected_value ?? "n/a"}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="label-xs">Investor CTA</p>
            <h2 className="text-xl font-black" style={{ color: "var(--text)" }}>
              {isSaleLive ? "Buying is live" : "Buying is hidden"}
            </h2>
            <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              The buy button is shown on the public asset page only when the asset status is
              <span className="font-semibold text-[var(--text)]"> active_sale </span>
              and sale status is
              <span className="font-semibold text-[var(--text)]"> live</span>.
            </p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              Current asset status: {asset.status}. Current sale status:{" "}
              {asset.sale_terms?.sale_status ?? "not configured"}.
            </p>
          </div>

          <Link href={`/assets/${asset.id}`} className="btn-outline text-sm">
            <ExternalLink className="w-4 h-4" /> Open public asset page
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Energy Type", val: energy.label },
          { label: "Capacity", val: `${formatNumber(asset.capacity_kw)} kW` },
          {
            label: "Expected APY",
            val:
              asset.expected_annual_yield_percent === null
                ? "TBD"
                : `${asset.expected_annual_yield_percent}%`,
          },
          { label: "Revenue Epochs", val: String(revenue.length) },
        ].map((item) => (
          <div key={item.label} className="card p-4 text-center">
            <p className="text-lg font-black" style={{ color: "var(--text)" }}>
              {item.val}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-black mb-4" style={{ color: "var(--text)" }}>
          Sale Terms
        </h2>

        {asset.sale_terms ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            {[
              { label: "Valuation", val: formatUSDC(parseFloat(asset.sale_terms.valuation_usdc)) },
              { label: "Total Shares", val: formatNumber(asset.sale_terms.total_shares) },
              {
                label: "Price / Share",
                val: formatUSDC(parseFloat(asset.sale_terms.price_per_share_usdc)),
              },
              {
                label: "Min. Buy",
                val: formatUSDC(parseFloat(asset.sale_terms.minimum_buy_amount_usdc)),
              },
              {
                label: "Target Raise",
                val: formatUSDC(parseFloat(asset.sale_terms.target_raise_usdc)),
              },
              { label: "Sale Status", val: asset.sale_terms.sale_status },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between border-b pb-2"
                style={{ borderColor: "var(--border)" }}
              >
                <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                <span className="font-medium" style={{ color: "var(--text)" }}>
                  {row.val}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Sale terms have not been saved yet.
          </p>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black" style={{ color: "var(--text)" }}>
            Revenue Epochs
          </h2>
          <button
            type="button"
            onClick={() => setShowEpoch(!showEpoch)}
            className="btn-outline text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> New Epoch
          </button>
        </div>

        {showEpoch && (
          <form
            onSubmit={handleCreateEpoch}
            className="mb-6 p-5 rounded-2xl space-y-4"
            style={{ background: "var(--surface-low)" }}
          >
            <h3 className="font-semibold text-sm text-emerald-500">New Revenue Epoch</h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Revenue reports are stored as files in S3. Manual report links and hashes are no
              longer required here.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="epoch-number" className="label-xs block mb-1.5">
                  Epoch #
                </label>
                <input
                  id="epoch-number"
                  required
                  type="number"
                  min="1"
                  className="input-new text-sm py-2"
                  value={epoch.epoch_number}
                  onChange={(event) =>
                    setEpoch((current) => ({ ...current, epoch_number: event.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="epoch-source-type" className="label-xs block mb-1.5">
                  Source Type
                </label>
                <select
                  id="epoch-source-type"
                  className="input-new text-sm py-2"
                  value={epoch.source_type}
                  onChange={(event) =>
                    setEpoch((current) => ({ ...current, source_type: event.target.value }))
                  }
                >
                  {["manual_report", "meter_export", "operator_statement"].map((source) => (
                    <option key={source} value={source}>
                      {source.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="epoch-period-start" className="label-xs block mb-1.5">
                  Period Start
                </label>
                <input
                  id="epoch-period-start"
                  required
                  type="date"
                  className="input-new text-sm py-2"
                  value={epoch.period_start}
                  onChange={(event) =>
                    setEpoch((current) => ({ ...current, period_start: event.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="epoch-period-end" className="label-xs block mb-1.5">
                  Period End
                </label>
                <input
                  id="epoch-period-end"
                  required
                  type="date"
                  className="input-new text-sm py-2"
                  value={epoch.period_end}
                  onChange={(event) =>
                    setEpoch((current) => ({ ...current, period_end: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {["gross_revenue_usdc", "net_revenue_usdc", "distributable_revenue_usdc"].map(
                (field) => (
                  <div key={field}>
                    <label htmlFor={field} className="label-xs block mb-1.5">
                      {field.replace(/_usdc|_/g, (value) => (value === "_usdc" ? "" : " ")).trim()}
                    </label>
                    <input
                      id={field}
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-new text-sm py-2"
                      placeholder="0.00"
                      value={(epoch as Record<string, string>)[field]}
                      onChange={(event) =>
                        setEpoch((current) => ({ ...current, [field]: event.target.value }))
                      }
                    />
                  </div>
                ),
              )}
            </div>

            <div>
              <label className="label-xs mb-2 block">Revenue Report File</label>
              <FileDropInput
                accept=".pdf,.xlsx,.xls,.csv,image/png,image/jpeg,image/jpg"
                buttonLabel="Attach report"
                title="Drop the revenue report here"
                selectedLabel={reportFile?.name ?? null}
                description="PDF, spreadsheet, CSV or image. The file is uploaded to S3 and bound to this revenue epoch automatically."
                onFilesSelected={(files) => setReportFile(files[0] ?? null)}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowEpoch(false)}
                className="btn-outline text-sm"
              >
                Cancel
              </button>
              <button type="submit" disabled={savingEpoch} className="btn-sol text-sm px-5">
                {savingEpoch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Create Epoch"}
              </button>
            </div>
          </form>
        )}

        {revenue.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No revenue epochs posted yet.
          </p>
        ) : (
          <div className="space-y-3">
            {revenue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border p-4"
                style={{ borderColor: "var(--border)" }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    Epoch #{item.epoch_number}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.period_start} – {item.period_end}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-amber-400">
                    {formatUSDC(item.distributable_revenue_usdc)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.posting_status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-black mb-4" style={{ color: "var(--text)" }}>
          Documents
        </h2>

        {asset.documents.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No documents uploaded.
          </p>
        ) : (
          <div className="space-y-2">
            {asset.documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between rounded-2xl border p-3"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-sm" style={{ color: "var(--text)" }}>
                      {document.title}
                    </p>
                    <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                      {document.type.replace(/_/g, " ")} · {document.storage_provider} ·{" "}
                      {document.is_public ? "public" : "private"}
                    </p>
                  </div>
                </div>
                <a
                  href={document.storage_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-white/5"
                  style={{ color: "var(--text-muted)" }}
                >
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
