"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { assetsApi } from "@/lib/api";
import { AssetCard, AssetCardSkeleton } from "@/components/AssetCard";
import type { AssetListItem } from "@/types";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assetsApi.list({ status: "active_sale", limit: 6, sort: "yield_desc" })
      .then(r => setAssets(r.items))
      .catch(() => setAssets(MOCK_ASSETS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-8 animate-fade-in">
      {/* Hero */}
      <section className="py-16 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8"
             style={{ background: "var(--surface-low)", color: "var(--text-muted)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
          Live on Solana Devnet
        </div>
        <h1 className="text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-6" style={{ color: "var(--text)" }}>
          Invest in<br />
          <span className="sol-text">Solar Energy.</span><br />
          Earn real yield.
        </h1>
        <p className="text-lg max-w-xl leading-relaxed mb-10" style={{ color: "var(--text-muted)" }}>
          SolaShare tokenizes revenue rights of real solar installations.
          Buy fractional shares, claim yield on-chain — gasless.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/assets" className="btn-sol text-base px-8 py-4">
            Browse Assets <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/portfolio" className="btn-dark text-base px-8 py-4">
            My Portfolio
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
        {[
          { value: "$2.4M",  label: "Total Assets",  color: "text-[#14F195]" },
          { value: "1,240+", label: "Investors",      color: "text-[#9945FF]" },
          { value: "12.4%",  label: "Avg. APY",       color: "text-[#00693e]" },
          { value: "8",      label: "Countries",       color: "text-[#14F195]" },
        ].map(s => (
          <div key={s.label} className="card p-6">
            <p className={`text-3xl font-black mb-1 ${s.color}`}>{s.value}</p>
            <p className="label-xs">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Featured */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="label-xs mb-2">Active Offerings</p>
            <h2 className="text-3xl font-black" style={{ color: "var(--text)" }}>Featured Assets</h2>
          </div>
          <Link href="/assets" className="text-sm font-bold text-[#9945FF] hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <AssetCardSkeleton key={i} />)
            : assets.map(a => <AssetCard key={a.id} asset={a} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-16">
        <div className="text-center mb-10">
          <p className="label-xs mb-2">How it works</p>
          <h2 className="text-3xl font-black" style={{ color: "var(--text)" }}>End-to-end solar RWA</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { n: "01", title: "Browse",    desc: "Explore verified solar installations.", icon: "search" },
            { n: "02", title: "Invest",    desc: "Buy shares via USDC. Gasless.",         icon: "payments" },
            { n: "03", title: "Track",     desc: "Operators post revenue epochs.",         icon: "analytics" },
            { n: "04", title: "Claim",     desc: "Claim proportional yield on-chain.",     icon: "bolt" },
          ].map(s => (
            <div key={s.n} className="card p-6 relative">
              <div className="absolute -top-3 left-5">
                <span className="text-[10px] font-black px-2 py-1 rounded-md text-white sol-gradient">{s.n}</span>
              </div>
              <span className="material-symbols-outlined text-3xl text-[#9945FF] mb-4 block mt-2"
                    style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <h3 className="font-black text-base mb-2" style={{ color: "var(--text)" }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mb-16">
        <div className="rounded-[40px] overflow-hidden relative p-12 text-center sol-gradient">
          <h2 className="text-4xl font-black text-white mb-4">Ready to earn green yield?</h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Connect your Telegram account and start investing in clean energy.
          </p>
          <Link href="/assets" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#2d2f2f] font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

const MOCK_ASSETS: AssetListItem[] = [
  { id: "asset-1", title: "Almaty Solar Farm A",    energy_type: "solar",       capacity_kw: 150, status: "active_sale", price_per_share_usdc: 10, expected_annual_yield_percent: 13.2 },
  { id: "asset-2", title: "Nur-Sultan Rooftop B",   energy_type: "solar",       capacity_kw: 80,  status: "active_sale", price_per_share_usdc: 5,  expected_annual_yield_percent: 11.8 },
  { id: "asset-3", title: "Shymkent Wind Park",     energy_type: "wind",        capacity_kw: 300, status: "active_sale", price_per_share_usdc: 25, expected_annual_yield_percent: 14.5 },
  { id: "asset-4", title: "Astana EV Hub",          energy_type: "ev_charging", capacity_kw: 50,  status: "verified",    price_per_share_usdc: 15, expected_annual_yield_percent: 9.4  },
  { id: "asset-5", title: "Karaganda Solar Fields", energy_type: "solar",       capacity_kw: 200, status: "funded",      price_per_share_usdc: 10, expected_annual_yield_percent: 12.1 },
  { id: "asset-6", title: "Atyrau Hydro Station",   energy_type: "hydro",       capacity_kw: 500, status: "active_sale", price_per_share_usdc: 50, expected_annual_yield_percent: 10.5 },
];
