"use client";

import { uploadsApi } from "@/lib/api";

async function uploadPrivateFile(
  purpose: "kyc_document" | "avatar_image",
  file: File,
) {
  const contentType = file.type || "application/octet-stream";
  const presigned = await uploadsApi.presign(
    purpose,
    file.name,
    contentType,
    file.size,
  );

  const response = await fetch(presigned.upload_url, {
    method: presigned.upload_method,
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: { message: "Failed to upload KYC document." } }));
    throw new Error(error?.error?.message ?? "Failed to upload KYC document.");
  }

  return (await response.json()) as {
    success: true;
    file_url: string;
    content_hash: string;
  };
}

export function uploadKycDocument(file: File) {
  return uploadPrivateFile("kyc_document", file);
}

export function uploadAvatarImage(file: File) {
  return uploadPrivateFile("avatar_image", file);
}
