import Link from "next/link";
import { redirect } from "next/navigation";
import { saveUploadedSiteLogoFile, shouldKeepExistingLogoFile } from "@/lib/logo-upload";
import { prisma } from "@/lib/prisma";
import { createSiteSettingsService } from "@/lib/site-settings-service";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const success = params?.success ? decodeURIComponent(params.success) : "";
  const error = params?.error ? decodeURIComponent(params.error) : "";

  const service = createSiteSettingsService(prisma);
  const settings = await service.getSettings();

  async function updateSettingsAction(formData: FormData) {
    "use server";

    const updateService = createSiteSettingsService(prisma);
    const current = await updateService.getSettings();

    try {
      const logoFileInput = formData.get("sidebarLogoFile");
      const uploadedLogo = logoFileInput instanceof File && !shouldKeepExistingLogoFile(logoFileInput)
        ? await saveUploadedSiteLogoFile({ file: logoFileInput, baseName: "sidebar-logo" })
        : current.sidebarLogoFile ?? "";

      await updateService.updateSettings({
        siteName: String(formData.get("siteName") ?? ""),
        siteDescription: String(formData.get("siteDescription") ?? ""),
        seoTitle: String(formData.get("seoTitle") ?? ""),
        seoDescription: String(formData.get("seoDescription") ?? ""),
        sidebarLogoFile: uploadedLogo,
        sidebarLogoUrl: String(formData.get("sidebarLogoUrl") ?? ""),
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "设置保存失败，请稍后再试。";
      redirect(`/admin/settings?error=${encodeURIComponent(message)}`);
    }

    redirect("/admin/settings?success=设置已保存");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900">站点设置</h1>
        <p className="text-sm text-zinc-600">用于维护站点基础配置、SEO 信息与 Sidebar 品牌 Logo。</p>
      </header>

      {success ? <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</section> : null}
      {error ? <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</section> : null}

      <form action={updateSettingsAction} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-6 sm:grid-cols-2">
        <input className="rounded border px-3 py-2 text-sm" defaultValue={settings.siteName} name="siteName" placeholder="网站名称" required />
        <input className="rounded border px-3 py-2 text-sm" defaultValue={settings.seoTitle} name="seoTitle" placeholder="SEO 标题" required />
        <textarea className="rounded border px-3 py-2 text-sm sm:col-span-2" defaultValue={settings.siteDescription} name="siteDescription" placeholder="网站描述" rows={3} required />
        <textarea className="rounded border px-3 py-2 text-sm sm:col-span-2" defaultValue={settings.seoDescription} name="seoDescription" placeholder="SEO 描述" rows={3} required />

        <div className="sm:col-span-2 space-y-1">
          <label className="text-sm font-medium text-zinc-800" htmlFor="sidebarLogoFile">Sidebar Logo 上传（优先）</label>
          <input accept=".png,.jpg,.jpeg,.webp,.svg" className="rounded border px-3 py-2 text-sm w-full" id="sidebarLogoFile" name="sidebarLogoFile" type="file" />
          <p className="text-xs text-zinc-500">支持 png、jpg、jpeg、webp、svg，最大 2MB；不上传则保留当前 Logo。</p>
          {settings.sidebarLogoFile ? <p className="text-xs text-zinc-500">当前上传 Logo：{settings.sidebarLogoFile}</p> : null}
        </div>

        <input className="rounded border px-3 py-2 text-sm sm:col-span-2 text-zinc-500" defaultValue={settings.sidebarLogoUrl ?? ""} name="sidebarLogoUrl" placeholder="Sidebar Logo URL（备用）" />

        <button className="rounded bg-zinc-900 px-4 py-2 text-sm text-white sm:col-span-2" type="submit">保存设置</button>
      </form>

      <Link className="text-sm text-blue-600 hover:underline" href="/admin">返回后台首页</Link>
    </main>
  );
}
