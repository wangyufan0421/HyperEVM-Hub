import type { SidebarCategoryItem } from "@/lib/sidebar-categories";
import { DASHBOARD_NAV_ITEMS } from "@/lib/sidebar-config";
import Image from "next/image";
import Link from "next/link";

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 transition group-open:rotate-90" fill="none" viewBox="0 0 24 24">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}

export function SiteSidebar(props: {
  brand: { siteName: string; logoSrc: string };
  categories: SidebarCategoryItem[];
  totalCount: number;
  activeCategorySlug?: string | null;
  activeAll?: boolean;
  activeDashboardHref?: string | null;
}) {
  const parentSummaryClass =
    "flex h-[48px] cursor-pointer list-none items-center justify-between rounded-[10px] border border-[#8bd9ca] bg-[#c9f5ec] px-4 text-[15px] font-black text-[#063934] shadow-[0_10px_24px_rgba(9,185,156,0.12)] transition hover:border-[#64c9b8] hover:bg-[#b8efe4] [&::-webkit-details-marker]:hidden";
  const activeClass =
    "border-[#09b99c73] bg-[linear-gradient(135deg,rgba(142,245,220,0.95),rgba(255,255,255,0.9))] text-[#042c28]";
  const idleClass =
    "border-[#06393424] bg-white/75 text-[#244d48] hover:border-[#09b99c73] hover:bg-[linear-gradient(135deg,rgba(142,245,220,0.82),rgba(255,255,255,0.9))]";
  const linkClass =
    "flex h-[34px] min-w-max items-center justify-between rounded-full border px-3 py-1.5 text-[13px] font-black leading-5 transition hover:translate-x-0.5 md:min-w-0";

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

        <nav className="space-y-5">
          <Link className={parentSummaryClass} href="/">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#087b6d]" />
              <span>Home</span>
            </span>
          </Link>

          <details className="group" open>
            <summary className={parentSummaryClass}>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#087b6d]" />
                <span className="flex flex-col leading-[16px]">
                  <span>Hyperliquid</span>
                  <span>数据看板</span>
                </span>
              </span>
              <ChevronIcon />
            </summary>

            <ul className="relative mt-3 flex gap-2 overflow-x-auto pb-1 pl-4 text-sm before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-px before:bg-[#09b99c24] md:block md:space-y-2 md:overflow-visible md:pb-0">
              {DASHBOARD_NAV_ITEMS.map((item) => {
                const isActive = props.activeDashboardHref === item.href;
                return (
                  <li key={item.href}>
                    <Link className={`${linkClass} ${isActive ? activeClass : idleClass}`} href={item.href}>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>

          <details className="group" open>
            <summary className={parentSummaryClass}>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#087b6d]" />
                <span className="flex flex-col leading-[16px]">
                  <span>HyperEVM</span>
                  <span>具体项目</span>
                </span>
              </span>
              <span className="flex items-center gap-2 text-[#2d6b62]">
                <span className="text-[12px]">{props.totalCount}</span>
                <ChevronIcon />
              </span>
            </summary>

            <ul className="relative mt-3 flex gap-2 overflow-x-auto pb-1 pl-4 text-sm before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-px before:bg-[#09b99c24] md:block md:space-y-2 md:overflow-visible md:pb-0">
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
          </details>
        </nav>
      </div>
    </aside>
  );
}
