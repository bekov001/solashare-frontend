"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FileDropInput } from "@/components/FileDropInput";
import { EmptyState } from "@/components/EmptyState";
import { WalletSetupCard } from "@/components/WalletSetupCard";
import { investorApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { uploadAvatarImage } from "@/lib/uploads";
import type { AuthUser } from "@/types";
import {
  ArrowUpRight,
  LogOut,
  Mail,
  ShieldCheck,
  X,
  UserCircle2,
} from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dialogImage, setDialogImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const localAvatarPreview = useMemo(() => {
    if (!avatarFile?.type.startsWith("image/")) {
      return null;
    }

    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (localAvatarPreview) {
        URL.revokeObjectURL(localAvatarPreview);
      }
    };
  }, [localAvatarPreview]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    investorApi
      .profile()
      .then((res) => {
        setProfile(res.user);
        setForm({
          display_name: res.user.display_name ?? "",
          bio: res.user.bio ?? "",
          avatar_url: res.user.avatar_url ?? "",
        });
      })
      .catch((err) => {
        setProfile(null);
        setError(
          err instanceof Error ? err.message : "Failed to load profile.",
        );
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      let avatarUrl = form.avatar_url.trim() || null;

      if (avatarFile) {
        const upload = await uploadAvatarImage(avatarFile);
        avatarUrl = upload.file_url;
      }

      const res = await investorApi.updateProfile({
        display_name: form.display_name.trim(),
        bio: form.bio.trim() || null,
        avatar_url: avatarUrl,
      });
      setProfile(res.user);
      setForm((prev) => ({ ...prev, avatar_url: res.user.avatar_url ?? "" }));
      setAvatarFile(null);
      await refreshUser();
      setMessage("Profile updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 sol-gradient">
          <UserCircle2 className="w-8 h-8 text-white" />
        </div>
        <h1
          className="text-3xl font-black mb-3"
          style={{ color: "var(--text)" }}
        >
          Sign in to manage your profile
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          Manage account details and investor access from one place.
        </p>
        <Link href="/login" className="btn-sol px-8">
          Go to Login
        </Link>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-10 space-y-6 animate-pulse">
        <div className="card h-40" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card h-96" />
          <div className="card h-96" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <EmptyState
          title="Profile unavailable"
          description={error || "Unable to load profile."}
        />
      </div>
    );
  }

  const activeAvatar =
    localAvatarPreview || form.avatar_url || profile.avatar_url;

  return (
    <>
      <div className="max-w-6xl mx-auto px-8 py-10 animate-fade-in space-y-8">
        <section className="card p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  activeAvatar
                    ? setDialogImage({
                        src: activeAvatar,
                        alt: `${profile.display_name} avatar`,
                      })
                    : undefined
                }
                className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl"
                style={{ background: "var(--surface-low)" }}
              >
                {activeAvatar ? (
                  <Image
                    src={activeAvatar}
                    alt={`${profile.display_name} avatar`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <UserCircle2
                    className="w-8 h-8"
                    style={{ color: "var(--text-muted)" }}
                  />
                )}
              </button>
              <div>
                <p className="label-xs mb-2">Profile</p>
                <h1
                  className="text-3xl font-black"
                  style={{ color: "var(--text)" }}
                >
                  {profile.display_name}
                </h1>
                <div
                  className="mt-2 flex flex-wrap items-center gap-3 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {profile.email ?? "No email"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>

            <button type="button" onClick={logout} className="btn-outline">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="card p-6">
            <div className="mb-5">
              <p className="label-xs mb-2">Account</p>
              <h2
                className="text-2xl font-black"
                style={{ color: "var(--text)" }}
              >
                Edit profile
              </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <div className="label-xs mb-2">Avatar</div>
                <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                  <button
                    type="button"
                    onClick={() =>
                      activeAvatar
                        ? setDialogImage({
                            src: activeAvatar,
                            alt: `${profile.display_name} avatar`,
                          })
                        : undefined
                    }
                    className="overflow-hidden rounded-3xl border"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--surface-low)",
                    }}
                  >
                    <div className="relative aspect-square w-full">
                      {activeAvatar ? (
                        <Image
                          src={activeAvatar}
                          alt={`${profile.display_name} avatar`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <UserCircle2
                            className="w-14 h-14"
                            style={{ color: "var(--text-muted)" }}
                          />
                        </div>
                      )}
                    </div>
                  </button>

                  <FileDropInput
                    accept="image/png,image/jpeg,image/jpg"
                    buttonLabel="Choose avatar"
                    title="Drop a new avatar here"
                    selectedLabel={avatarFile?.name ?? null}
                    description="JPG or PNG up to 10 MB. Click the preview to inspect it."
                    onFilesSelected={(files) => setAvatarFile(files[0] ?? null)}
                  />
                </div>
              </div>

              <div>
                <label className="label-xs mb-2 block">Display name</label>
                <input
                  className="input-new"
                  value={form.display_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="label-xs mb-2 block">Bio</label>
                <textarea
                  rows={4}
                  className="input-new resize-none"
                  value={form.bio}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Tell investors or partners who you are."
                />
              </div>

              {message && (
                <div
                  className="rounded-2xl p-3 text-xs font-medium text-[#14F195]"
                  style={{ background: "#14F19510" }}
                >
                  {message}
                </div>
              )}

              {error && (
                <div
                  className="rounded-2xl p-3 text-xs font-medium text-red-400"
                  style={{ background: "rgba(248,113,113,0.1)" }}
                >
                  {error}
                </div>
              )}

              <button type="submit" disabled={saving} className="btn-sol">
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </section>

          <section className="space-y-6">
            {profile.role === "investor" ? (
              <>
                <div className="card p-6 space-y-5">
                  <div>
                    <p className="label-xs mb-2">KYC</p>
                    <h2
                      className="text-2xl font-black"
                      style={{ color: "var(--text)" }}
                    >
                      Verification status
                    </h2>
                  </div>

                  <div
                    className="rounded-2xl p-4"
                    style={{ background: "var(--surface-low)" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--text)" }}
                      >
                        Current status
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          profile.kyc_status === "approved"
                            ? "text-[#14F195]"
                            : profile.kyc_status === "rejected"
                              ? "text-red-400"
                              : profile.kyc_status === "needs_changes"
                                ? "text-amber-400"
                                : "text-[#9945FF]"
                        }`}
                      >
                        {profile.kyc_status ?? "not_started"}
                      </span>
                    </div>
                    <p
                      className="mt-2 text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Upload or review your identity document on the dedicated
                      KYC page.
                    </p>
                  </div>

                  <Link
                    href="/kyc"
                    className="btn-outline w-full justify-center"
                  >
                    Open KYC page
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                <WalletSetupCard />
              </>
            ) : (
              <div className="card p-6">
                <p className="label-xs mb-2">Investor Access</p>
                <h2
                  className="text-2xl font-black mb-3"
                  style={{ color: "var(--text)" }}
                >
                  No investor checks required
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  KYC and wallet binding are only needed for investor investment
                  and claim flows.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {dialogImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md"
          style={{ background: "rgba(12, 15, 15, 0.55)" }}
          onClick={() => setDialogImage(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDialogImage(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border"
              style={{
                background: "rgba(12, 15, 15, 0.55)",
                borderColor: "rgba(255,255,255,0.12)",
                color: "#fff",
              }}
              aria-label="Close avatar preview"
            >
              <X className="w-4 h-4" />
            </button>
            <div
              className="relative aspect-square w-full"
              style={{ background: "#050606" }}
            >
              <Image
                src={dialogImage.src}
                alt={dialogImage.alt}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
