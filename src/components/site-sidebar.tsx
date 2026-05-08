import Image from "next/image";
import Link from "next/link";
import type { SidebarCategoryItem } from "@/lib/sidebar-categories";

export function SiteSidebar(props: {
  brand: { siteName: string; logoSrc: string };
  categories: SidebarCategoryItem[];
  totalCount: number;
  activeCategorySlug?: string | null;
  activeAll?: boolean;
}) {
  const activeClass =
    "border-[#09b99c73] bg-[linear-gradient(135deg,rgba(142,245,220,0.95),rgba(255,255,255,0.9))] text-[#042c28]";
  const idleClass =
    "border-[#06393424] bg-white/75 text-[#244d48] hover:border-[#09b99c73] hover:bg-[linear-gradient(135deg,rgba(142,245,220,0.82),rgba(255,255,255,0.9))]";
  const linkClass =
    "flex h-[38px] min-w-max items-center justify-between rounded-full border px-3.5 py-2 text-[14px] font-black leading-6 transition hover:translate-x-0.5 md:min-w-0";

  return (
    <aside className="w-full border-b border-[#06393424] bg-[#fafffc]/80 backdrop-blur-lg md:sticky md:top-0 md:min-h-screen md:w-[244px] md:border-b-0 md:border-r">
      <div className="p-4 md:p-5">
        <Link className="mb-7 flex items-center gap-3" href="/">
          <Image
            alt="HyperEVM Hub logo"
            className="h-[34px] w-[34px] rounded-xl border border-[#09b99c3d] bg-[#06342f] object-cover shadow-[0_10px_24px_rgba(9,185,156,0.2)]"
            height={34}
            src={props.brand.logoSrc}
            width={34}
          />
          <h1 className="text-[19px] font-black leading-7 text-[#072b28]">{props.brand.siteName}</h1>
        </Link>

        <nav>
          <h2 className="text-[14px] font-black text-[#214541]">分类</h2>
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm md:block md:space-y-2 md:overflow-visible md:pb-0">
            <li>
              <Link className={`${linkClass} ${props.activeAll ? activeClass : idleClass}`} href="/projects">
                <span>All</span>
                <span className="text-[12px] font-black text-[#60807a]">{props.totalCount}</span>
              </Link>
            </li>
            {props.categories.map((item) => {
              const isActive = props.activeCategorySlug === item.slug;
              return (
                <li key={item.category}>
                  <Link className={`${linkClass} ${isActive ? activeClass : idleClass}`} href={`/categories/${item.slug}`}>
                    <span>{item.label}</span>
                    <span className="text-[12px] font-black text-[#60807a]">{item.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
