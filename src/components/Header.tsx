"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
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
  investor: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
  issuer:   "text-sky-400 bg-sky-950/60 border-sky-800/60",
  admin:    "text-amber-400 bg-amber-950/60 border-amber-800/60",
};

export function Header() {
  const { user, logout, devSwitchRole } = useAuth();
  const pathname   = usePathname();
  const [open, setOpen]         = useState(false);
  const [devMenu, setDevMenu]   = useState(false);

  const visibleLinks = NAV_LINKS.filter(l => {
    if (!l.auth) return true;
    if (!user) return false;
    if (l.roles && !l.roles.includes(user.role)) return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-50 border-b border-surface-200/40 bg-[#060c09]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center
                          group-hover:bg-emerald-600/30 transition-colors">
            <Sun className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-emerald-400">Sola</span>
            <span className="text-slate-100">Share</span>
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
                  ? "text-emerald-400 bg-emerald-950/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Dev role switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setDevMenu(!devMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-200/60 bg-surface-100/40
                         text-xs text-slate-500 hover:text-slate-300 hover:border-surface-200 transition-colors"
            >
              Dev <ChevronDown className="w-3 h-3" />
            </button>
            {devMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-surface-200 bg-[#0d1a12] shadow-xl overflow-hidden z-50"
                   onMouseLeave={() => setDevMenu(false)}>
                <div className="px-3 py-2 border-b border-surface-200/40">
                  <p className="text-xs text-slate-500 font-medium">Switch Demo Role</p>
                </div>
                {(["investor", "issuer", "admin"] as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => { devSwitchRole(role); setDevMenu(false); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors capitalize",
                      user?.role === role ? "text-emerald-400" : "text-slate-400"
                    )}
                  >
                    {ROLE_ICONS[role]} {role}
                    {user?.role === role && <span className="ml-auto text-xs text-emerald-600">active</span>}
                  </button>
                ))}
                {user && (
                  <button
                    onClick={() => { logout(); setDevMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-950/20 border-t border-surface-200/40"
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
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-surface-200/40 bg-[#060c09]/95 px-4 py-4 space-y-1">
          {visibleLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                pathname.startsWith(l.href)
                  ? "text-emerald-400 bg-emerald-950/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-surface-200/40 flex gap-2 flex-wrap">
            {(["investor", "issuer", "admin"] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => { devSwitchRole(role); setOpen(false); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors",
                  user?.role === role ? ROLE_COLORS[role] : "text-slate-500 border-surface-200/60"
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
