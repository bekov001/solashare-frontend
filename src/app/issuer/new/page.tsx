"use client";

import { ArrowLeft, FileText, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FileDropInput } from "@/components/FileDropInput";
import { issuerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { uploadAssetDocument } from "@/lib/uploads";
import { formatNumber, formatUSDC } from "@/lib/utils";
import type { DocumentType } from "@/types";

type DraftDocument = {
  id: string;
  file: File;
  type: DocumentType;
  title: string;
  is_public: boolean;
};

const ENERGY_OPTIONS = [
  { value: "solar", label: "Solar" },
  { value: "wind", label: "Wind" },
  { value: "hydro", label: "Hydro" },
  { value: "ev_charging", label: "EV Charging" },
  { value: "other", label: "Other" },
] as const;

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: "technical_passport", label: "Technical Passport" },
  { value: "ownership_doc", label: "Ownership Document" },
  { value: "right_to_income_doc", label: "Right to Income" },
  { value: "financial_model", label: "Financial Model" },
  { value: "photo", label: "Photo / Media" },
  { value: "meter_info", label: "Meter Information" },
  { value: "revenue_report", label: "Revenue Report" },
  { value: "other", label: "Other" },
];

const SHARES_PER_KW = 100;

function inferDocumentType(file: File): DocumentType {
  const name = file.name.toLowerCase();

  if (file.type.startsWith("image/")) {
    return "photo";
  }

  if (name.includes("passport")) {
    return "technical_passport";
  }

  if (name.includes("owner")) {
    return "ownership_doc";
  }

  if (name.includes("income")) {
    return "right_to_income_doc";
  }

  if (name.includes("model")) {
    return "financial_model";
  }

  if (name.includes("meter")) {
    return "meter_info";
  }

  if (name.includes("revenue") || name.includes("report")) {
    return "revenue_report";
  }

  return "other";
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function derivePricing(capacityValue: string, valuationValue: string) {
  const capacity = Number(capacityValue);
  const valuation = Number(valuationValue);

  if (
    !Number.isFinite(capacity) ||
    capacity <= 0 ||
    !Number.isFinite(valuation) ||
    valuation <= 0
  ) {
    return {
      totalShares: null,
      pricePerShare: null,
      targetRaise: null,
    };
  }

  const totalShares = Math.max(100, Math.round(capacity * SHARES_PER_KW));

  return {
    totalShares,
    pricePerShare: valuation / totalShares,
    targetRaise: valuation,
  };
}

export default function NewAssetPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState({
    title: "",
    short_description: "",
    full_description: "",
    energy_type: "solar",
    location_country: "Kazakhstan",
    location_city: "",
    capacity_kw: "",
  });
  const [sale, setSale] = useState({
    valuation_usdc: "",
    minimum_buy_amount_usdc: "",
  });
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DraftDocument[]>([]);
  const coverImagePreview = useMemo(() => {
    if (!coverImageFile?.type.startsWith("image/")) {
      return null;
    }

    return URL.createObjectURL(coverImageFile);
  }, [coverImageFile]);

  useEffect(() => {
    return () => {
      if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview);
      }
    };
  }, [coverImagePreview]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center animate-fade-in">
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          Sign in as an issuer to create assets.
        </p>
        <Link href="/login" className="btn-sol px-8">
          Go to Login
        </Link>
      </div>
    );
  }

  if (user.role !== "issuer") {
    return (
      <div
        className="max-w-xl mx-auto px-6 py-24 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        Access restricted to issuers.
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="max-w-[1080px] mx-auto px-6 py-10 space-y-4 animate-pulse">
        <div className="card h-24" />
        <div className="card h-80" />
      </div>
    );
  }

  const derivedPricing = derivePricing(info.capacity_kw, sale.valuation_usdc);

  function handleFilesSelected(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setDocuments((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        type: inferDocumentType(file),
        title: stripExtension(file.name),
        is_public: file.type.startsWith("image/"),
      })),
    ]);
  }

  function updateDocument(id: string, updates: Partial<Omit<DraftDocument, "id" | "file">>) {
    setDocuments((current) =>
      current.map((document) => (document.id === id ? { ...document, ...updates } : document)),
    );
  }

  function removeDocument(id: string) {
    setDocuments((current) => current.filter((document) => document.id !== id));
  }

  async function submitForm(submitForReview: boolean) {
    if (submitForReview && documents.length === 0) {
      setError("Attach at least one document before sending an asset to review.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let coverImageUrl: string | undefined;

      if (coverImageFile) {
        const uploadedCover = await uploadAssetDocument(coverImageFile);
        coverImageUrl = uploadedCover.file_url;
      }

      const created = await issuerApi.createAsset({
        ...info,
        capacity_kw: Number(info.capacity_kw),
        cover_image_url: coverImageUrl,
      });

      await issuerApi.setSaleTerms(created.asset_id, {
        valuation_usdc: Number(sale.valuation_usdc),
        minimum_buy_amount_usdc: Number(sale.minimum_buy_amount_usdc),
      });

      for (const document of documents) {
        const uploaded = await uploadAssetDocument(document.file);

        await issuerApi.uploadDocument(created.asset_id, {
          type: document.type,
          title: document.title,
          storage_provider: "s3",
          storage_uri: uploaded.file_url,
          content_hash: uploaded.content_hash,
          mime_type: document.file.type || "application/octet-stream",
          is_public: document.is_public,
        });
      }

      if (submitForReview) {
        await issuerApi.submit(created.asset_id);
      }

      router.push(`/issuer/assets/${created.asset_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create asset.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-10 animate-fade-in space-y-8">
      <Link
        href="/issuer"
        className="inline-flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="card space-y-3">
            <p className="label-xs">New Asset</p>
            <div className="space-y-2">
              <h1 className="text-4xl font-black" style={{ color: "var(--text)" }}>
                Create Asset
              </h1>
              <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                One form, one review flow. Fill core metadata, set the asset valuation, and attach
                the supporting files directly here.
              </p>
            </div>
          </div>

          <div className="card space-y-5">
            <div>
              <p className="label-xs mb-2">Asset Basics</p>
              <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>
                Project profile
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="asset-title" className="label-xs mb-2 block">
                  Title
                </label>
                <input
                  id="asset-title"
                  required
                  className="input-new"
                  placeholder="Almaty Solar Farm A"
                  value={info.title}
                  onChange={(event) =>
                    setInfo((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="asset-energy-type" className="label-xs mb-2 block">
                  Energy Type
                </label>
                <select
                  id="asset-energy-type"
                  className="input-new"
                  value={info.energy_type}
                  onChange={(event) =>
                    setInfo((current) => ({
                      ...current,
                      energy_type: event.target.value,
                    }))
                  }
                >
                  {ENERGY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="asset-capacity" className="label-xs mb-2 block">
                  Capacity, kW
                </label>
                <input
                  id="asset-capacity"
                  required
                  type="number"
                  min="1"
                  className="input-new"
                  placeholder="150"
                  value={info.capacity_kw}
                  onChange={(event) =>
                    setInfo((current) => ({
                      ...current,
                      capacity_kw: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label htmlFor="asset-country" className="label-xs mb-2 block">
                  Country
                </label>
                <input
                  id="asset-country"
                  required
                  className="input-new"
                  value={info.location_country}
                  onChange={(event) =>
                    setInfo((current) => ({
                      ...current,
                      location_country: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label htmlFor="asset-city" className="label-xs mb-2 block">
                  City
                </label>
                <input
                  id="asset-city"
                  required
                  className="input-new"
                  placeholder="Almaty"
                  value={info.location_city}
                  onChange={(event) =>
                    setInfo((current) => ({
                      ...current,
                      location_city: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="asset-short-description" className="label-xs mb-2 block">
                  Short Description
                </label>
                <input
                  id="asset-short-description"
                  required
                  className="input-new"
                  placeholder="Yield-bearing asset backed by a grid-connected solar installation"
                  value={info.short_description}
                  onChange={(event) =>
                    setInfo((current) => ({
                      ...current,
                      short_description: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="asset-full-description" className="label-xs mb-2 block">
                  Full Description
                </label>
                <textarea
                  id="asset-full-description"
                  required
                  rows={5}
                  className="input-new resize-none"
                  placeholder="Describe the installation, the legal setup, operating model, and why this asset should pass review."
                  value={info.full_description}
                  onChange={(event) =>
                    setInfo((current) => ({
                      ...current,
                      full_description: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="card space-y-5">
            <div>
              <p className="label-xs mb-2">Sale Setup</p>
              <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>
                Simplified pricing
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                Enter the asset valuation and minimum ticket size. Share count, price per share, and
                raise target are calculated automatically from project capacity.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="asset-valuation" className="label-xs mb-2 block">
                  Asset Valuation, USDC
                </label>
                <input
                  id="asset-valuation"
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  className="input-new"
                  placeholder="100000"
                  value={sale.valuation_usdc}
                  onChange={(event) =>
                    setSale((current) => ({
                      ...current,
                      valuation_usdc: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label htmlFor="asset-min-investment" className="label-xs mb-2 block">
                  Minimum Investment, USDC
                </label>
                <input
                  id="asset-min-investment"
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  className="input-new"
                  placeholder="50"
                  value={sale.minimum_buy_amount_usdc}
                  onChange={(event) =>
                    setSale((current) => ({
                      ...current,
                      minimum_buy_amount_usdc: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Derived Shares",
                  value:
                    derivedPricing.totalShares === null
                      ? "Waiting for inputs"
                      : formatNumber(derivedPricing.totalShares),
                },
                {
                  label: "Price per Share",
                  value:
                    derivedPricing.pricePerShare === null
                      ? "Waiting for inputs"
                      : formatUSDC(derivedPricing.pricePerShare),
                },
                {
                  label: "Raise Target",
                  value:
                    derivedPricing.targetRaise === null
                      ? "Waiting for inputs"
                      : formatUSDC(derivedPricing.targetRaise),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border px-5 py-4"
                  style={{ borderColor: "var(--border)", background: "var(--surface-low)" }}
                >
                  <p className="label-xs mb-2">{item.label}</p>
                  <p className="text-lg font-black" style={{ color: "var(--text)" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-5">
            <div>
              <p className="label-xs mb-2">Asset Cover</p>
              <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>
                Upload the card image
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                This image is used on the marketplace card and the asset page. If you skip it, the
                interface falls back to the generic energy image.
              </p>
            </div>

            <FileDropInput
              accept="image/png,image/jpeg,image/jpg,image/webp"
              buttonLabel="Choose cover image"
              title="Drop cover image here"
              selectedLabel={coverImageFile?.name ?? null}
              description="PNG, JPG or WEBP. The image is uploaded to S3 during submission."
              onFilesSelected={(files) => setCoverImageFile(files[0] ?? null)}
            />

            {coverImagePreview && (
              <div
                className="overflow-hidden rounded-[1.5rem] border"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="relative aspect-[16/9] w-full" style={{ background: "var(--bg)" }}>
                  <Image
                    src={coverImagePreview}
                    alt={coverImageFile?.name ?? "Asset cover preview"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="label-xs mb-2">Documents</p>
                <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>
                  Upload supporting files
                </h2>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  Files are uploaded to S3 during submission. No manual URI or hash entry is
                  needed. If you already have an initial revenue report, attach it here and set
                  the document type to <span className="font-semibold">Revenue Report</span>.
                </p>
              </div>

            </div>

            <FileDropInput
              multiple
              buttonLabel="Add files"
              title="Drop files here or browse"
              description="Select one or several files and classify them before submission. Large asset files up to 50 MB are accepted."
              onFilesSelected={handleFilesSelected}
            />

            {documents.length === 0 ? (
              <div
                className="rounded-[1.5rem] border px-5 py-4 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                No files selected yet.
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-[1.5rem] border p-4"
                    style={{ borderColor: "var(--border)", background: "var(--surface-low)" }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                          <p
                            className="text-sm font-bold truncate"
                            style={{ color: "var(--text)" }}
                          >
                            {document.file.name}
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {document.file.type || "application/octet-stream"} ·{" "}
                          {(document.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        className="p-2 rounded-xl"
                        style={{ color: "var(--text-muted)" }}
                        onClick={() => removeDocument(document.id)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`document-title-${document.id}`}
                          className="label-xs mb-2 block"
                        >
                          Document Title
                        </label>
                        <input
                          id={`document-title-${document.id}`}
                          className="input-new"
                          value={document.title}
                          onChange={(event) =>
                            updateDocument(document.id, { title: event.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`document-type-${document.id}`}
                          className="label-xs mb-2 block"
                        >
                          Document Type
                        </label>
                        <select
                          id={`document-type-${document.id}`}
                          className="input-new"
                          value={document.type}
                          onChange={(event) =>
                            updateDocument(document.id, {
                              type: event.target.value as DocumentType,
                            })
                          }
                        >
                          {DOCUMENT_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <label
                        className="flex items-center gap-3 rounded-[1.25rem] px-4 py-3"
                        style={{ background: "var(--surface)" }}
                      >
                        <input
                          type="checkbox"
                          checked={document.is_public}
                          onChange={(event) =>
                            updateDocument(document.id, {
                              is_public: event.target.checked,
                            })
                          }
                        />
                        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                          Visible on the public asset page
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div
              className="rounded-[1.5rem] px-5 py-4 text-sm font-medium text-red-400"
              style={{ background: "rgba(248,113,113,0.08)" }}
            >
              {error}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="card space-y-4 sticky top-8">
            <div>
              <p className="label-xs mb-2">Submission</p>
              <h2 className="text-2xl font-black" style={{ color: "var(--text)" }}>
                Ready to review
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              {[
                {
                  label: "Capacity",
                  value: info.capacity_kw
                    ? `${formatNumber(Number(info.capacity_kw))} kW`
                    : "Not set",
                },
                {
                  label: "Valuation",
                  value: sale.valuation_usdc ? formatUSDC(Number(sale.valuation_usdc)) : "Not set",
                },
                { label: "Cover", value: coverImageFile ? "Attached" : "Fallback image" },
                { label: "Files", value: `${documents.length}` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  <span className="font-bold" style={{ color: "var(--text)" }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="rounded-[1.5rem] px-4 py-4 text-sm leading-6"
              style={{ background: "var(--surface-low)", color: "var(--text-muted)" }}
            >
              If you send the asset to review now, the current files will be uploaded to S3 and
              attached automatically.
            </div>

            <button
              type="button"
              disabled={loading}
              className="btn-sol w-full justify-center"
              onClick={() => submitForm(true)}
            >
              {loading ? "Submitting..." : "Create and Send to Review"}
            </button>

            <button
              type="button"
              disabled={loading}
              className="btn-outline w-full justify-center"
              onClick={() => submitForm(false)}
            >
              {loading ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
