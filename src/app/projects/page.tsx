import { ProjectCard } from "@/components/project-card";
import { ProjectCategoryNav } from "@/components/project-category-nav";
import { SimpleSearchBox } from "@/components/simple-search-box";
import { SiteTopNav } from "@/components/site-top-nav";
import { getCategoryCounts, sortDirectoryProjects, type DirectoryProject } from "@/lib/project-directory";
import { prisma } from "@/lib/prisma";
import { listPublicProjects } from "@/lib/public-projects";
import { buildSidebarCategories } from "@/lib/sidebar-categories";
import { resolveSidebarBrand } from "@/lib/site-brand";
import { createSiteSettingsService } from "@/lib/site-settings-service";

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
    <main className="app-shell pb-12">
      <SiteTopNav activeHref="/projects" brand={brand} />

      <section className="app-container mt-4 space-y-4">
        <header className="ui-card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">Project directory</p>
              <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[color:var(--text)]">全部项目</h1>
              <p className="mt-2 text-[13px] font-medium text-[color:var(--text-mute)]">
                浏览 HyperEVM 生态项目、协议、钱包、基础设施和 HIP 实验。
              </p>
            </div>
            <SimpleSearchBox action="/projects" defaultValue={query} maxWidthClassName="w-full max-w-[390px]" placeholder="搜索项目名称" />
          </div>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <ProjectCategoryNav categories={sidebarCategories} totalCount={allProjects.length} />

          {projects.length > 0 ? (
            <ul className="grid auto-rows-max items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </ul>
          ) : (
            <section className="ui-card border-dashed p-10 text-center text-sm font-medium text-[color:var(--text-mute)]">
            暂无可展示项目。
          </section>
          )}
        </div>
      </section>
    </main>
  );
}
