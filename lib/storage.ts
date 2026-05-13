/**
 * File upload & storage via multiple providers.
 *
 * Supports three backends (user picks via env var):
 *   1. Uploadthing — easiest, free tier 2GB
 *   2. Cloudflare R2 — cheapest at scale, S3-compatible
 *   3. Vercel Blob — simplest if deploying to Vercel
 *
 * Usage in generated apps:
 *   import { uploadFile, getFileUrl, deleteFile } from "@/lib/storage";
 */

// ── Provider detection ────────────────────────────────────────────

type StorageProvider = "uploadthing" | "r2" | "vercel-blob" | "local";

function detectProvider(): StorageProvider {
  if (process.env.UPLOADTHING_SECRET) return "uploadthing";
  if (process.env.R2_ACCESS_KEY_ID) return "r2";
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel-blob";
  return "local";
}

// Helper: convert File | Buffer to a plain Buffer for safe use as BlobPart / body
async function toBuffer(file: File | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(file)) return file;
  const ab = await (file as File).arrayBuffer();
  return Buffer.from(ab);
}

// ── Unified interface ─────────────────────────────────────────────

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  name: string;
}

export async function uploadFile(
  file: File | Buffer,
  filename: string,
  options?: { folder?: string; contentType?: string },
): Promise<UploadResult> {
  const provider = detectProvider();
  switch (provider) {
    case "uploadthing":  return uploadToUploadthing(file, filename, options);
    case "r2":           return uploadToR2(file, filename, options);
    case "vercel-blob":  return uploadToVercelBlob(file, filename, options);
    case "local":        return uploadToLocal(file, filename, options);
  }
}

export async function getFileUrl(key: string): Promise<string> {
  const provider = detectProvider();
  switch (provider) {
    case "uploadthing":  return `https://utfs.io/f/${key}`;
    case "r2":           return `${process.env.R2_PUBLIC_URL || ""}/${key}`;
    case "vercel-blob":  return key;
    case "local":        return `/uploads/${key}`;
  }
}

export async function deleteFile(key: string): Promise<void> {
  const provider = detectProvider();
  switch (provider) {
    case "r2":          await deleteFromR2(key); break;
    case "vercel-blob": await deleteFromVercelBlob(key); break;
  }
}

// ── Uploadthing ───────────────────────────────────────────────────

async function uploadToUploadthing(
  file: File | Buffer,
  filename: string,
  options?: { folder?: string; contentType?: string },
): Promise<UploadResult> {
  const secret = process.env.UPLOADTHING_SECRET;
  if (!secret) throw new Error("UPLOADTHING_SECRET not set");

  const buf = await toBuffer(file);
  const blob = new Blob([buf as unknown as ArrayBuffer], {
    type: options?.contentType || "application/octet-stream",
  });

  const formData = new FormData();
  formData.append("file", blob, filename);

  const resp = await fetch("https://uploadthing.com/api/uploadFiles", {
    method: "POST",
    headers: { "x-uploadthing-api-key": secret },
    body: formData,
  });

  if (!resp.ok) throw new Error(`Uploadthing error: ${resp.status}`);
  const data = await resp.json();
  const result = data[0] || data;

  return {
    url: result.url || result.fileUrl,
    key: result.key || result.fileKey,
    size: result.size || 0,
    name: filename,
  };
}

// ── Cloudflare R2 (S3-compatible) ─────────────────────────────────

async function uploadToR2(
  file: File | Buffer,
  filename: string,
  options?: { folder?: string; contentType?: string },
): Promise<UploadResult> {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const endpoint = process.env.R2_ENDPOINT;

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    throw new Error("R2 env vars not set");
  }

  const key = options?.folder ? `${options.folder}/${filename}` : filename;
  const body = await toBuffer(file);

  const url = `${endpoint}/${bucket}/${key}`;
  const resp = await fetch(url, {
    method: "PUT",
    headers: { "content-type": options?.contentType || "application/octet-stream" },
    body,
  });

  if (!resp.ok) throw new Error(`R2 upload failed: ${resp.status}`);

  return {
    url: `${process.env.R2_PUBLIC_URL || endpoint}/${key}`,
    key,
    size: body.length,
    name: filename,
  };
}

async function deleteFromR2(key: string): Promise<void> {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET_NAME;
  await fetch(`${endpoint}/${bucket}/${key}`, { method: "DELETE" });
}

// ── Vercel Blob ───────────────────────────────────────────────────

async function uploadToVercelBlob(
  file: File | Buffer,
  filename: string,
  options?: { folder?: string; contentType?: string },
): Promise<UploadResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN not set");

  const body = await toBuffer(file);
  const pathname = options?.folder ? `${options.folder}/${filename}` : filename;

  const resp = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "x-content-type": options?.contentType || "application/octet-stream",
    },
    body,
  });

  if (!resp.ok) throw new Error(`Vercel Blob error: ${resp.status}`);
  const data = await resp.json();

  return {
    url: data.url,
    key: data.pathname || pathname,
    size: body.length,
    name: filename,
  };
}

async function deleteFromVercelBlob(key: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  await fetch(`https://blob.vercel-storage.com?url=${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
}

// ── Local filesystem (dev fallback) ───────────────────────────────

async function uploadToLocal(
  file: File | Buffer,
  filename: string,
  options?: { folder?: string },
): Promise<UploadResult> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const dir = path.join(process.cwd(), "public", "uploads", options?.folder || "");
  await fs.mkdir(dir, { recursive: true });

  const body = await toBuffer(file);
  const filepath = path.join(dir, filename);
  await fs.writeFile(filepath, body);

  const key = options?.folder ? `${options.folder}/${filename}` : filename;
  return {
    url: `/uploads/${key}`,
    key,
    size: body.length,
    name: filename,
  };
}
