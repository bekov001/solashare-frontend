"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { LucideIcon } from "lucide-react";
import { Bolt, Home, Shield, Store, Wallet } from "lucide-react";

const LINKS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/assets", icon: Store, label: "Marketplace" },
  {
    href: "/portfolio",
    icon: Wallet,
    label: "My Assets",
    auth: true,
    role: "investor",
  },
  { href: "/issuer", icon: Bolt, label: "Issuer", auth: true, role: "issuer" },
  { href: "/admin", icon: Shield, label: "Admin", auth: true, role: "admin" },
] satisfies Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  auth?: boolean;
  role?: string;
}>;

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = LINKS.filter((l) => {
    if (!l.auth) return true;
    if (!user) return false;
    if (l.role && user.role !== l.role) return false;
    return true;
  });

  return (
    <aside
      className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-full pt-20 border-r z-40 transition-colors"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <nav className="flex-1 px-4 pt-4 space-y-1">
        {links.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={
                active
                  ? "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-[#9945FF]/5 text-[#9945FF] transition-all"
                  : "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-[var(--surface-low)]"
              }
              style={active ? {} : { color: "var(--text-muted)" }}
            >
              <Icon className="w-5 h-5" />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 pb-6">
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface-low)" }}
        >
          <p className="label-xs mb-2">Network</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#14F195] rounded-full" />
            <span
              className="text-xs font-bold"
              style={{ color: "var(--text-muted)" }}
            >
              Solana Devnet
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
