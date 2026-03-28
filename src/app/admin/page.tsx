"use client";

import { useEffect, useState } from "react";
import { assetsApi, adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { ENERGY_META, formatDate } from "@/lib/utils";
import type { AssetListItem, AuditLog } from "@/types";
import { ShieldCheck, CheckCircle2, Snowflake, XCircle, RefreshCw, ClipboardList, ArrowUpRight } from "lucide-react";
import Link from "next/link";

type ActivePanel = "assets" | "audit";

export default function AdminPage() {
  const { user, devSwitchRole } = useAuth();
  const [panel, setPanel]     = useState<ActivePanel>("assets");
  const [assets, setAssets]   = useState<AssetListItem[]>([]);
  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction]   = useState<string | null>(null);
  const [msg, setMsg]         = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    setLoading(true);
    Promise.allSettled([
      assetsApi.list({ limit: 50 }),
      adminApi.auditLogs({ limit: 20 }),
    ]).then(([a, l]) => {
      setAssets(a.status === "fulfilled" ? a.value.items : MOCK_ASSETS);
      setLogs(l.status === "fulfilled" ? l.value.items : MOCK_LOGS);
    }).finally(() => setLoading(false));
  }, [user]);

  async function doAction(
    assetId: string,
    type: "verify" | "freeze" | "close",
    label: string
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
      setAssets(prev => prev.map(a =>
        a.id === assetId ? { ...a, status: res.resulting_status as AssetListItem["status"] } : a
      ));
    } catch {
      setMsg(`Demo: ${label} action simulated on ${assetId}.`);
      setAssets(prev => prev.map(a =>
        a.id === assetId ? { ...a, status: type === "verify" ? "verified" : type === "freeze" ? "frozen" : "closed" } : a
      ));
    } finally {
      setAction(null);
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 border border-surface-200/60 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">Admin Panel</h1>
        <p className="text-slate-500 text-sm mb-8">Sign in as admin to manage the platform.</p>
        <button onClick={() => devSwitchRole("admin")} className="btn-primary px-8">
          Demo Login as Admin
        </button>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center text-slate-500">
        Access restricted to admins.{" "}
        <button onClick={() => devSwitchRole("admin")} className="text-amber-400 underline">Switch role</button>
      </div>
    );
  }

  const pending = assets.filter(a => a.status === "pending_review");
  const active  = assets.filter(a => a.status === "active_sale");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="label-text">Platform Management</p>
          <h1 className="text-2xl font-extrabold text-slate-100">Admin Panel</h1>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Assets",    val: assets.length,           color: "text-slate-200" },
          { label: "Pending Review",  val: pending.length,          color: "text-amber-400" },
          { label: "Active Sale",     val: active.length,           color: "text-emerald-400" },
          { label: "Audit Events",    val: logs.length,             color: "text-sky-400" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "assets" as const, label: "Assets", icon: <CheckCircle2 className="w-4 h-4" /> },
          { key: "audit"  as const, label: "Audit Logs", icon: <ClipboardList className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setPanel(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              panel === t.key
                ? "bg-emerald-600/20 border border-emerald-700/60 text-emerald-400"
                : "text-slate-500 hover:text-slate-300 border border-transparent"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {msg && (
        <div className="rounded-xl bg-amber-950/30 border border-amber-900/50 px-5 py-3 text-sm text-amber-300">
          {msg}
        </div>
      )}

      {/* ── Assets panel ── */}
      {panel === "assets" && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-card h-20 animate-pulse" />)
          ) : (
            assets.map(a => {
              const energy = ENERGY_META[a.energy_type];
              return (
                <div key={a.id} className="glass-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">{energy.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 text-sm truncate">{a.title}</p>
                        <p className="text-xs text-slate-500">{a.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusBadge status={a.status} />

                      <Link href={`/assets/${a.id}`} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300">
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>

                      {a.status === "pending_review" && (
                        <button
                          onClick={() => doAction(a.id, "verify", "Verify")}
                          disabled={action === `verify-${a.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/40 border border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/60 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {action === `verify-${a.id}` ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Verify
                        </button>
                      )}

                      {!["frozen","closed","draft"].includes(a.status) && (
                        <button
                          onClick={() => doAction(a.id, "freeze", "Freeze")}
                          disabled={action === `freeze-${a.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-900/40 border border-sky-800/60 text-sky-400 hover:bg-sky-900/60 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {action === `freeze-${a.id}` ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Snowflake className="w-3 h-3" />}
                          Freeze
                        </button>
                      )}

                      {!["closed"].includes(a.status) && (
                        <button
                          onClick={() => doAction(a.id, "close", "Close")}
                          disabled={action === `close-${a.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 border border-red-800/60 text-red-400 hover:bg-red-900/60 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {action === `close-${a.id}` ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
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

      {/* ── Audit logs panel ── */}
      {panel === "audit" && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200/40">
                {["Timestamp", "Actor", "Entity", "Action"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 label-text">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-200/20">
                    {[1,2,3,4].map(j => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-surface-200/30 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-600">No audit events.</td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-b border-surface-200/20 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 text-slate-500 text-xs font-mono whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">
                    {log.actor_user_id.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-slate-500 capitalize">{log.entity_type}</span>
                    <span className="text-xs text-slate-600"> · {log.entity_id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-1 rounded-md bg-surface-100/60 border border-surface-200/40 text-xs font-mono text-emerald-400">
                      {log.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ASSETS: AssetListItem[] = [
  { id: "asset-1", title: "Almaty Solar Farm A",    energy_type: "solar", capacity_kw: 150, status: "active_sale",    price_per_share_usdc: 10, expected_annual_yield_percent: 13.2 },
  { id: "asset-2", title: "Nur-Sultan Rooftop B",   energy_type: "solar", capacity_kw: 80,  status: "pending_review", price_per_share_usdc: 5,  expected_annual_yield_percent: 11.8 },
  { id: "asset-7", title: "Taraz Solar Micro-Grid", energy_type: "solar", capacity_kw: 60,  status: "draft",          price_per_share_usdc: 8,  expected_annual_yield_percent: 12.8 },
  { id: "asset-8", title: "Semey Wind Cluster",     energy_type: "wind",  capacity_kw: 450, status: "pending_review", price_per_share_usdc: 30, expected_annual_yield_percent: 15.0 },
  { id: "asset-5", title: "Karaganda Solar Fields", energy_type: "solar", capacity_kw: 200, status: "funded",         price_per_share_usdc: 10, expected_annual_yield_percent: 12.1 },
];

const MOCK_LOGS: AuditLog[] = [
  { id: "a1", actor_user_id: "admin-uuid-001", entity_type: "asset", entity_id: "asset-1", action: "asset.verified",    created_at: "2026-03-26T10:00:00.000Z" },
  { id: "a2", actor_user_id: "admin-uuid-001", entity_type: "asset", entity_id: "asset-5", action: "asset.funded",      created_at: "2026-03-25T14:30:00.000Z" },
  { id: "a3", actor_user_id: "admin-uuid-001", entity_type: "asset", entity_id: "asset-2", action: "asset.review_open", created_at: "2026-03-24T09:00:00.000Z" },
  { id: "a4", actor_user_id: "issuer-uuid-001",entity_type: "asset", entity_id: "asset-8", action: "asset.submitted",   created_at: "2026-03-23T16:45:00.000Z" },
  { id: "a5", actor_user_id: "investor-001",   entity_type: "claim", entity_id: "claim-c1", action: "claim.confirmed",  created_at: "2026-03-22T11:20:00.000Z" },
];
