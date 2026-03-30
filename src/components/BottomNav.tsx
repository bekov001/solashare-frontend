"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/",         icon: "home",                  label: "Home" },
  { href: "/assets",   icon: "storefront",             label: "Market" },
  { href: "/portfolio",icon: "account_balance_wallet", label: "Assets" },
  { href: "/portfolio",icon: "bolt",                   label: "Yield" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 rounded-t-3xl border-t transition-colors"
         style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {ITEMS.map((item, i) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={i} href={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all active:scale-90 ${
                  active ? "bg-[#9945FF]/10 text-[#9945FF]" : ""
                }`}
                style={active ? {} : { color: "var(--text-faint)" }}>
            <span className="material-symbols-outlined"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
