const DEFAULT_LOGO_PATH = "/images/logo-placeholder.svg";

export function generateProjectSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function resolveProjectLogo(params: {
  logoFile?: string | null;
  logoUrl?: string | null;
}): string {
  if (params.logoFile && params.logoFile.trim()) {
    const logoFile = params.logoFile.trim();
    if (logoFile.startsWith("/uploads/logos/") || logoFile.startsWith("/uploads/")) {
      return logoFile;
    }
  }

  if (params.logoUrl && params.logoUrl.trim()) {
    return params.logoUrl.trim();
  }

  return DEFAULT_LOGO_PATH;
}

export function normalizeManualSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
