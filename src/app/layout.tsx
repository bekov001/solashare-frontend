import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TopControls } from "@/components/TopControls";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "SolaShare — Solar RWA on Solana",
  description:
    "Invest in real-world solar energy assets through fractional ownership on Solana. Earn yield, claim revenue, and track your green portfolio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js?61" strategy="beforeInteractive" />
      </head>
      <body style={{ background: "var(--bg)" }} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <TopControls />
            <Sidebar />
            <main className="lg:ml-64 pt-24 lg:pt-10 pb-24 lg:pb-8 min-h-screen">{children}</main>
            <BottomNav />
            <footer
              className="lg:ml-64 py-10 px-8 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <span className="text-xs font-bold opacity-40" style={{ color: "var(--text)" }}>
                  © 2025 SolaShare. Powered by Solana.
                </span>
                <div className="flex gap-8">
                  {["Documentation", "Privacy Policy", "Terms", "Discord"].map((l) => (
                    <a
                      key={l}
                      href="#"
                      className="text-xs font-medium opacity-40 hover:opacity-100 hover:text-[#9945FF] transition-all"
                      style={{ color: "var(--text)" }}
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
