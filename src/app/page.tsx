"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { assetsApi } from "@/lib/api";
import { AssetCard, AssetCardSkeleton } from "@/components/AssetCard";
import { EmptyState } from "@/components/EmptyState";
import type { AssetListItem } from "@/types";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const [assets, setAssets] = useState<AssetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    assetsApi
      .list({ status: "active_sale", limit: 6, sort: "yield_desc" })
      .then((r) => setAssets(r.items))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load assets."),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const heroLogoSrc =
    mounted && resolvedTheme === "light"
      ? "/logo_grey_caption.svg"
      : "/logo_white_caption.svg";

  return (
    <div className="max-w-[1440px] mx-auto px-8 animate-fade-in">
      {/* Hero */}
      <section className="py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,560px)_1fr]">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8"
              style={{
                background: "var(--surface-low)",
                color: "var(--text-muted)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse" />
              Live on Solana Devnet
            </div>
            <h1
              className="text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-6"
              style={{ color: "var(--text)" }}
            >
              Invest in
              <br />
              <span className="sol-text">Solar Energy.</span>
              <br />
              Earn real yield.
            </h1>
            <p
              className="text-lg max-w-xl leading-relaxed mb-10"
              style={{ color: "var(--text-muted)" }}
            >
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
          </div>

          <div className="relative hidden min-h-[380px] lg:block">
            <div className="flex h-full items-start justify-center pt-2 lg:justify-end lg:pr-2 xl:pr-8">
              <div className="relative w-[400px] xl:w-[440px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-10 top-14 h-[220px] rounded-full blur-3xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(20, 241, 149, 0.22) 0%, rgba(91, 190, 255, 0.16) 52%, rgba(153, 69, 255, 0.22) 100%)",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-2 inset-y-4 rounded-[40px] border backdrop-blur-xl"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 34%, rgba(255,255,255,0.01) 100%)",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    boxShadow:
                      "0 30px 80px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-20 top-10 h-16 rounded-full blur-2xl"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
                  }}
                />
                <div className="relative z-10 px-8 pb-8 pt-7">
                  <Image
                    src={heroLogoSrc}
                    alt="SolaShare"
                    width={420}
                    height={267}
                    priority
                    className="h-auto w-full opacity-95"
                    style={{
                      filter:
                        "drop-shadow(0 18px 40px rgba(20, 241, 149, 0.16)) drop-shadow(0 24px 48px rgba(153, 69, 255, 0.18))",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
        {[
          { value: "$2.4M", label: "Total Assets", color: "text-[#14F195]" },
          { value: "1,240+", label: "Investors", color: "text-[#9945FF]" },
          { value: "12.4%", label: "Avg. APY", color: "text-[#00693e]" },
          { value: "8", label: "Countries", color: "text-[#14F195]" },
        ].map((s) => (
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
            <h2
              className="text-3xl font-black"
              style={{ color: "var(--text)" }}
            >
              Featured Assets
            </h2>
          </div>
          <Link
            href="/assets"
            className="text-sm font-bold text-[#9945FF] hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <AssetCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <EmptyState title="Assets unavailable" description={error} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mb-16">
        <div className="text-center mb-10">
          <p className="label-xs mb-2">How it works</p>
          <h2 className="text-3xl font-black" style={{ color: "var(--text)" }}>
            End-to-end solar RWA
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              n: "01",
              title: "Browse",
              desc: "Explore verified solar installations.",
              icon: "search",
            },
            {
              n: "02",
              title: "Invest",
              desc: "Buy shares via USDC. Gasless.",
              icon: "payments",
            },
            {
              n: "03",
              title: "Track",
              desc: "Operators post revenue epochs.",
              icon: "analytics",
            },
            {
              n: "04",
              title: "Claim",
              desc: "Claim proportional yield on-chain.",
              icon: "bolt",
            },
          ].map((s) => (
            <div key={s.n} className="card p-6 relative">
              <div className="absolute -top-3 left-5">
                <span className="text-[10px] font-black px-2 py-1 rounded-md text-white sol-gradient">
                  {s.n}
                </span>
              </div>
              <span
                className="material-symbols-outlined text-3xl text-[#9945FF] mb-4 block mt-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {s.icon}
              </span>
              <h3
                className="font-black text-base mb-2"
                style={{ color: "var(--text)" }}
              >
                {s.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mb-16">
        <div className="rounded-[40px] overflow-hidden relative p-12 text-center sol-gradient">
          <h2 className="text-4xl font-black text-white mb-4">
            Ready to earn green yield?
          </h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Connect your Telegram account and start investing in clean energy.
          </p>
          <Link
            href="/assets"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[#2d2f2f] font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
