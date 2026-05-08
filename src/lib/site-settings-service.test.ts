import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSiteSettingsService } from "./site-settings-service";

function makeRepo() {
  let row: Record<string, unknown> | null = null;

  return {
    siteSettings: {
      findFirst: async () => row,
      upsert: async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
        row = row ? { ...row, ...update } : { id: "s_1", ...create };
        return row;
      },
    },
  };
}

describe("site settings service", () => {
  it("无配置记录时返回默认值", async () => {
    const service = createSiteSettingsService(makeRepo() as never);
    const settings = await service.getSettings();

    assert.equal(settings.siteName, "HyperEVM Hub");
    assert.equal(settings.sidebarLogoFile, null);
    assert.equal(settings.sidebarLogoUrl, null);
  });

  it("保存后可读到 sidebar logo 字段", async () => {
    const service = createSiteSettingsService(makeRepo() as never);

    await service.updateSettings({
      siteName: "My Hub",
      siteDescription: "Desc",
      seoTitle: "SEO",
      seoDescription: "SEO Desc",
      sidebarLogoFile: "/uploads/site/sidebar-logo-1.svg",
      sidebarLogoUrl: "https://cdn.example.com/logo.svg",
    });

    const settings = await service.getSettings();
    assert.equal(settings.siteName, "My Hub");
    assert.equal(settings.sidebarLogoFile, "/uploads/site/sidebar-logo-1.svg");
    assert.equal(settings.sidebarLogoUrl, "https://cdn.example.com/logo.svg");
  });
});
