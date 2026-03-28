// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = "investor" | "issuer" | "admin";

export type AssetStatus =
  | "draft"
  | "pending_review"
  | "verified"
  | "active_sale"
  | "funded"
  | "frozen"
  | "closed";

export type EnergyType = "solar" | "wind" | "hydro" | "ev_charging" | "other";

export type DocumentType =
  | "ownership_doc"
  | "right_to_income_doc"
  | "technical_passport"
  | "photo"
  | "meter_info"
  | "financial_model"
  | "revenue_report"
  | "other";

export type StorageProvider = "arweave" | "ipfs" | "s3";

export type RevenueStatus = "draft" | "posted" | "settled" | "flagged";

export type VerificationOutcome = "approved" | "rejected" | "needs_changes";

export type TransactionKind =
  | "investment"
  | "claim"
  | "revenue_post"
  | "wallet_link";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  display_name: string;
  role: UserRole;
  wallet_address?: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export interface AssetListItem {
  id: string;
  title: string;
  energy_type: EnergyType;
  capacity_kw: number;
  status: AssetStatus;
  price_per_share_usdc: number;
  expected_annual_yield_percent: number;
}

export interface AssetLocation {
  country: string;
  region?: string;
  city: string;
}

export interface AssetIssuer {
  id: string;
  display_name: string;
}

export interface SaleTerms {
  valuation_usdc: string;
  total_shares: number;
  price_per_share_usdc: string;
  minimum_buy_amount_usdc: string;
  target_raise_usdc: string;
  sale_status: "live" | "ended" | "upcoming";
}

export interface AssetDocument {
  id: string;
  type: DocumentType;
  title: string;
  storage_provider: StorageProvider;
  storage_uri: string;
  content_hash: string;
  is_public: boolean;
}

export interface RevenueSummary {
  total_epochs: number;
  last_posted_epoch: number;
}

export interface OnchainRefs {
  onchain_asset_pubkey: string | null;
  share_mint_pubkey: string | null;
  vault_pubkey: string | null;
}

export interface AssetDetail {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  energy_type: EnergyType;
  status: AssetStatus;
  location: AssetLocation;
  capacity_kw: number;
  currency: string;
  expected_annual_yield_percent: number;
  issuer: AssetIssuer;
  sale_terms: SaleTerms;
  public_documents: AssetDocument[];
  revenue_summary: RevenueSummary;
  onchain_refs: OnchainRefs;
}

// ─── Revenue ──────────────────────────────────────────────────────────────────

export interface RevenueEpoch {
  id: string;
  epoch_number: number;
  period_start: string;
  period_end: string;
  gross_revenue_usdc: number;
  net_revenue_usdc: number;
  distributable_revenue_usdc: number;
  report_uri: string;
  posting_status: RevenueStatus;
}

// ─── Holders ──────────────────────────────────────────────────────────────────

export interface HoldersSummary {
  total_investors: number;
  funded_percent: number;
  total_distributed_usdc: number;
  total_claimed_usdc: number;
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface PortfolioPosition {
  asset_id: string;
  title: string;
  shares_amount: number;
  shares_percentage: number;
  unclaimed_usdc: number;
}

export interface Portfolio {
  total_invested_usdc: number;
  total_claimed_usdc: number;
  total_unclaimed_usdc: number;
  positions: PortfolioPosition[];
}

// ─── Claims ───────────────────────────────────────────────────────────────────

export interface Claim {
  claim_id: string;
  asset_id: string;
  revenue_epoch_id: string;
  claim_amount_usdc: number;
  status: "pending" | "confirmed" | "failed";
  transaction_signature: string;
}

// ─── Investment ───────────────────────────────────────────────────────────────

export interface InvestmentQuote {
  shares_to_receive: number;
  price_per_share_usdc: number;
  fees_usdc: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actor_user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  created_at: string;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface AssetFilters {
  status?: AssetStatus;
  energy_type?: EnergyType;
  page?: number;
  limit?: number;
  sort?: "newest" | "yield_desc" | "price_asc";
}
