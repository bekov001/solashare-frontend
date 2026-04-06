"use client";
import type { LucideIcon } from "lucide-react";
import { Bolt, Home, Store, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/assets", icon: Store, label: "Market" },
  { href: "/portfolio", icon: Wallet, label: "Assets" },
  { href: "/portfolio", icon: Bolt, label: "Yield" },
] satisfies Array<{
  href: string;
  icon: LucideIcon;
  label: string;
}>;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 rounded-t-3xl border-t transition-colors"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {ITEMS.map((item, i) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={i}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-90 ${
              active ? "bg-[#9945FF]/10 text-[#9945FF]" : ""
            }`}
            style={active ? {} : { color: "var(--text-faint)" }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
