"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";
import type { UserRole } from "@/types";
import { Sun, Wallet, User, BarChart2, ShieldCheck } from "lucide-react";

const DEMO_ROLES: { role: UserRole; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    role: "investor",
    label: "Demo Investor",
    desc: "Browse assets, invest, claim yield, view portfolio.",
    icon: <User className="w-5 h-5" />,
    color: "border-emerald-800/60 hover:border-emerald-600/60 text-emerald-400",
  },
  {
    role: "issuer",
    label: "Demo Issuer",
    desc: "Create assets, post revenue, manage documents.",
    icon: <BarChart2 className="w-5 h-5" />,
    color: "border-sky-800/60 hover:border-sky-600/60 text-sky-400",
  },
  {
    role: "admin",
    label: "Demo Admin",
    desc: "Verify assets, freeze, close, review audit logs.",
    icon: <ShieldCheck className="w-5 h-5" />,
    color: "border-amber-800/60 hover:border-amber-600/60 text-amber-400",
  },
];

export default function LoginPage() {
  const { login, devSwitchRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [telegramData, setTelegramData] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTelegramLogin(e: React.FormEvent) {
    e.preventDefault();
    setTelegramLoading(true);
    setError("");
    try {
      const res = await authApi.telegram(telegramData);
      login(res.access_token, res.user);
      router.push("/");
    } catch (err) {
      setError("Invalid Telegram init data. Use demo login below for testing.");
    } finally {
      setTelegramLoading(false);
    }
  }

  function handleDemoLogin(role: UserRole) {
    setLoading(role);
    devSwitchRole(role);
    setTimeout(() => {
      setLoading(null);
      router.push(role === "issuer" ? "/issuer" : role === "admin" ? "/admin" : "/portfolio");
    }, 600);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 animate-fade-in">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center mx-auto mb-4">
            <Sun className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">
            Sign in to <span className="text-emerald-400">SolaShare</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">Solar RWA platform on Solana</p>
        </div>

        {/* Telegram auth */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-sky-400" />
            <h2 className="font-semibold text-slate-200 text-sm">Telegram WebApp Auth</h2>
          </div>
          <form onSubmit={handleTelegramLogin} className="space-y-4">
            <div>
              <label className="label-text block mb-2">Telegram Init Data</label>
              <textarea
                rows={3}
                className="input-field resize-none text-xs font-mono"
                placeholder="Paste your Telegram WebApp initData here…"
                value={telegramData}
                onChange={e => setTelegramData(e.target.value)}
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={!telegramData || telegramLoading}
              className="btn-primary w-full justify-center text-sm"
            >
              {telegramLoading ? "Verifying…" : "Sign in with Telegram"}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-surface-200/40" />
          <span className="text-xs text-slate-600">or use demo access</span>
          <div className="flex-1 h-px bg-surface-200/40" />
        </div>

        {/* Demo logins */}
        <div className="space-y-3">
          {DEMO_ROLES.map(r => (
            <button
              key={r.role}
              onClick={() => handleDemoLogin(r.role)}
              disabled={loading !== null}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border bg-surface-100/40 hover:bg-surface-100/70 transition-all text-left disabled:opacity-60 ${r.color}`}
            >
              <div className="w-10 h-10 rounded-xl bg-surface-200/40 flex items-center justify-center flex-shrink-0">
                {loading === r.role ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : r.icon}
              </div>
              <div>
                <p className="font-semibold text-sm">{r.label}</p>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600">
          Demo mode uses mock data. No real transactions are executed.
        </p>
      </div>
    </div>
  );
}
