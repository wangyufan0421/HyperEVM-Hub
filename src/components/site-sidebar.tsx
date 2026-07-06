import type { SidebarCategoryItem } from "@/lib/sidebar-categories";
import { DASHBOARD_NAV_ITEMS, PROJECT_NAV_ITEMS } from "@/lib/sidebar-config";
import Image from "next/image";
import Link from "next/link";

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 transition group-open:rotate-90" fill="none" viewBox="0 0 24 24">
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
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
  activeProjectHref?: string | null;
}) {
  const sectionClass =
    "flex h-10 cursor-pointer list-none items-center justify-between rounded-[9px] border border-[color:var(--line)] bg-white/58 px-3 text-[13px] font-semibold text-[color:var(--text-soft)] transition hover:border-[color:var(--line-mint)] hover:bg-white/82 [&::-webkit-details-marker]:hidden";
  const activeClass = "border-[color:var(--line-mint)] bg-[color:var(--mint-soft)] text-[#046456]";
  const idleClass = "border-transparent bg-transparent text-[color:var(--text-mute)] hover:bg-white/62 hover:text-[color:var(--text)]";
  const linkClass = "flex h-9 min-w-max items-center justify-between rounded-[8px] border px-3 text-[13px] font-semibold leading-5 transition md:min-w-0";

  return (
    <aside className="w-full border-b border-[color:var(--line)] bg-white/58 backdrop-blur-lg md:sticky md:top-0 md:min-h-screen md:w-[244px] md:border-b-0 md:border-r">
      <div className="p-4 md:p-5">
        <Link className="mb-6 flex items-center gap-3" href="/">
          <Image
            alt="HyperEVM Hub logo"
            className="h-8 w-8 rounded-[9px] border border-[color:var(--line)] bg-[#062d29] object-cover"
            height={32}
            src={props.brand.logoSrc}
            width={32}
          />
          <h1 className="truncate text-[16px] font-semibold leading-7 text-[color:var(--text)]">{props.brand.siteName}</h1>
        </Link>

        <nav className="space-y-4">
          <Link className={sectionClass} href="/">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--mint)]" />
              <span>Home</span>
            </span>
          </Link>

          <details className="group" open>
            <summary className={sectionClass}>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--mint)]" />
                <span>Dashboards</span>
              </span>
              <ChevronIcon />
            </summary>

            <ul className="relative mt-2 flex gap-2 overflow-x-auto pb-1 pl-3 text-sm before:absolute before:bottom-2 before:left-1 before:top-2 before:w-px before:bg-[color:var(--line)] md:block md:space-y-1.5 md:overflow-visible md:pb-0">
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
            <summary className={sectionClass}>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--mint)]" />
                <span>Projects</span>
              </span>
              <span className="flex items-center gap-2 text-[color:var(--text-dim)]">
                <span className="num text-[12px]">{props.totalCount}</span>
                <ChevronIcon />
              </span>
            </summary>

            <ul className="relative mt-2 flex gap-2 overflow-x-auto pb-1 pl-3 text-sm before:absolute before:bottom-2 before:left-1 before:top-2 before:w-px before:bg-[color:var(--line)] md:block md:space-y-1.5 md:overflow-visible md:pb-0">
              {PROJECT_NAV_ITEMS.map((item) => {
                const isActive = props.activeProjectHref === item.href || (props.activeAll && item.href === "/projects");
                return (
                  <li key={`${item.label}-${item.href}`}>
                    <Link className={`${linkClass} ${isActive ? activeClass : idleClass}`} href={item.href}>
                      <span>{item.label}</span>
                      {item.href === "/projects" ? <span className="num text-[12px] text-[color:var(--text-dim)]">{props.totalCount}</span> : null}
                    </Link>
                  </li>
                );
              })}
              {props.categories.map((item) => {
                const isActive = props.activeCategorySlug === item.slug;
                return (
                  <li key={item.category}>
                    <Link className={`${linkClass} ${isActive ? activeClass : idleClass}`} href={`/categories/${item.slug}`}>
                      <span>{item.label}</span>
                      <span className="num text-[12px] text-[color:var(--text-dim)]">{item.count}</span>
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
