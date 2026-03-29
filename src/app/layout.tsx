import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/components/ThemeProvider";
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none" aria-hidden>
              <div
                className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px]"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse 80% 60% at 50% -10%, var(--hero-glow) 0%, transparent 70%)",
                }}
              />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>

              <footer
                className="mt-20 py-8 px-6 border-t"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
                     style={{ color: "var(--text-faint)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">SolaShare</span>
                    <span>— Solar RWA on Solana</span>
                  </div>
                  <span>Built for Decentrathon 2026</span>
                </div>
              </footer>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
