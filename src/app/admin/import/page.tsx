import Link from "next/link";
import { ImportProjectsClient } from "./ImportProjectsClient";

export const dynamic = "force-dynamic";

export default function AdminImportPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-3">
        <Link className="inline-flex w-fit rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50" href="/admin/projects">
          返回项目管理
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900">批量导入项目</h1>
          <p className="text-sm text-zinc-600">支持 CSV / JSON 批量导入。先解析预览，再确认写入数据库。</p>
        </div>
      </header>

      <ImportProjectsClient />
    </main>
  );
}
