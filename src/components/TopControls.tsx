"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, UserCircle2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth";

export function TopControls() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="fixed top-4 right-4 lg:right-8 z-50 flex items-center gap-2">
      <ThemeToggle />

      {user ? (
        <div
          className="flex items-center gap-1 rounded-full border px-2 py-1.5 backdrop-blur-xl"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Link
            href="/profile"
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              pathname === "/profile" ? "text-[#9945FF]" : ""
            }`}
            style={
              pathname === "/profile" ? {} : { color: "var(--text-muted)" }
            }
          >
            {user.avatar_url ? (
              <span className="relative h-5 w-5 overflow-hidden rounded-full">
                <Image
                  src={user.avatar_url}
                  alt={user.display_name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </span>
            ) : (
              <UserCircle2 className="w-4 h-4" />
            )}
            <span className="max-w-[120px] truncate">{user.display_name}</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center rounded-full p-2 transition-colors hover:text-red-400"
            style={{ color: "var(--text-muted)" }}
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <LogIn className="w-4 h-4" />
          Login
        </Link>
      )}
    </div>
  );
}
