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
  investor: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60",
  issuer:   "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/60",
  admin:    "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60",
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
    <header className="sticky top-0 z-50 border-b transition-colors duration-300
                       bg-white/80 dark:bg-[#060c09]/85 backdrop-blur-xl
                       border-emerald-100 dark:border-emerald-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                          bg-emerald-100 dark:bg-emerald-600/20
                          border border-emerald-300 dark:border-emerald-600/40
                          group-hover:bg-emerald-200 dark:group-hover:bg-emerald-600/30">
            <Sun className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-emerald-600 dark:text-emerald-400">Sola</span>
            <span className="text-slate-800 dark:text-slate-100">Share</span>
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(l.href)
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2">

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Dev role switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setDevMenu(!devMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                         border border-slate-200 dark:border-emerald-950/70
                         text-slate-400 dark:text-slate-500
                         hover:text-slate-600 dark:hover:text-slate-300
                         hover:border-slate-300 dark:hover:border-emerald-900/60
                         bg-transparent"
            >
              Dev <ChevronDown className="w-3 h-3" />
            </button>

            {devMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-44 rounded-xl shadow-lg overflow-hidden z-50
                           border border-slate-200 dark:border-emerald-950/60
                           bg-white dark:bg-[#0d1a12]"
                onMouseLeave={() => setDevMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-emerald-950/60">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-600">Switch Demo Role</p>
                </div>
                {(["investor", "issuer", "admin"] as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => { devSwitchRole(role); setDevMenu(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors capitalize",
                      "hover:bg-slate-50 dark:hover:bg-white/5",
                      user?.role === role
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {ROLE_ICONS[role]} {role}
                    {user?.role === role && (
                      <span className="ml-auto text-xs text-emerald-500">active</span>
                    )}
                  </button>
                ))}
                {user && (
                  <button
                    onClick={() => { logout(); setDevMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500
                               hover:bg-red-50 dark:hover:bg-red-950/20
                               border-t border-slate-100 dark:border-emerald-950/60 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User / connect */}
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
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {open && (
        <div className="md:hidden border-t border-slate-100 dark:border-emerald-950/60
                        bg-white dark:bg-[#060c09] px-4 py-4 space-y-1">
          {visibleLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                pathname.startsWith(l.href)
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-emerald-950/60 flex gap-2 flex-wrap">
            {(["investor", "issuer", "admin"] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => { devSwitchRole(role); setOpen(false); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors",
                  user?.role === role
                    ? ROLE_COLORS[role]
                    : "text-slate-500 border-slate-200 dark:border-slate-700"
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
