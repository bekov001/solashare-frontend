import { VersionedTransaction } from "@solana/web3.js";
import { authApi, investorApi } from "@/lib/api";
import type { PreparedTransactionResponse, TransactionKind } from "@/types";

type SignMessageResult = Uint8Array | { signature: Uint8Array };
type SignAndSendResult = { signature: string } | string;

export interface BrowserWalletProvider {
  isPhantom?: boolean;
  isConnected?: boolean;
  publicKey?: { toString(): string };
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  signMessage: (
    message: Uint8Array,
    display?: "utf8" | "hex",
  ) => Promise<SignMessageResult>;
  signAndSendTransaction: (
    transaction: VersionedTransaction,
    options?: { skipPreflight?: boolean; maxRetries?: number },
  ) => Promise<SignAndSendResult>;
}

declare global {
  interface Window {
    solana?: BrowserWalletProvider;
    phantom?: {
      solana?: BrowserWalletProvider;
    };
  }
}

function getProvider(): BrowserWalletProvider {
  if (typeof window === "undefined") {
    throw new Error("Wallet is only available in the browser.");
  }

  const provider = window.phantom?.solana ?? window.solana;

  if (!provider) {
    throw new Error(
      "No Solana wallet provider found. Install Phantom or a compatible wallet.",
    );
  }

  return provider;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function normalizeSignature(result: SignAndSendResult): string {
  return typeof result === "string" ? result : result.signature;
}

function normalizeSignedMessage(result: SignMessageResult): Uint8Array {
  return result instanceof Uint8Array ? result : result.signature;
}

export async function connectWallet(): Promise<string> {
  const provider = getProvider();
  const response = await provider.connect();
  return response.publicKey.toString();
}

export async function ensureWalletBound(): Promise<string> {
  const provider = getProvider();
  const walletAddress =
    provider.publicKey?.toString() ?? (await connectWallet());
  const challenge = await authApi.walletChallenge(walletAddress);
  const encodedChallenge = new TextEncoder().encode(challenge.challenge);
  const signed = await provider.signMessage(encodedChallenge, "utf8");
  const signature = bytesToBase64(normalizeSignedMessage(signed));
  const result = await authApi.walletVerify(
    walletAddress,
    challenge.challenge,
    signature,
  );

  if (!result.success || !result.verified) {
    throw new Error(result.error ?? "Wallet verification failed.");
  }

  return walletAddress;
}

export async function sendPreparedTransaction(
  payload: PreparedTransactionResponse,
  kind: TransactionKind,
): Promise<{ signature: string; sync_status: string }> {
  const provider = getProvider();
  await connectWallet();
  const transaction = VersionedTransaction.deserialize(
    base64ToBytes(payload.serialized_tx),
  );
  const sendResult = await provider.signAndSendTransaction(transaction, {
    skipPreflight: false,
    maxRetries: 3,
  });
  const signature = normalizeSignature(sendResult);
  const confirmation = await investorApi.confirmTransaction(
    signature,
    kind,
    payload.operation_id,
  );

  return {
    signature,
    sync_status: confirmation.sync_status,
  };
}
