import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminFeaturedToggle } from "@/components/admin-featured-toggle";
import { buildDeleteConfirmationMessage } from "@/lib/admin-projects";
import { createProjectService } from "@/lib/admin-projects-service";
import { prisma } from "@/lib/prisma";
import { DeleteProjectButton } from "./DeleteProjectButton";

export const dynamic = "force-dynamic";

type AdminProjectsPageProps = {
  searchParams: Promise<{ showDeleted?: string }>;
};

export default async function AdminProjectsPage({ searchParams }: AdminProjectsPageProps) {
  const params = await searchParams;
  const showDeleted = params.showDeleted === "1";
  const service = createProjectService(prisma);
  const rows = await service.listProjects(showDeleted);

  async function deleteProjectAction(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return;

    await createProjectService(prisma).softDelete(id);
    revalidatePath("/admin/projects");
    redirect("/admin/projects");
  }

  async function restoreProjectAction(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return;

    await createProjectService(prisma).restore(id);
    revalidatePath("/admin/projects");
    redirect("/admin/projects");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">项目管理</h1>
        <div className="flex gap-2">
          <Link
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700"
            href={showDeleted ? "/admin/projects" : "/admin/projects?showDeleted=1"}
          >
            {showDeleted ? "查看正常项目" : "查看已删除"}
          </Link>
          <Link className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700" href="/admin/import">
            批量导入
          </Link>
          <Link className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white" href="/admin/projects/new">
            新增项目
          </Link>
        </div>
      </header>

      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        删除确认：{buildDeleteConfirmationMessage()}
      </p>

      <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-600">
          <tr>
            <th className="px-4 py-3">精选</th>
            <th className="px-4 py-3">项目名</th>
            <th className="px-4 py-3">分类</th>
            <th className="px-4 py-3">状态</th>
            <th className="px-4 py-3">官网</th>
            <th className="px-4 py-3">创建时间</th>
            <th className="px-4 py-3">更新时间</th>
            <th className="px-4 py-3">是否删除</th>
            <th className="px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-200">
              <td className="px-4 py-3">
                <AdminFeaturedToggle checked={Boolean(row.isFeatured)} disabled={row.isDeleted} projectId={row.id} />
              </td>
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3">{Array.isArray(row.categories) ? row.categories.join("; ") : row.category}</td>
              <td className="px-4 py-3">{row.status}</td>
              <td className="px-4 py-3">
                <a className="text-blue-600 hover:underline" href={row.websiteUrl} rel="noreferrer" target="_blank">
                  官网
                </a>
              </td>
              <td className="px-4 py-3">{new Date(row.createdAt).toLocaleDateString("zh-CN")}</td>
              <td className="px-4 py-3">{new Date(row.updatedAt).toLocaleDateString("zh-CN")}</td>
              <td className="px-4 py-3">{row.isDeleted ? "已删除" : "正常"}</td>
              <td className="px-4 py-3">
                <div className="flex gap-3 text-blue-600">
                  <Link href={`/admin/projects/${row.id}/edit`}>编辑</Link>
                  {row.isDeleted ? (
                    <form action={restoreProjectAction}>
                      <input name="id" type="hidden" value={row.id} />
                      <button type="submit">恢复</button>
                    </form>
                  ) : (
                    <form action={deleteProjectAction}>
                      <input name="id" type="hidden" value={row.id} />
                      <DeleteProjectButton />
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
