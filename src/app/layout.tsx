import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "SolaShare — Solar RWA on Solana",
  description:
    "Invest in real-world solar energy assets through fractional ownership on Solana. Earn yield, claim revenue, and track your green portfolio.",
  keywords: ["solar", "RWA", "Solana", "DeFi", "green energy", "tokenization"],
  openGraph: {
    title: "SolaShare",
    description: "Fractional solar energy investments on Solana",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#060c09] text-slate-200 antialiased">
        <AuthProvider>
          {/* Ambient background */}
          <div className="fixed inset-0 pointer-events-none" aria-hidden>
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100" />
            <div className="absolute inset-0 bg-hero-gradient" />
          </div>

          <div className="relative z-10 min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>

            <footer className="border-t border-surface-200/40 mt-20 py-8 px-6">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">SolaShare</span>
                  <span>— Solar RWA on Solana</span>
                </div>
                <span>Built for Decentrathon 2026</span>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
