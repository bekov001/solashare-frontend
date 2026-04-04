"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import type { KycStatus } from "@/types";
import { ArrowUpRight, CheckCircle2, Shield, Wallet } from "lucide-react";

const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  not_started: "Not started",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  needs_changes: "Needs changes",
};

export function InvestorSetupCard() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const kycApproved = user.kyc_status === "approved";
  const walletBound = Boolean(user.wallet_address);

  return (
    <div className="card p-6 space-y-5">
      <div>
        <p className="label-xs mb-2">Investor Access</p>
        <h3 className="text-xl font-black" style={{ color: "var(--text)" }}>
          Complete account access before investing
        </h3>
      </div>

      <div className="grid gap-3">
        <div className="rounded-2xl p-4" style={{ background: "var(--surface-low)" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#9945FF]" />
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                KYC verification
              </span>
            </div>
            <span className={`text-xs font-bold ${kycApproved ? "text-[#14F195]" : "text-[#9945FF]"}`}>
              {KYC_STATUS_LABELS[(user.kyc_status ?? "not_started") as KycStatus]}
            </span>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--text-faint)" }}>
            Upload your passport or ID on the dedicated KYC page.
          </p>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "var(--surface-low)" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#14F195]" />
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                Solana wallet
              </span>
            </div>
            <span className={`text-xs font-bold ${walletBound ? "text-[#14F195]" : "text-[#9945FF]"}`}>
              {walletBound ? "Connected" : "Not connected"}
            </span>
          </div>
          {user.wallet_address && (
            <p className="mt-2 text-xs font-mono" style={{ color: "var(--text-faint)" }}>
              {user.wallet_address}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/kyc" className="btn-outline w-full justify-center">
          Open KYC
          <ArrowUpRight className="w-4 h-4" />
        </Link>
        <Link href="/profile" className="btn-dark w-full justify-center">
          Open Profile
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {kycApproved && walletBound && (
        <div className="rounded-2xl p-4 text-sm font-medium text-[#14F195]" style={{ background: "#14F19510" }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Ready for investment and claim flows.
          </div>
        </div>
      )}
    </div>
  );
}
