"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { Mail, Wallet } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [telegramData, setTelegramData] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState("");

  function getRedirectPath(role: string) {
    if (role === "issuer") return "/issuer";
    if (role === "admin") return "/admin";
    return "/portfolio";
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setError("");

    try {
      const res =
        mode === "login"
          ? await authApi.login(email, password)
          : await authApi.register(email, password, displayName);

      login(res);
      router.push(getRedirectPath(res.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleTelegramLogin(e: React.FormEvent) {
    e.preventDefault();
    setTelegramLoading(true);
    setError("");

    try {
      const res = await authApi.telegram(telegramData);
      login(res);
      router.push(getRedirectPath(res.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid Telegram init data.");
    } finally {
      setTelegramLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 animate-fade-in">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl sol-gradient flex items-center justify-center mx-auto mb-5 sol-glow">
            <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              solar_power
            </span>
          </div>
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--text)" }}>
            Sign in to <span className="sol-text">SolaShare</span>
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Solar RWA platform on Solana
          </p>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#14F195]" />
              <h2 className="font-bold text-sm" style={{ color: "var(--text)" }}>
                Email Auth
              </h2>
            </div>
            <div className="flex rounded-full p-1" style={{ background: "var(--surface-low)" }}>
              {(["login", "register"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition-colors ${
                    mode === value ? "bg-[#9945FF] text-white" : ""
                  }`}
                  style={mode === value ? {} : { color: "var(--text-muted)" }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="label-xs block mb-2">Display Name</label>
                <input
                  className="input-new"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="label-xs block mb-2">Email</label>
              <input
                className="input-new"
                placeholder="name@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-xs block mb-2">Password</label>
              <input
                className="input-new"
                placeholder={mode === "login" ? "Your password" : "Minimum 8 characters"}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
            <button type="submit" disabled={emailLoading} className="btn-sol w-full text-sm">
              {emailLoading ? "Processing…" : mode === "login" ? "Sign in with Email" : "Create Account"}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-[#9945FF]" />
            <h2 className="font-bold text-sm" style={{ color: "var(--text)" }}>
              Telegram WebApp Auth
            </h2>
          </div>
          <form onSubmit={handleTelegramLogin} className="space-y-4">
            <div>
              <label className="label-xs block mb-2">Telegram Init Data</label>
              <textarea
                rows={3}
                className="input-new resize-none text-xs font-mono"
                placeholder="Paste your Telegram WebApp initData here…"
                value={telegramData}
                onChange={(e) => setTelegramData(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={!telegramData || telegramLoading}
              className="btn-sol w-full text-sm"
            >
              {telegramLoading ? "Verifying…" : "Sign in with Telegram"}
            </button>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>
            real backend session
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <p className="text-center text-xs" style={{ color: "var(--text-faint)" }}>
          Use email/password or Telegram Mini App payload from the real backend environment.
        </p>
      </div>
    </div>
  );
}
