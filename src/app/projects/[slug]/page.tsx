import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  buildProjectDetailOverview,
  buildProjectDetailSections,
  getProjectLogoSrc,
  getVisibleProjectLinks,
} from "@/lib/project-detail";
import type { DirectoryProject } from "@/lib/project-directory";
import { getPublicProjectBySlug } from "@/lib/public-projects";
import { buildProjectSeo } from "@/lib/seo";
import { CATEGORY_LABELS_ZH } from "@/lib/project-taxonomy";
import { BackButton } from "@/components/back-button";

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    return {
      title: "项目不存在 | HyperEVM Hub",
      description: "该项目可能不存在或已下线。",
    };
  }

  const seo = buildProjectSeo({
    name: project.name,
    category: project.category ?? project.categories[0] ?? "Infra",
    shortDescription: project.shortDescription,
    logoUrl: project.logoUrl,
  });

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: [seo.ogImage],
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const row = await getPublicProjectBySlug(slug);

  if (!row) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
          项目不存在，返回项目列表继续浏览。
        </section>
        <Link className="text-sm text-blue-600 hover:underline" href="/projects">
          返回项目列表
        </Link>
      </main>
    );
  }

  const project: DirectoryProject & {
    longDescription: string | null;
    coreFeatures: string[];
    targetUsers: string[];
    riskNotes: string[];
  } = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category ?? row.categories[0] ?? "Infra",
    categories: row.categories,
    status: row.status,
    shortDescription: row.shortDescription,
    logoFile: row.logoFile,
    logoUrl: row.logoUrl,
    websiteUrl: row.websiteUrl,
    twitterUrl: row.twitterUrl,
    discordUrl: row.discordUrl,
    docsUrl: row.docsUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    longDescription: row.longDescription,
    coreFeatures: row.coreFeatures,
    targetUsers: row.targetUsers,
    riskNotes: row.riskNotes,
  };

  const sections = buildProjectDetailSections(project);
  const coreFeaturesSection = sections.find((section) => section.key === "core-features");
  const visibleLinks = getVisibleProjectLinks(project);
  const overview = buildProjectDetailOverview(project);
  const communityLinks = visibleLinks.filter((link) => link.label === "Twitter / X" || link.label === "Discord");
  const docsLink = visibleLinks.find((link) => link.label === "Docs");
  const externalLinks = communityLinks.concat(docsLink ? [docsLink] : []);
  const categoryLabels = project.categories.map(
    (category) => CATEGORY_LABELS_ZH[category as keyof typeof CATEGORY_LABELS_ZH] ?? category,
  );

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col items-start space-y-2">
        <BackButton />

        <nav className="text-[15px] text-zinc-600">
          <Link className="transition-colors hover:text-zinc-900 hover:underline" href="/">首页</Link>
          <span className="px-2 text-zinc-400">/</span>
          <Link className="transition-colors hover:text-zinc-900 hover:underline" href="/projects">项目</Link>
          <span className="px-2 text-zinc-400">/</span>
          <span className="font-medium text-zinc-900">{project.name}</span>
        </nav>
      </div>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_320px] lg:items-start">
          <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <Image
                alt={`${project.name} logo`}
                className="h-16 w-16 rounded-2xl border border-zinc-200 bg-white sm:h-[76px] sm:w-[76px]"
                height={76}
                src={getProjectLogoSrc(project)}
                width={76}
              />
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[28px] font-bold leading-tight text-zinc-900 sm:text-[34px]">
                    {project.name}
                  </h1>
                </div>
                <p className="text-[15px] leading-7 text-zinc-600 sm:text-base">{project.shortDescription}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  {categoryLabels.map((label) => (
                    <span key={label} className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-700">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-900">项目概览</h2>
              <p className="mt-4 text-[15px] leading-7 text-zinc-700 sm:text-base">{overview}</p>
            </section>
          </div>

          <aside className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 sm:p-6 lg:sticky lg:top-6">
            <a
              className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              href={project.websiteUrl}
              rel="noreferrer"
              target="_blank"
            >
              访问官网
            </a>

            {externalLinks.length > 0 ? (
              <div className="space-y-2 pt-1">
                <div className="text-sm font-semibold text-zinc-900">相关链接</div>
                <div className="flex flex-wrap gap-2">
                  {externalLinks.map((link) => (
                    <a
                      key={link.label}
                      className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                      href={link.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {coreFeaturesSection ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">核心功能</h2>
            <p className="mt-1 text-sm text-zinc-500">看它能做什么。</p>
          </div>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-zinc-700 sm:text-[15px]">
            {coreFeaturesSection.content.map((item) => (
              <li key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
