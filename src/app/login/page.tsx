"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";
import type { UserRole } from "@/types";
import { Wallet, User, BarChart2, ShieldCheck } from "lucide-react";

const DEMO_ROLES: { role: UserRole; label: string; desc: string; icon: React.ReactNode; accent: string }[] = [
  {
    role: "investor",
    label: "Demo Investor",
    desc: "Browse assets, invest, claim yield, view portfolio.",
    icon: <User className="w-5 h-5" />,
    accent: "#14F195",
  },
  {
    role: "issuer",
    label: "Demo Issuer",
    desc: "Create assets, post revenue, manage documents.",
    icon: <BarChart2 className="w-5 h-5" />,
    accent: "#9945FF",
  },
  {
    role: "admin",
    label: "Demo Admin",
    desc: "Verify assets, freeze, close, review audit logs.",
    icon: <ShieldCheck className="w-5 h-5" />,
    accent: "#00693e",
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
    } catch {
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
          <div className="w-16 h-16 rounded-3xl sol-gradient flex items-center justify-center mx-auto mb-5 sol-glow">
            <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>solar_power</span>
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--text)" }}>
            Sign in to <span className="sol-text">SolaShare</span>
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Solar RWA platform on Solana</p>
        </div>

        {/* Telegram auth */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-[#9945FF]" />
            <h2 className="font-bold text-sm" style={{ color: "var(--text)" }}>Telegram WebApp Auth</h2>
          </div>
          <form onSubmit={handleTelegramLogin} className="space-y-4">
            <div>
              <label className="label-xs block mb-2">Telegram Init Data</label>
              <textarea
                rows={3}
                className="input-new resize-none text-xs font-mono"
                placeholder="Paste your Telegram WebApp initData here…"
                value={telegramData}
                onChange={e => setTelegramData(e.target.value)}
              />
            </div>
            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
            <button
              type="submit"
              disabled={!telegramData || telegramLoading}
              className="btn-sol w-full text-sm"
            >
              {telegramLoading ? "Verifying…" : "Sign in with Telegram"}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>or use demo access</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Demo logins */}
        <div className="space-y-3">
          {DEMO_ROLES.map(r => (
            <button
              key={r.role}
              onClick={() => handleDemoLogin(r.role)}
              disabled={loading !== null}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left disabled:opacity-60 hover:shadow-md"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
                   style={{ background: r.accent }}>
                {loading === r.role ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : r.icon}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{r.label}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
          Demo mode uses mock data. No real transactions are executed.
        </p>
      </div>
    </div>
  );
}
