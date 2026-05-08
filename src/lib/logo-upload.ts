import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateProjectSlug } from "./project-rules";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "svg"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
const LOGO_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logos");
const SITE_LOGO_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "site");

export function buildLogoFilePath(params: { slug: string; originalName: string; now?: number }): string {
  const timestamp = params.now ?? Date.now();
  const extension = getSafeExtension(params.originalName);
  const safeSlug = generateProjectSlug(params.slug) || "project";

  return `/uploads/logos/${safeSlug}-${timestamp}.${extension}`;
}

export function validateLogoFile(file: { size: number; type: string; name: string }) {
  const extension = getSafeExtension(file.name);

  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false as const, error: "仅支持 png、jpg、jpeg、webp、svg 格式图片" };
  }

  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false as const, error: "图片大小不能超过 2MB" };
  }

  return { ok: true as const };
}

export function shouldKeepExistingLogoFile(file: { size: number; type: string; name: string }) {
  return file.size === 0;
}

export async function saveUploadedLogoFile(params: { file: File; slugSource: string }) {
  const result = validateLogoFile({ size: params.file.size, type: params.file.type, name: params.file.name });
  if (!result.ok) {
    throw new Error(result.error);
  }

  const logoPath = buildLogoFilePath({
    slug: params.slugSource,
    originalName: params.file.name,
  });

  await mkdir(LOGO_UPLOAD_DIR, { recursive: true });
  const diskPath = path.join(process.cwd(), "public", logoPath.replace(/^\//, ""));
  const buffer = Buffer.from(await params.file.arrayBuffer());
  await writeFile(diskPath, buffer);
  return logoPath;
}

export async function saveUploadedSiteLogoFile(params: { file: File; baseName?: string }) {
  const result = validateLogoFile({ size: params.file.size, type: params.file.type, name: params.file.name });
  if (!result.ok) {
    throw new Error(result.error);
  }

  const timestamp = Date.now();
  const extension = getSafeExtension(params.file.name);
  const safeBaseName = generateProjectSlug(params.baseName ?? "sidebar-logo") || "sidebar-logo";
  const logoPath = `/uploads/site/${safeBaseName}-${timestamp}.${extension}`;

  await mkdir(SITE_LOGO_UPLOAD_DIR, { recursive: true });
  const diskPath = path.join(process.cwd(), "public", logoPath.replace(/^\//, ""));
  const buffer = Buffer.from(await params.file.arrayBuffer());
  await writeFile(diskPath, buffer);
  return logoPath;
}

function getSafeExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ext.replace(/[^a-z0-9]/g, "");
}
