import type { SidebarCategoryItem } from "@/lib/sidebar-categories";
import Link from "next/link";

export function ProjectCategoryNav({
  activeCategorySlug,
  categories,
  totalCount,
}: {
  activeCategorySlug?: string;
  categories: SidebarCategoryItem[];
  totalCount: number;
}) {
  return (
    <aside className="ui-card h-fit p-4 lg:sticky lg:top-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Categories</p>
          <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--text)]">项目分类</h2>
        </div>
        <span className="num rounded-[8px] border border-[color:var(--line)] bg-white/58 px-2 py-1 text-[12px] font-semibold text-[color:var(--text-dim)]">
          {totalCount}
        </span>
      </div>

      <nav aria-label="项目分类导航" className="mt-4 grid gap-1.5">
        <Link
          className={`flex h-10 items-center justify-between rounded-[8px] border px-3 text-[13px] font-semibold transition ${
            activeCategorySlug
              ? "border-[color:var(--line)] bg-white/52 text-[color:var(--text-soft)] hover:border-[color:var(--line-mint)] hover:bg-white/78 hover:text-[color:var(--mint)]"
              : "border-[color:var(--line-mint)] bg-[color:var(--mint-soft)] text-[color:var(--mint)]"
          }`}
          href="/projects"
        >
          <span>全部项目</span>
          <span className="num text-[12px]">{totalCount}</span>
        </Link>
        {categories.map((item) => {
          const isActive = activeCategorySlug === item.slug;

          return (
            <Link
              className={`flex h-10 items-center justify-between rounded-[8px] border px-3 text-[13px] font-semibold transition ${
                isActive
                  ? "border-[color:var(--line-mint)] bg-[color:var(--mint-soft)] text-[color:var(--mint)]"
                  : "border-[color:var(--line)] bg-white/52 text-[color:var(--text-soft)] hover:border-[color:var(--line-mint)] hover:bg-white/78 hover:text-[color:var(--mint)]"
              }`}
              href={`/categories/${item.slug}`}
              key={item.category}
            >
              <span>{item.label}</span>
              <span className="num text-[12px] text-[color:var(--text-dim)]">{item.count}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
