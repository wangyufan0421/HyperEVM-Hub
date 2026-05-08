import type { PrismaClient } from "@prisma/client";

type SiteSettingsRepo = Pick<PrismaClient, "siteSettings">;

export type SiteSettingsInput = {
  siteName: string;
  siteDescription: string;
  seoTitle: string;
  seoDescription: string;
  sidebarLogoFile?: string | null;
  sidebarLogoUrl?: string | null;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsInput = {
  siteName: "HyperEVM Hub",
  siteDescription: "HyperEVM 生态项目导航与研究平台",
  seoTitle: "HyperEVM Hub",
  seoDescription: "HyperEVM 生态项目导航与研究平台",
  sidebarLogoFile: null,
  sidebarLogoUrl: null,
};

export function createSiteSettingsService(repo: SiteSettingsRepo) {
  return {
    async getSettings() {
      const row = await repo.siteSettings.findFirst();
      if (!row) return DEFAULT_SITE_SETTINGS;

      return {
        siteName: row.siteName,
        siteDescription: row.siteDescription,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        sidebarLogoFile: row.sidebarLogoFile,
        sidebarLogoUrl: row.sidebarLogoUrl,
      };
    },

    async updateSettings(input: SiteSettingsInput) {
      const payload = {
        siteName: input.siteName.trim() || DEFAULT_SITE_SETTINGS.siteName,
        siteDescription: input.siteDescription.trim() || DEFAULT_SITE_SETTINGS.siteDescription,
        seoTitle: input.seoTitle.trim() || DEFAULT_SITE_SETTINGS.seoTitle,
        seoDescription: input.seoDescription.trim() || DEFAULT_SITE_SETTINGS.seoDescription,
        sidebarLogoFile: input.sidebarLogoFile?.trim() || null,
        sidebarLogoUrl: input.sidebarLogoUrl?.trim() || null,
      };

      await repo.siteSettings.upsert({
        where: { id: "default-site-settings" },
        create: { id: "default-site-settings", ...payload },
        update: payload,
      });

      return payload;
    },
  };
}
