"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { assetsApi } from "@/lib/api";
import { AssetCard, AssetCardSkeleton } from "@/components/AssetCard";
import { formatUSDC } from "@/lib/utils";
import type { AssetListItem } from "@/types";
import { Sun, TrendingUp, Shield, Zap, ArrowRight, Globe, Users, BarChart2 } from "lucide-react";

// ─── Hero stats ───────────────────────────────────────────────────────────────
const PLATFORM_STATS = [
  { icon: <BarChart2 className="w-5 h-5 text-emerald-400" />, value: "$2.4M", label: "Total Assets" },
  { icon: <Users className="w-5 h-5 text-emerald-400" />,    value: "1,240+", label: "Investors" },
  { icon: <TrendingUp className="w-5 h-5 text-amber-400" />, value: "12.4%",  label: "Avg. APY" },
  { icon: <Globe className="w-5 h-5 text-sky-400" />,        value: "8",       label: "Countries" },
];

const FEATURES = [
  {
    icon: <Sun className="w-6 h-6 text-amber-400" />,
    title: "Real Solar Assets",
    desc: "Every token represents a legal right to income from a verified, physical solar installation.",
  },
  {
    icon: <Zap className="w-6 h-6 text-emerald-400" />,
    title: "Instant Yield Claims",
    desc: "Revenue epochs are posted on-chain. Claim your share of distributable income anytime.",
  },
  {
    icon: <Shield className="w-6 h-6 text-sky-400" />,
    title: "Proof of Income",
    desc: "Meter reports and financial statements are stored on Arweave — permanently verifiable.",
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
    title: "Fractional Ownership",
    desc: "Start with as little as $50 USDC. No high minimums, no locked-up capital.",
  },
];

export default function HomePage() {
  const [assets, setAssets]     = useState<AssetListItem[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    assetsApi
      .list({ status: "active_sale", limit: 6, sort: "yield_desc" })
      .then(r => setAssets(r.items))
      .catch(() => {
        // fallback mock data for demo when API is offline
        setAssets(MOCK_ASSETS);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-800/60
                        bg-emerald-950/40 text-emerald-400 text-xs font-semibold mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
          Live on Solana Devnet
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
          <span className="text-slate-100">Invest in </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
            Solar Energy
          </span>
          <br />
          <span className="text-slate-100">earn real yield</span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          SolaShare tokenizes the revenue rights of real solar installations.
          Buy fractional shares, claim distributable income, and track everything on-chain.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/assets" className="btn-primary text-base px-7 py-3.5">
            Browse Assets <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/portfolio" className="btn-secondary text-base px-7 py-3.5">
            My Portfolio
          </Link>
        </div>

        {/* Platform stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {PLATFORM_STATS.map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <p className="text-2xl font-extrabold text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Assets ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="label-text mb-1">Active Offerings</p>
            <h2 className="section-title">Featured Solar Assets</h2>
          </div>
          <Link href="/assets" className="btn-ghost text-sm">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <AssetCardSkeleton key={i} />)
            : assets.map(a => <AssetCard key={a.id} asset={a} />)}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <p className="label-text mb-2">How it works</p>
          <h2 className="section-title text-3xl">End-to-end solar RWA flow</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { step: "01", title: "Browse Assets",   desc: "Explore verified solar installations with transparent financials.",     icon: "🔍" },
            { step: "02", title: "Buy Shares",      desc: "Purchase fractional shares via USDC. Gasless first transaction.",      icon: "💰" },
            { step: "03", title: "Track Revenue",   desc: "Operators post monthly revenue epochs with proof-of-income.",          icon: "📊" },
            { step: "04", title: "Claim Yield",     desc: "Claim your proportional share of distributable revenue on-chain.",     icon: "⚡" },
          ].map(step => (
            <div key={step.step} className="glass-card p-6 relative">
              <div className="absolute -top-3 left-5 px-2 py-0.5 rounded-md bg-emerald-600 text-xs font-bold text-white">
                {step.step}
              </div>
              <div className="text-3xl mb-4 mt-1">{step.icon}</div>
              <h3 className="font-bold text-slate-100 mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <p className="label-text mb-2">Why SolaShare</p>
          <h2 className="section-title text-3xl">Built for trust and transparency</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="glass-card p-6 flex gap-5">
              <div className="w-12 h-12 rounded-xl bg-surface-100 border border-surface-200/60 flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-100 mb-1">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="glass-card p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-slate-100 mb-4">
              Ready to earn green yield?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Connect your Telegram account and start investing in the future of clean energy.
            </p>
            <Link href="/assets" className="btn-primary text-base px-8 py-3.5">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Demo fallback data ────────────────────────────────────────────────────────

const MOCK_ASSETS: AssetListItem[] = [
  { id: "asset-1", title: "Almaty Solar Farm A",   energy_type: "solar", capacity_kw: 150, status: "active_sale", price_per_share_usdc: 10,  expected_annual_yield_percent: 13.2 },
  { id: "asset-2", title: "Nur-Sultan Rooftop B",  energy_type: "solar", capacity_kw: 80,  status: "active_sale", price_per_share_usdc: 5,   expected_annual_yield_percent: 11.8 },
  { id: "asset-3", title: "Shymkent Wind Park",    energy_type: "wind",  capacity_kw: 300, status: "active_sale", price_per_share_usdc: 25,  expected_annual_yield_percent: 14.5 },
  { id: "asset-4", title: "Astana EV Hub",         energy_type: "ev_charging", capacity_kw: 50, status: "verified", price_per_share_usdc: 15, expected_annual_yield_percent: 9.4 },
  { id: "asset-5", title: "Karaganda Solar Fields", energy_type: "solar", capacity_kw: 200, status: "funded",     price_per_share_usdc: 10,  expected_annual_yield_percent: 12.1 },
  { id: "asset-6", title: "Atyrau Hydro Station",  energy_type: "hydro", capacity_kw: 500, status: "active_sale", price_per_share_usdc: 50,  expected_annual_yield_percent: 10.5 },
];
