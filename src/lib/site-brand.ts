const DEFAULT_SITE_NAME = "HyperEVM Hub";
const DEFAULT_LOGO = "/sidebar-logo.png";

export function resolveSidebarBrand(input: {
  siteName: string | null;
  sidebarLogoFile: string | null;
  sidebarLogoUrl: string | null;
}) {
  const logoSrc = input.sidebarLogoFile?.trim()
    ? input.sidebarLogoFile.trim()
    : input.sidebarLogoUrl?.trim()
      ? input.sidebarLogoUrl.trim()
      : DEFAULT_LOGO;

  return {
    siteName: input.siteName?.trim() || DEFAULT_SITE_NAME,
    logoSrc,
  };
}
