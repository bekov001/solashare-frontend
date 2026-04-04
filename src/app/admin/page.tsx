"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { assetsApi, adminApi } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { ENERGY_META, formatDate } from "@/lib/utils";
import type {
  AssetListItem,
  AuditLog,
  KycRequestItem,
  VerificationOutcome,
} from "@/types";
import {
  ShieldCheck,
  CheckCircle2,
  Snowflake,
  XCircle,
  RefreshCw,
  ClipboardList,
  ArrowUpRight,
  BadgeCheck,
} from "lucide-react";

type ActivePanel = "assets" | "kyc" | "audit";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [panel, setPanel] = useState<ActivePanel>("assets");
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [kycRequests, setKycRequests] = useState<KycRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    Promise.all([
      assetsApi.list({ limit: 50 }),
      adminApi.auditLogs({ limit: 20 }),
      adminApi.kycRequests({ limit: 20 }),
    ])
      .then(([assetsRes, logsRes, kycRes]) => {
        setAssets(assetsRes.items);
        setLogs(logsRes.items);
        setKycRequests(kycRes.items);
      })
      .catch((err) => {
        setAssets([]);
        setLogs([]);
        setKycRequests([]);
        setError(
          err instanceof Error ? err.message : "Failed to load admin data.",
        );
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function doAction(
    assetId: string,
    type: "verify" | "freeze" | "close",
    label: string,
  ) {
    setAction(`${type}-${assetId}`);
    setMsg("");

    try {
      let res: { resulting_status: string };

      if (type === "verify") {
        res = await adminApi.verify(assetId, "approved", "Admin approval");
      } else if (type === "freeze") {
        res = await adminApi.freeze(assetId);
      } else {
        res = await adminApi.close(assetId);
      }

      setMsg(`Asset ${assetId} → ${res.resulting_status}`);
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? { ...a, status: res.resulting_status as AssetListItem["status"] }
            : a,
        ),
      );
    } catch (err) {
      setMsg(
        err instanceof Error ? err.message : `${label} failed for ${assetId}.`,
      );
    } finally {
      setAction(null);
    }
  }

  async function reviewKyc(
    request: KycRequestItem,
    outcome: VerificationOutcome,
  ) {
    setAction(`kyc-${request.verification_request_id}-${outcome}`);
    setMsg("");

    try {
      const res = await adminApi.reviewKyc(
        request.user_id,
        outcome,
        outcome === "approved"
          ? "KYC approved by admin"
          : "KYC requires follow-up",
      );
      setMsg(`KYC for ${request.display_name} → ${res.kyc_status}`);
      setKycRequests((prev) =>
        prev.filter(
          (item) =>
            item.verification_request_id !== request.verification_request_id,
        ),
      );
    } catch (err) {
      setMsg(
        err instanceof Error
          ? err.message
          : `Failed to review KYC for ${request.display_name}.`,
      );
    } finally {
      setAction(null);
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center animate-fade-in">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "#9945FF20" }}
        >
          <ShieldCheck className="w-8 h-8 text-[#9945FF]" />
        </div>
        <h1
          className="text-3xl font-black mb-3"
          style={{ color: "var(--text)" }}
        >
          Admin Panel
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          Sign in as admin to manage the platform.
        </p>
        <Link href="/login" className="btn-sol px-8">
          Go to Login
        </Link>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div
        className="max-w-xl mx-auto px-6 py-24 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        Access restricted to admins.
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-10 animate-pulse">
        <div className="card h-24" />
      </div>
    );
  }

  const pending = assets.filter((a) => a.status === "pending_review");
  const active = assets.filter((a) => a.status === "active_sale");

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-10 animate-fade-in space-y-8">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "#9945FF15" }}
        >
          <ShieldCheck className="w-5 h-5 text-[#9945FF]" />
        </div>
        <div>
          <p className="label-xs">Platform Management</p>
          <h1 className="text-3xl font-black" style={{ color: "var(--text)" }}>
            Admin Panel
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Assets",
            val: assets.length,
            color: "text-[var(--text)]",
          },
          {
            label: "Pending Review",
            val: pending.length,
            color: "text-[#9945FF]",
          },
          { label: "Active Sale", val: active.length, color: "text-[#14F195]" },
          { label: "Audit Events", val: logs.length, color: "text-[#00693e]" },
        ].map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
            <p className="label-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {[
          {
            key: "assets" as const,
            label: "Assets",
            icon: <CheckCircle2 className="w-4 h-4" />,
          },
          {
            key: "kyc" as const,
            label: "KYC",
            icon: <BadgeCheck className="w-4 h-4" />,
          },
          {
            key: "audit" as const,
            label: "Audit Logs",
            icon: <ClipboardList className="w-4 h-4" />,
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setPanel(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
              panel === t.key
                ? "bg-[#9945FF]/10 border-[#9945FF]/20 text-[#9945FF]"
                : "border-[var(--border)]"
            }`}
            style={panel === t.key ? {} : { color: "var(--text-muted)" }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div
          className="rounded-2xl px-5 py-3 text-sm font-medium text-[#9945FF]"
          style={{ background: "#9945FF10" }}
        >
          {msg}
        </div>
      )}

      {panel === "assets" && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-20 animate-pulse" />
            ))
          ) : error ? (
            <div className="card">
              <EmptyState title="Admin data unavailable" description={error} />
            </div>
          ) : (
            assets.map((a) => {
              const energy = ENERGY_META[a.energy_type];

              return (
                <div key={a.id} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{energy.emoji}</span>
                      <div className="min-w-0">
                        <p
                          className="font-black text-sm truncate"
                          style={{ color: "var(--text)" }}
                        >
                          {a.title}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-faint)" }}
                        >
                          {a.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusBadge status={a.status} />

                      <Link
                        href={`/assets/${a.id}`}
                        className="p-1.5 rounded-xl transition-colors hover:bg-[#9945FF]/5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>

                      {a.status === "pending_review" && (
                        <button
                          onClick={() => doAction(a.id, "verify", "Verify")}
                          disabled={action === `verify-${a.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 text-[#14F195] hover:bg-[#14F195]/10"
                          style={{ background: "#14F19510" }}
                        >
                          {action === `verify-${a.id}` ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Verify
                        </button>
                      )}

                      {!["frozen", "closed", "draft"].includes(a.status) && (
                        <button
                          onClick={() => doAction(a.id, "freeze", "Freeze")}
                          disabled={action === `freeze-${a.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 text-sky-500 hover:bg-sky-500/10"
                          style={{ background: "rgba(14,165,233,0.1)" }}
                        >
                          {action === `freeze-${a.id}` ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Snowflake className="w-3 h-3" />
                          )}
                          Freeze
                        </button>
                      )}

                      {!["closed"].includes(a.status) && (
                        <button
                          onClick={() => doAction(a.id, "close", "Close")}
                          disabled={action === `close-${a.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 text-red-400 hover:bg-red-400/10"
                          style={{ background: "rgba(248,113,113,0.1)" }}
                        >
                          {action === `close-${a.id}` ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {panel === "kyc" && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-24 animate-pulse" />
            ))
          ) : error ? (
            <div className="card">
              <EmptyState title="KYC queue unavailable" description={error} />
            </div>
          ) : kycRequests.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No pending KYC requests"
                description="Investor KYC submissions will appear here."
              />
            </div>
          ) : (
            kycRequests.map((request) => (
              <div key={request.verification_request_id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div>
                      <p
                        className="font-black text-sm"
                        style={{ color: "var(--text)" }}
                      >
                        {request.display_name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {request.email ?? request.user_id}
                      </p>
                    </div>
                    <div
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {request.document_type === "passport"
                        ? "Passport"
                        : "National ID"}{" "}
                      · {request.document_name}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Submitted {formatDate(request.created_at)}
                    </div>
                    <a
                      href={request.document_uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#9945FF] hover:underline"
                    >
                      Open KYC document
                    </a>
                    <p
                      className="text-xs font-mono"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {request.document_hash}
                    </p>
                    {request.notes && (
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {request.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => reviewKyc(request, "approved")}
                      disabled={
                        action ===
                        `kyc-${request.verification_request_id}-approved`
                      }
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#14F195]"
                      style={{ background: "#14F19510" }}
                    >
                      {action ===
                      `kyc-${request.verification_request_id}-approved` ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => reviewKyc(request, "needs_changes")}
                      disabled={
                        action ===
                        `kyc-${request.verification_request_id}-needs_changes`
                      }
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#9945FF]"
                      style={{ background: "#9945FF10" }}
                    >
                      {action ===
                      `kyc-${request.verification_request_id}-needs_changes` ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <BadgeCheck className="w-3 h-3" />
                      )}
                      Needs changes
                    </button>
                    <button
                      onClick={() => reviewKyc(request, "rejected")}
                      disabled={
                        action ===
                        `kyc-${request.verification_request_id}-rejected`
                      }
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400"
                      style={{ background: "rgba(248,113,113,0.1)" }}
                    >
                      {action ===
                      `kyc-${request.verification_request_id}-rejected` ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {panel === "audit" && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {["Timestamp", "Actor", "Entity", "Action"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 label-xs">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {[1, 2, 3, 4].map((j) => (
                      <td key={j} className="px-5 py-4">
                        <div
                          className="h-3 rounded-xl animate-pulse w-20"
                          style={{ background: "var(--surface-low)" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center"
                    style={{ color: "var(--text-faint)" }}
                  >
                    No audit events.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b transition-colors hover:bg-[#9945FF]/5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td
                      className="px-5 py-3.5 text-xs font-mono whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDate(log.created_at)}
                    </td>
                    <td
                      className="px-5 py-3.5 text-xs font-mono"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {log.actor_user_id
                        ? `${log.actor_user_id.slice(0, 8)}…`
                        : "system"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs capitalize"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {log.entity_type}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-faint)" }}
                      >
                        {" "}
                        · {log.entity_id.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2 py-1 rounded-lg text-xs font-mono text-[#9945FF]"
                        style={{ background: "#9945FF10" }}
                      >
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
