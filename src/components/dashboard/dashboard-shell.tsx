import { SiteSidebar } from "@/components/site-sidebar";
import { getCategoryCounts, type DirectoryProject } from "@/lib/project-directory";
import { prisma } from "@/lib/prisma";
import { listPublicProjects } from "@/lib/public-projects";
import { resolveSidebarBrand } from "@/lib/site-brand";
import { createSiteSettingsService } from "@/lib/site-settings-service";
import { buildSidebarCategories } from "@/lib/sidebar-categories";
import type { ReactNode } from "react";

type DashboardShellProps = {
  activeHref: string;
  children: ReactNode;
};

export async function DashboardShell({ activeHref, children }: DashboardShellProps) {
  const dbProjects = await listPublicProjects();

  const allProjects: DirectoryProject[] = dbProjects.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    category: project.category ?? project.categories[0] ?? "Infra",
    categories: project.categories,
    status: project.status,
    shortDescription: project.shortDescription,
    logoFile: project.logoFile,
    logoUrl: project.logoUrl,
    websiteUrl: project.websiteUrl,
    twitterUrl: project.twitterUrl,
    discordUrl: project.discordUrl,
    docsUrl: project.docsUrl,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }));

  const categoryCounts = getCategoryCounts(allProjects);
  const sidebarCategories = buildSidebarCategories(categoryCounts);
  const siteSettings = await createSiteSettingsService(prisma).getSettings();
  const brand = resolveSidebarBrand({
    siteName: siteSettings.siteName,
    sidebarLogoFile: siteSettings.sidebarLogoFile ?? null,
    sidebarLogoUrl: siteSettings.sidebarLogoUrl ?? null,
  });

  return (
    <main className="min-h-screen bg-[#eefaf6] md:flex">
      <SiteSidebar
        activeDashboardHref={activeHref}
        activeCategorySlug={null}
        activeAll={false}
        brand={brand}
        categories={sidebarCategories}
        totalCount={allProjects.length}
      />

      <section className="flex-1 p-4 sm:p-6">{children}</section>
    </main>
  );
}

