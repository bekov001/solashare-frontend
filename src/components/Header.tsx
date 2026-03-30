"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import type { UserRole } from "@/types";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { href: "/assets",    label: "Marketplace" },
  { href: "/portfolio", label: "My Assets",  role: "investor" as UserRole },
  { href: "/issuer",    label: "Issuer",     role: "issuer" as UserRole },
  { href: "/admin",     label: "Admin",      role: "admin" as UserRole },
];

export function Header() {
  const { user, logout, devSwitchRole } = useAuth();
  const pathname = usePathname();
  const [devOpen, setDevOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = NAV.filter(l => !l.role || user?.role === l.role);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl transition-colors"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between px-6 lg:px-8 h-16 max-w-[1440px] mx-auto">
        {/* Logo — visible on mobile, hidden on desktop (sidebar shows it) */}
        <Link href="/" className="text-xl font-bold sol-text lg:hidden">SolaShare</Link>
        <div className="hidden lg:block" />

        {/* Center nav (desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold absolute left-1/2 -translate-x-1/2">
          {links.map(l => {
            const active = pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href}
                    className={`pb-0.5 transition-colors ${active
                      ? "text-[#2d2f2f] dark:text-white border-b-2 border-[#14F195]"
                      : "text-gray-400 hover:text-[#2d2f2f] dark:hover:text-white"
                    }`}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Dev switcher */}
          <div className="relative hidden sm:block">
            <button onClick={() => setDevOpen(!devOpen)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
              Dev <ChevronDown className="w-3 h-3" />
            </button>
            {devOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 rounded-2xl shadow-xl z-50 border overflow-hidden"
                   style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                   onMouseLeave={() => setDevOpen(false)}>
                <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Demo Role</p>
                </div>
                {(["investor","issuer","admin"] as UserRole[]).map(role => (
                  <button key={role} onClick={() => { devSwitchRole(role); setDevOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm capitalize hover:bg-[#9945FF]/5 transition-colors"
                          style={{ color: user?.role === role ? "#9945FF" : "var(--text-muted)" }}>
                    {role}
                    {user?.role === role && <span className="ml-auto text-[10px] font-bold text-[#14F195]">●</span>}
                  </button>
                ))}
                {user && (
                  <button onClick={() => { logout(); setDevOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border-t transition-colors"
                          style={{ borderColor: "var(--border)" }}>
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Avatar or connect */}
          {user ? (
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.display_name}`} alt="avatar" />
            </div>
          ) : (
            <Link href="/login" className="btn-sol text-xs px-4 py-2">Connect</Link>
          )}

          {/* Mobile burger */}
          <button className="md:hidden p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}
                  onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-1" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    pathname.startsWith(l.href) ? "bg-[#9945FF]/5 text-[#9945FF] font-bold" : ""
                  }`} style={pathname.startsWith(l.href) ? {} : { color: "var(--text-muted)" }}>
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t flex gap-2 flex-wrap" style={{ borderColor: "var(--border)" }}>
            {(["investor","issuer","admin"] as UserRole[]).map(role => (
              <button key={role} onClick={() => { devSwitchRole(role); setMobileOpen(false); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize border transition-colors ${
                        user?.role === role ? "bg-[#9945FF]/5 text-[#9945FF] border-[#9945FF]/20" : "border-[var(--border)]"
                      }`} style={user?.role === role ? {} : { color: "var(--text-faint)" }}>
                {role}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
