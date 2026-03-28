import type {
  AssetDetail,
  AssetDocument,
  AssetFilters,
  AssetListItem,
  AuditLog,
  AuthResponse,
  Claim,
  HoldersSummary,
  InvestmentQuote,
  Pagination,
  Portfolio,
  RevenueEpoch,
  VerificationOutcome,
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const V1 = `${BASE}/api/v1`;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("solashare_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${V1}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  telegram: (telegram_init_data: string): Promise<AuthResponse> =>
    request("/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ telegram_init_data }),
    }),

  linkWallet: (wallet_address: string, signed_message: string) =>
    request<{ success: boolean }>(
      "/auth/wallet/link",
      { method: "POST", body: JSON.stringify({ wallet_address, signed_message }) },
      true
    ),
};

// ─── Assets ───────────────────────────────────────────────────────────────────

export const assetsApi = {
  list: (filters: AssetFilters = {}): Promise<{ items: AssetListItem[]; pagination: Pagination }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, String(v));
    });
    const qs = params.toString();
    return request(`/assets${qs ? `?${qs}` : ""}`);
  },

  get: (id: string): Promise<AssetDetail> => request(`/assets/${id}`),

  revenue: (id: string): Promise<{ items: RevenueEpoch[] }> =>
    request(`/assets/${id}/revenue`),

  documents: (id: string): Promise<{ items: AssetDocument[] }> =>
    request(`/assets/${id}/documents`),

  holdersSummary: (id: string): Promise<HoldersSummary> =>
    request(`/assets/${id}/holders-summary`),
};

// ─── Issuer ───────────────────────────────────────────────────────────────────

export const issuerApi = {
  createAsset: (data: {
    title: string;
    short_description: string;
    full_description: string;
    energy_type: string;
    location_country: string;
    location_city: string;
    capacity_kw: number;
  }): Promise<{ asset_id: string; status: string }> =>
    request("/issuer/assets", { method: "POST", body: JSON.stringify(data) }, true),

  updateAsset: (id: string, data: Record<string, unknown>) =>
    request<{ asset_id: string; status: string }>(
      `/issuer/assets/${id}`,
      { method: "PATCH", body: JSON.stringify(data) },
      true
    ),

  uploadDocument: (
    id: string,
    data: { type: string; title: string; storage_provider: string; storage_uri: string; content_hash: string }
  ) =>
    request<{ document_id: string; success: boolean }>(
      `/issuer/assets/${id}/documents`,
      { method: "POST", body: JSON.stringify(data) },
      true
    ),

  setSaleTerms: (
    id: string,
    data: {
      valuation_usdc: number;
      total_shares: number;
      price_per_share_usdc: number;
      minimum_buy_amount_usdc: number;
      target_raise_usdc: number;
    }
  ) =>
    request<{ success: boolean; asset_id: string }>(
      `/issuer/assets/${id}/sale-terms`,
      { method: "POST", body: JSON.stringify(data) },
      true
    ),

  submit: (id: string) =>
    request<{ success: boolean; message: string; next_status: string }>(
      `/issuer/assets/${id}/submit`,
      { method: "POST" },
      true
    ),

  createRevenueEpoch: (
    id: string,
    data: {
      epoch_number: number;
      period_start: string;
      period_end: string;
      gross_revenue_usdc: number;
      net_revenue_usdc: number;
      distributable_revenue_usdc: number;
      report_uri: string;
      report_hash: string;
      source_type: string;
    }
  ) =>
    request<{ success: boolean; revenue_epoch_id: string }>(
      `/issuer/assets/${id}/revenue-epochs`,
      { method: "POST", body: JSON.stringify(data) },
      true
    ),

  postRevenue: (assetId: string, epochId: string) =>
    request<{ success: boolean; transaction_payload: unknown; message: string }>(
      `/issuer/assets/${assetId}/revenue-epochs/${epochId}/post`,
      { method: "POST" },
      true
    ),
};

// ─── Investor ─────────────────────────────────────────────────────────────────

export const investorApi = {
  portfolio: (): Promise<Portfolio> => request("/me/portfolio", {}, true),

  claims: (): Promise<{ items: Claim[] }> => request("/me/claims", {}, true),

  quote: (asset_id: string, amount_usdc: number): Promise<InvestmentQuote> =>
    request(
      "/investments/quote",
      { method: "POST", body: JSON.stringify({ asset_id, amount_usdc }) },
      true
    ),

  prepare: (asset_id: string, amount_usdc: number) =>
    request<{ success: boolean; signing_payload: unknown; message: string }>(
      "/investments/prepare",
      { method: "POST", body: JSON.stringify({ asset_id, amount_usdc }) },
      true
    ),

  prepareClaim: (asset_id: string, revenue_epoch_id: string) =>
    request<{ success: boolean; signing_payload: unknown; message: string }>(
      "/claims/prepare",
      { method: "POST", body: JSON.stringify({ asset_id, revenue_epoch_id }) },
      true
    ),

  confirmTransaction: (transaction_signature: string, kind: string) =>
    request<{ success: boolean; sync_status: string }>(
      "/transactions/confirm",
      { method: "POST", body: JSON.stringify({ transaction_signature, kind }) },
      true
    ),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  verify: (id: string, outcome: VerificationOutcome, reason: string) =>
    request<{ success: boolean; asset_id: string; resulting_status: string }>(
      `/admin/assets/${id}/verify`,
      { method: "POST", body: JSON.stringify({ outcome, reason }) },
      true
    ),

  freeze: (id: string) =>
    request<{ success: boolean; asset_id: string; resulting_status: string }>(
      `/admin/assets/${id}/freeze`,
      { method: "POST" },
      true
    ),

  close: (id: string) =>
    request<{ success: boolean; asset_id: string; resulting_status: string }>(
      `/admin/assets/${id}/close`,
      { method: "POST" },
      true
    ),

  auditLogs: (params: { entity_type?: string; entity_id?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return request<{ items: AuditLog[]; pagination: Pagination }>(
      `/admin/audit-logs${qs ? `?${qs}` : ""}`,
      {},
      true
    );
  },
};
