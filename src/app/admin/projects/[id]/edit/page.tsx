import { Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CATEGORIES, PROJECT_STATUS } from "@/lib/project-taxonomy";
import { AdminProjectError, createProjectService, mapProjectFormToUpdateInput } from "@/lib/admin-projects-service";
import { saveUploadedLogoFile, shouldKeepExistingLogoFile } from "@/lib/logo-upload";
import { prisma } from "@/lib/prisma";
import { resolveProjectLogo } from "@/lib/project-rules";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminEditProjectPageProps = {
  params: Promise<{ id: string }>;
};

type EditableProject = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categories: string[];
  status: string;
  shortDescription: string;
  websiteUrl: string;
  logoFile: string | null;
  logoUrl: string | null;
  twitterUrl: string | null;
  discordUrl: string | null;
  docsUrl: string | null;
  longDescription: string | null;
  coreFeatures: string[];
  targetUsers: string[];
  riskNotes: string[];
  isFeatured: boolean;
  featuredOrder: number | null;
};

function FieldLabel(props: { htmlFor?: string; required?: boolean; children: string }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-zinc-800" htmlFor={props.htmlFor}>
      {props.children}
      {props.required ? <span className="ml-1 text-red-600">*</span> : null}
    </label>
  );
}

function FieldHint(props: { children: string }) {
  return <p className="mt-1 text-xs leading-5 text-zinc-500">{props.children}</p>;
}

const INPUT_CLASSNAME = "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-0";
const TEXTAREA_CLASSNAME = `${INPUT_CLASSNAME} min-h-[104px] resize-y`;

