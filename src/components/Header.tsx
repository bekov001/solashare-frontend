"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import { Menu, X, Sun, Wallet, LogOut, ChevronDown, ShieldCheck, BarChart3, User } from "lucide-react";

const NAV_LINKS = [
  { href: "/assets",    label: "Explore" },
  { href: "/portfolio", label: "Portfolio", auth: true, roles: ["investor"] as UserRole[] },
  { href: "/issuer",    label: "Issuer",    auth: true, roles: ["issuer"] as UserRole[] },
  { href: "/admin",     label: "Admin",     auth: true, roles: ["admin"] as UserRole[] },
];

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  investor: <User className="w-3.5 h-3.5" />,
  issuer:   <BarChart3 className="w-3.5 h-3.5" />,
  admin:    <ShieldCheck className="w-3.5 h-3.5" />,
};

const ROLE_COLORS: Record<UserRole, string> = {
  investor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60",
  issuer:   "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/60",
  admin:    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60",
};

export function Header() {
  const { user, logout, devSwitchRole } = useAuth();
  const pathname   = usePathname();
  const [open, setOpen]       = useState(false);
  const [devMenu, setDevMenu] = useState(false);

  const visibleLinks = NAV_LINKS.filter(l => {
    if (!l.auth) return true;
    if (!user) return false;
    if (l.roles && !l.roles.includes(user.role)) return false;
    return true;
  });

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300"
      style={{
        borderColor: "var(--border)",
        background: "rgba(var(--bg-base-rgb, 6,12,9), 0.85)",
      }}
    >
      {/* Use a simpler approach for header bg */}
      <div
        className="absolute inset-0 dark:bg-[#060c09]/80 bg-white/80 backdrop-blur-xl -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                          bg-emerald-100 dark:bg-emerald-600/20 border border-emerald-300 dark:border-emerald-600/40
                          group-hover:bg-emerald-200 dark:group-hover:bg-emerald-600/30">
            <Sun className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-emerald-600 dark:text-emerald-400">Sola</span>
            <span className="text-slate-800 dark:text-slate-100">Share</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(l.href)
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Dev role switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setDevMenu(!devMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                         border border-[var(--border)] text-[var(--text-faint)]
                         hover:text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
            >
              Dev <ChevronDown className="w-3 h-3" />
            </button>
            {devMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-44 rounded-xl shadow-xl overflow-hidden z-50 border"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                onMouseLeave={() => setDevMenu(false)}
              >
                <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>Switch Demo Role</p>
                </div>
                {(["investor", "issuer", "admin"] as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => { devSwitchRole(role); setDevMenu(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors capitalize",
                      user?.role === role ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {ROLE_ICONS[role]} {role}
                    {user?.role === role && <span className="ml-auto text-xs text-emerald-500">active</span>}
                  </button>
                ))}
                {user && (
                  <button
                    onClick={() => { logout(); setDevMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border-t transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User badge */}
          {user ? (
            <div className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold",
              ROLE_COLORS[user.role]
            )}>
              {ROLE_ICONS[user.role]}
              <span>{user.display_name}</span>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:flex btn-primary text-xs px-4 py-2">
              <Wallet className="w-3.5 h-3.5" /> Connect
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t px-4 py-4 space-y-1"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
        >
          {visibleLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                pathname.startsWith(l.href)
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t flex gap-2 flex-wrap" style={{ borderColor: "var(--border)" }}>
            {(["investor", "issuer", "admin"] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => { devSwitchRole(role); setOpen(false); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors",
                  user?.role === role ? ROLE_COLORS[role] : "text-slate-500 border-[var(--border)]"
                )}
              >
                {ROLE_ICONS[role]} {role}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
