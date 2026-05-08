import { ProjectCard } from "@/components/project-card";
import { SiteSidebar } from "@/components/site-sidebar";
import { getCategoryCounts, type DirectoryProject } from "@/lib/project-directory";
import { prisma } from "@/lib/prisma";
import { listPublicProjects } from "@/lib/public-projects";
import { buildSidebarCategories } from "@/lib/sidebar-categories";
import { resolveSidebarBrand } from "@/lib/site-brand";
import { createSiteSettingsService } from "@/lib/site-settings-service";
import Link from "next/link";

export const dynamic = "force-dynamic";

function toDirectoryProject(project: Awaited<ReturnType<typeof listPublicProjects>>[number]): DirectoryProject {
  return {
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
  };
}

export default async function Home() {
  const dbProjects = await listPublicProjects();
  const projects = dbProjects.map(toDirectoryProject);
  const featuredProjects = dbProjects
    .filter((project) => project.isFeatured)
    .sort((a, b) => (a.featuredOrder ?? 9999) - (b.featuredOrder ?? 9999) || a.name.localeCompare(b.name))
    .slice(0, 8)
    .map(toDirectoryProject);

  const categoryCounts = getCategoryCounts(projects);
  const sidebarCategories = buildSidebarCategories(categoryCounts);
  const siteSettings = await createSiteSettingsService(prisma).getSettings();
  const brand = resolveSidebarBrand({
    siteName: siteSettings.siteName,
    sidebarLogoFile: siteSettings.sidebarLogoFile ?? null,
    sidebarLogoUrl: siteSettings.sidebarLogoUrl ?? null,
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fffc_0%,#eefbf8_100%)] text-[#072b28] md:flex">
      <SiteSidebar
        activeAll={false}
        activeCategorySlug={null}
        brand={brand}
        categories={sidebarCategories}
        totalCount={projects.length}
      />

      <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-7">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form action="/projects" className="w-full max-w-[420px]" method="get">
            <input
              className="h-11 w-full rounded-full border border-[#06393424] bg-white/90 px-5 text-[14px] font-semibold text-[#072b28] shadow-[0_10px_24px_rgba(9,185,156,0.06)] outline-none transition focus:border-[#09b99c8c] focus:shadow-[0_0_0_4px_rgba(142,245,220,0.26)]"
              name="query"
              placeholder="搜索项目名称，回车进入项目页"
              type="search"
            />
          </form>

          <div className="flex flex-wrap gap-2 text-[13px] font-bold text-[#335650]">
            <span className="rounded-full border border-[#06393424] bg-white/70 px-3 py-2">
              已收录 {projects.length} 个项目
            </span>
            <span className="rounded-full border border-[#06393424] bg-white/70 px-3 py-2">
              覆盖 {sidebarCategories.length} 个生态分类
            </span>
          </div>
        </div>

        <section
          className="relative min-h-[470px] overflow-hidden rounded-[30px] border border-[#09b99c38] bg-cover bg-center shadow-[0_26px_80px_rgba(0,108,116,0.18),inset_0_0_0_1px_rgba(255,255,255,0.45)]"
          style={{ backgroundImage: "url('/hyper-map.png')" }}
        >
          <div className="flex min-h-[470px] w-full items-center px-7 py-8 sm:px-12">
            <div className="w-full max-w-[600px] rounded-[28px] border border-[#09b99c33] bg-[#f6fffb]/85 px-8 py-10 shadow-[0_22px_70px_rgba(4,65,58,0.18),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-md sm:px-11 sm:py-11">
              <div className="mb-4 w-fit rounded-full border border-[#09b99c40] bg-white/75 px-3 py-1.5 text-[13px] font-black text-[#0c7468]">
                HyperEVM 生态目录
              </div>
              <h1 className="whitespace-nowrap text-[38px] font-black leading-[0.96] tracking-normal text-[#062d29] sm:text-[50px] lg:text-[56px]">
                HyperEVM Hub
              </h1>
              <p className="mt-5 text-[17px] font-bold leading-8 text-[#315f59]">
                探索 HyperEVM 生态中的每一块土壤
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#06393429] bg-[#06342f] px-5 text-[14px] font-black text-[#effffb] shadow-[0_12px_26px_rgba(6,52,47,0.2)] transition hover:-translate-y-0.5 hover:bg-[#042b27]"
                  href="/projects"
                >
                  浏览全部项目
                </Link>
                <a
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#06393429] bg-white/80 px-5 text-[14px] font-black text-[#06342f] transition hover:-translate-y-0.5 hover:bg-white"
                  href="#featured-projects"
                >
                  查看精选项目
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8" id="featured-projects">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-black leading-tight text-[#072b28]">精选项目</h2>
              <p className="mt-1 text-[14px] font-bold text-[#58726d]">
                由后台勾选精选后展示，卡片会使用已保存的项目 Logo。
              </p>
            </div>
            <Link className="text-[14px] font-black text-[#0a6f64] transition hover:text-[#06342f]" href="/projects">
              查看全部
            </Link>
          </div>

          {featuredProjects.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-4">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </ul>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[#06393424] bg-white/70 p-8 text-[14px] font-bold text-[#58726d]">
              暂无精选项目。你可以在后台项目管理中勾选精选后显示在这里。
            </div>
          )}
        </section>

        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 sm:bottom-6 sm:right-6">
          <a
            aria-label="Open HyperEVM CN on X"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0639341f] bg-white/88 text-[#062d29] shadow-[0_14px_34px_rgba(4,65,58,0.18)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white"
            href="https://x.com/HyperEVM_CN"
            rel="noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.27l-4.9-6.4L6.43 22H3.31l7.24-8.27L1 2h6.43l4.43 5.84L18.9 2Zm-1.1 18h1.73L6.49 3.9H4.63L17.8 20Z" />
            </svg>
          </a>

          <a
            aria-label="Open Hyperliquid Builder Telegram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0639341f] bg-white/88 text-[#0a8f7d] shadow-[0_14px_34px_rgba(4,65,58,0.18)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white"
            href="https://t.me/HyperliquidBuilder"
            rel="noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.5 4.5 18.4 19c-.23 1.03-.84 1.29-1.7.8l-4.7-3.47-2.27 2.2c-.25.25-.46.46-.95.46l.34-4.82 8.77-7.93c.38-.34-.08-.53-.58-.2L6.47 13.2 1.9 11.77c-1-.31-1.02-1 .21-1.48L19.9 3.4c.82-.3 1.53.2 1.6 1.1Z" />
            </svg>
          </a>
        </div>
      </section>
    </main>
  );
}
