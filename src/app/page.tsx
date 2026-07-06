import { HomeMarketSection } from "@/components/home-market-section/home-market-section";
import { DexChainRankingCard } from "@/components/home-market-section/dex-chain-ranking-card";
import { HomeSearchForm } from "@/components/home-search-form";
import { SiteTopNav } from "@/components/site-top-nav";
import { getHyperEvmEcosystemMetrics } from "@/lib/defillama-ecosystem";
import { getHomeHipMetrics } from "@/lib/home-hip-metrics";
import { isHypeRange, type HypeRange } from "@/lib/hype-market";
import { getCategoryCounts, type DirectoryProject } from "@/lib/project-directory";
import { getHypeMarketData } from "@/lib/hype-market-service";
import { prisma } from "@/lib/prisma";
import { listPublicProjects } from "@/lib/public-projects";
import { buildSidebarCategories } from "@/lib/sidebar-categories";
import { resolveSidebarBrand } from "@/lib/site-brand";
import { createSiteSettingsService } from "@/lib/site-settings-service";
import { resolveProjectLogo } from "@/lib/project-rules";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

type HomeProject = DirectoryProject & {
  isFeatured: boolean;
  featuredOrder: number | null;
};

function toDirectoryProject(project: Awaited<ReturnType<typeof listPublicProjects>>[number]): HomeProject {
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
    isFeatured: project.isFeatured,
    featuredOrder: project.featuredOrder,
  };
}

function formatCompactUsd(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    currency: "USD",
    maximumFractionDigits: 2,
    notation: "compact",
    style: "currency",
  }).format(value);
}

function formatUsd(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 3, minimumFractionDigits: 3 })}`;
}

function StatTile({ label, value }: { label: string; value: string; helper?: string }) {
  return (
    <div className="ui-card-quiet px-4 py-3">
      <p className="eyebrow">{label}</p>
      <p className="num mt-2 text-[24px] font-semibold leading-none text-[color:var(--text)]">{value}</p>
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ hypeRange?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawRequestedRange = Array.isArray(resolvedSearchParams?.hypeRange)
    ? resolvedSearchParams?.hypeRange[0]
    : resolvedSearchParams?.hypeRange;
  const requestedRange = rawRequestedRange ?? null;
  let selectedHypeRange: HypeRange = "1D";
  if (isHypeRange(requestedRange)) {
    selectedHypeRange = requestedRange;
  }

  const dbProjects = await listPublicProjects();
  const projects = dbProjects.map(toDirectoryProject);
  const categoryCounts = getCategoryCounts(projects);
  const sidebarCategories = buildSidebarCategories(categoryCounts);
  const siteSettings = await createSiteSettingsService(prisma).getSettings();
  const [initialHypeMarketData, ecosystemMetrics, hipMetrics] = await Promise.all([
    getHypeMarketData(selectedHypeRange).catch(() => null),
    getHyperEvmEcosystemMetrics().catch(() => null),
    getHomeHipMetrics().catch(() => null),
  ]);
  const brand = resolveSidebarBrand({
    siteName: siteSettings.siteName,
    sidebarLogoFile: siteSettings.sidebarLogoFile ?? null,
    sidebarLogoUrl: siteSettings.sidebarLogoUrl ?? null,
  });
  const configuredFeaturedProjects = projects
    .filter((project) => project.isFeatured)
    .sort((a, b) => {
      const orderA = a.featuredOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.featuredOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 6);
  const featuredProjects = configuredFeaturedProjects.length > 0 ? configuredFeaturedProjects : projects.slice(0, 6);

  return (
    <main className="app-shell pb-28">
      <SiteTopNav activeHref="/" brand={brand} />

      <section className="app-container mt-3">
        <div className="ui-card overflow-hidden p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(560px,0.95fr)] lg:items-center">
            <div>
              <p className="eyebrow">HyperEVM ecosystem intelligence</p>
              <h1 className="mt-2 max-w-[780px] text-[34px] font-semibold leading-[1.03] tracking-[-0.02em] text-[color:var(--text)] sm:text-[46px]">
                HyperEVM Hub
              </h1>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatTile helper="Public ecosystem entries" label="Projects" value={String(projects.length)} />
              <StatTile helper="Tracked categories" label="Categories" value={String(sidebarCategories.length)} />
              <StatTile helper="DefiLlama 24h app fees" label="App fees" value={formatCompactUsd(ecosystemMetrics?.appFees24h)} />
              <StatTile helper={`${selectedHypeRange} live market`} label="$HYPE" value={formatUsd(initialHypeMarketData?.price)} />
              <StatTile helper="Flowscan HIP-3 daily volume" label="HIP-3 24H Volume" value={formatCompactUsd(hipMetrics?.hip3Volume24h)} />
              <StatTile helper="Hyperliquid outcome token volume" label="HIP-4 24H Volume" value={formatCompactUsd(hipMetrics?.hip4Volume24h)} />
            </div>
          </div>
        </div>
      </section>

      <section className="app-container" id="market-overview">
        <HomeMarketSection
          ecosystemMetrics={ecosystemMetrics}
          initialHypeMarketData={initialHypeMarketData}
          selectedHypeRange={selectedHypeRange}
        />
      </section>

      <section className="app-container mt-4">
        <DexChainRankingCard metrics={ecosystemMetrics} />
      </section>

      <section className="app-container mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="ui-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">项目目录</p>
              <h2 className="mt-1 text-[20px] font-semibold text-[color:var(--text)]">精选生态项目</h2>
            </div>
            <Link className="ui-button" href="/projects">
              查看全部
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {featuredProjects.map((project) => (
              <Link
                className="ui-card-quiet group flex min-h-[86px] items-center gap-3 px-3 py-3 transition hover:border-[color:var(--line-mint)] hover:bg-white/80"
                href={`/projects/${project.slug}`}
                key={project.id}
              >
                <Image
                  alt={`${project.name} logo`}
                  className="h-10 w-10 shrink-0 rounded-[9px] border border-[color:var(--line)] bg-[#062d29] object-cover"
                  height={40}
                  src={resolveProjectLogo({ logoFile: project.logoFile, logoUrl: project.logoUrl })}
                  width={40}
                />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-[color:var(--text)] group-hover:text-[color:var(--mint)]">
                    {project.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-[color:var(--text-mute)]">
                    {project.shortDescription}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="ui-card p-5 sm:p-6">
          <h2 className="text-[20px] font-semibold text-[color:var(--text)]">目录</h2>
          <div className="mt-4 grid gap-2">
            {sidebarCategories.slice(0, 7).map((item) => (
              <Link
                className="flex h-10 items-center justify-between rounded-[9px] border border-[color:var(--line)] bg-white/52 px-3 text-[13px] font-semibold text-[color:var(--text-soft)] transition hover:border-[color:var(--line-mint)] hover:bg-white/78"
                href={`/categories/${item.slug}`}
                key={item.category}
              >
                <span>{item.label}</span>
                <span className="num text-[12px] text-[color:var(--text-dim)]">{item.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-4 z-50 px-4">
        <HomeSearchForm />
      </div>
    </main>
  );
}