export default async function AdminEditProjectPage({ params, searchParams }: AdminEditProjectPageProps & {
  searchParams?: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const error = search?.error ? decodeURIComponent(search.error) : "";
  const service = createProjectService(prisma);
  const project = await service.getProjectById(id) as EditableProject | null;

  if (!project) notFound();

  const safeProject = project;
  const selectedCategories = project.categories.length > 0 ? project.categories : [project.category];
  const currentLogoSrc = resolveProjectLogo({
    logoFile: project.logoFile,
    logoUrl: project.logoUrl,
  });

  async function updateProjectAction(formData: FormData) {
    "use server";

    try {
      const updateService = createProjectService(prisma);
      const logoFileInput = formData.get("logoFile");
      const uploadedLogo = logoFileInput instanceof File && !shouldKeepExistingLogoFile(logoFileInput)
        ? await saveUploadedLogoFile({
          file: logoFileInput,
          slugSource: String(formData.get("slug") ?? String(formData.get("name") ?? "")),
        })
        : safeProject.logoFile ?? "";
      const selectedCategories = formData.getAll("categories").map((item) => String(item).trim()).filter(Boolean);
      if (selectedCategories.length === 0) {
        redirect(`/admin/projects/${id}/edit?error=${encodeURIComponent("请至少选择一个分类")}`);
      }

      const payload = mapProjectFormToUpdateInput({
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        autoResolveSlug: false,
        category: selectedCategories[0] ?? "",
        categories: selectedCategories.join(";"),
        status: String(formData.get("status") ?? "Live"),
        shortDescription: String(formData.get("shortDescription") ?? ""),
        websiteUrl: String(formData.get("websiteUrl") ?? ""),
        logoFile: uploadedLogo,
        logoUrl: String(formData.get("logoUrl") ?? ""),
        twitterUrl: String(formData.get("twitterUrl") ?? ""),
        discordUrl: String(formData.get("discordUrl") ?? ""),
        docsUrl: String(formData.get("docsUrl") ?? ""),
        longDescription: String(formData.get("longDescription") ?? ""),
        coreFeatures: String(formData.get("coreFeatures") ?? ""),
        targetUsers: String(formData.get("targetUsers") ?? ""),
        riskNotes: String(formData.get("riskNotes") ?? ""),
        isFeatured: safeProject.isFeatured,
        featuredOrder: safeProject.featuredOrder == null ? "" : String(safeProject.featuredOrder),
      });

      await updateService.updateProject(id, payload);
    } catch (caughtError) {
      if (caughtError instanceof AdminProjectError) {
        if (caughtError.code === "INVALID_CATEGORY") {
          redirect(`/admin/projects/${id}/edit?error=${encodeURIComponent("请至少选择一个分类")}`);
        }
        if (caughtError.code === "DUPLICATE_SLUG") {
          redirect(`/admin/projects/${id}/edit?error=${encodeURIComponent("slug 已存在，请换一个")}`);
        }
        redirect(`/admin/projects/${id}/edit?error=${encodeURIComponent(caughtError.message)}`);
      }
      if (caughtError instanceof Prisma.PrismaClientValidationError) {
        redirect(`/admin/projects/${id}/edit?error=${encodeURIComponent(`数据库保存失败：${caughtError.message}`)}`);
      }
      if (caughtError instanceof Prisma.PrismaClientKnownRequestError) {
        redirect(`/admin/projects/${id}/edit?error=${encodeURIComponent(`数据库保存失败：${caughtError.code}`)}`);
      }
      if (caughtError instanceof Error) {
        redirect(`/admin/projects/${id}/edit?error=${encodeURIComponent(caughtError.message || "保存失败")}`);
      }
      throw caughtError;
    }

    redirect("/admin/projects");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900">编辑项目</h1>
        <p className="text-sm text-zinc-600">正在编辑项目 ID：{id}</p>
      </header>

      {error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </section>
      ) : null}

      <form action={updateProjectAction} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <section className="space-y-4 rounded-xl border border-zinc-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-zinc-900">基础信息区</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="name" required>项目名称</FieldLabel>
              <input className={INPUT_CLASSNAME} defaultValue={project.name} id="name" name="name" placeholder="例如：HyperLend" required />
            </div>
            <div>
              <FieldLabel htmlFor="slug" required>项目 Slug</FieldLabel>
              <input className={INPUT_CLASSNAME} defaultValue={project.slug} id="slug" name="slug" placeholder="例如：hyperlend" required />
              <FieldHint>编辑时建议保持稳定，避免影响外部已引用的详情页链接。</FieldHint>
            </div>
            <div>
              <FieldLabel required>项目分类（可多选）</FieldLabel>
              <input name="category" type="hidden" value="" />
              <div className="grid gap-2 rounded-lg border border-zinc-300 px-3 py-2.5 sm:grid-cols-3">
                {CATEGORIES.map((category) => (
                  <label key={category} className="flex items-center gap-2 text-sm text-zinc-800">
                    <input
                      className="h-4 w-4"
                      defaultChecked={selectedCategories.includes(category)}
                      name="categories"
                      type="checkbox"
                      value={category}
                    />
                    {category}
                  </label>
                ))}
              </div>
              <FieldHint>项目可以归入多个分类；至少保留一个分类。</FieldHint>
            </div>
            <div>
              <FieldLabel htmlFor="status" required>项目状态</FieldLabel>
              <select className={INPUT_CLASSNAME} defaultValue={project.status} id="status" name="status" required>
                {PROJECT_STATUS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="shortDescription" required>一句话简介</FieldLabel>
              <input className={INPUT_CLASSNAME} defaultValue={project.shortDescription} id="shortDescription" name="shortDescription" placeholder="例如：面向 HyperEVM 的去中心化借贷协议" required />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="websiteUrl" required>官网地址</FieldLabel>
              <input className={INPUT_CLASSNAME} defaultValue={project.websiteUrl} id="websiteUrl" name="websiteUrl" placeholder="例如：https://example.com 或 example.com" required />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="logoFile">Logo 图片上传（优先）</FieldLabel>
              <div className="mb-3 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <Image
                  alt={`${project.name} 当前 Logo`}
                  className="h-12 w-12 rounded-xl border border-zinc-200 bg-white object-cover"
                  height={48}
                  src={currentLogoSrc}
                  width={48}
                />
                <div className="min-w-0 text-xs leading-5 text-zinc-600">
                  <p className="font-medium text-zinc-800">当前 Logo</p>
                  <p className="truncate">{project.logoFile || project.logoUrl || "暂无 Logo，保存后将使用默认占位图。"}</p>
                </div>
              </div>
              <input accept=".png,.jpg,.jpeg,.webp,.svg" className={`${INPUT_CLASSNAME} file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:text-zinc-700`} id="logoFile" name="logoFile" type="file" />
              <FieldHint>不上传则保留当前 Logo；支持 png、jpg、jpeg、webp、svg，最大 2MB。</FieldHint>
              {project.logoFile ? <p className="mt-1 text-xs text-zinc-500">当前上传 Logo：{project.logoFile}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="logoUrl">备用 Logo URL</FieldLabel>
              <input className={INPUT_CLASSNAME} defaultValue={project.logoUrl ?? ""} id="logoUrl" name="logoUrl" placeholder="例如：https://example.com/logo.png（本地未上传时使用）" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-zinc-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-zinc-900">链接信息区</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="twitterUrl">Twitter / X</FieldLabel>
              <input className={INPUT_CLASSNAME} defaultValue={project.twitterUrl ?? ""} id="twitterUrl" name="twitterUrl" placeholder="例如：https://x.com/project" />
            </div>
            <div>
              <FieldLabel htmlFor="discordUrl">Discord</FieldLabel>
              <input className={INPUT_CLASSNAME} defaultValue={project.discordUrl ?? ""} id="discordUrl" name="discordUrl" placeholder="例如：https://discord.gg/xxxx" />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="docsUrl">Docs 文档地址</FieldLabel>
              <input className={INPUT_CLASSNAME} defaultValue={project.docsUrl ?? ""} id="docsUrl" name="docsUrl" placeholder="例如：https://docs.example.com" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-zinc-200 p-4 sm:p-5">
          <h2 className="text-base font-semibold text-zinc-900">详情内容区</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="longDescription">详细介绍</FieldLabel>
              <textarea className={TEXTAREA_CLASSNAME} defaultValue={project.longDescription ?? ""} id="longDescription" name="longDescription" placeholder="例如：描述项目定位、核心机制、与 HyperEVM 的关系。" rows={4} />
              <FieldHint>用于详情页项目概览，支持换行；建议 2-5 句完整描述。</FieldHint>
            </div>
            <div>
              <FieldLabel htmlFor="coreFeatures">核心功能</FieldLabel>
              <textarea className={TEXTAREA_CLASSNAME} defaultValue={project.coreFeatures.join("\n")} id="coreFeatures" name="coreFeatures" placeholder={"例如：\n一键存借\n风险参数可视化"} rows={4} />
              <FieldHint>可用逗号或换行分隔，保存后会按条目展示。</FieldHint>
            </div>
          </div>
        </section>


        <button className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800" type="submit">保存修改</button>
      </form>

      <Link className="text-sm text-blue-600 hover:underline" href="/admin/projects">返回项目列表</Link>
    </main>
  );
}
