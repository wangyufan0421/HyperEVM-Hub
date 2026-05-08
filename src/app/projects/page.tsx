import { getCategoryCounts, sortDirectoryProjects, type DirectoryProject } from "@/lib/project-directory";
import { listPublicProjects } from "@/lib/public-projects";
import { prisma } from "@/lib/prisma";
import { resolveSidebarBrand } from "@/lib/site-brand";
import { createSiteSettingsService } from "@/lib/site-settings-service";
import { buildSidebarCategories } from "@/lib/sidebar-categories";
import { ProjectCard } from "@/components/project-card";
import { SimpleSearchBox } from "@/components/simple-search-box";
import { SiteSidebar } from "@/components/site-sidebar";

export const dynamic = "force-dynamic";

type ProjectsPageProps = {
  searchParams?: Promise<{ query?: string }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const query = (await searchParams)?.query?.trim().toLowerCase() ?? "";
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

  const projects = sortDirectoryProjects(
    allProjects.filter((project) => {
      if (!query) return true;
      return (
        project.name.toLowerCase().includes(query) ||
        project.shortDescription.toLowerCase().includes(query) ||
        project.categories.some((category) => category.toLowerCase().includes(query))
      );
    }),
    "name-asc",
  );

  const categoryCounts = getCategoryCounts(allProjects);
  const sidebarCategories = buildSidebarCategories(categoryCounts);
  const siteSettings = await createSiteSettingsService(prisma).getSettings();
  const brand = resolveSidebarBrand({
    siteName: siteSettings.siteName,
    sidebarLogoFile: siteSettings.sidebarLogoFile ?? null,
    sidebarLogoUrl: siteSettings.sidebarLogoUrl ?? null,
  });

  return (
    <main className="min-h-screen bg-zinc-50 md:flex">
      <SiteSidebar activeCategorySlug={null} activeAll={true} brand={brand} categories={sidebarCategories} totalCount={allProjects.length} />

      <section className="flex-1 space-y-4 p-4 sm:p-6">
        <header className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
          <h1 className="text-lg font-semibold text-zinc-900">全部项目</h1>
          <SimpleSearchBox action="/projects" defaultValue={query} maxWidthClassName="max-w-[360px]" placeholder="搜索项目名称" />
        </header>

        {projects.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </ul>
        ) : (
          <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
            暂无可展示项目。
          </section>
        )}
      </section>
    </main>
  );
}
