import { SiteTopNav } from "@/components/site-top-nav";
import { prisma } from "@/lib/prisma";
import { resolveSidebarBrand } from "@/lib/site-brand";
import { createSiteSettingsService } from "@/lib/site-settings-service";
import type { ReactNode } from "react";

type DashboardShellProps = {
  activeHref: string;
  children: ReactNode;
};

export async function DashboardShell({ activeHref, children }: DashboardShellProps) {
  const siteSettings = await createSiteSettingsService(prisma).getSettings();
  const brand = resolveSidebarBrand({
    siteName: siteSettings.siteName,
    sidebarLogoFile: siteSettings.sidebarLogoFile ?? null,
    sidebarLogoUrl: siteSettings.sidebarLogoUrl ?? null,
  });

  return (
    <main className="app-shell pb-12">
      <SiteTopNav activeHref={activeHref} brand={brand} />

      <section className="app-container mt-4">
        <div className="mx-auto w-full max-w-[1320px]">{children}</div>
      </section>
    </main>
  );
}
