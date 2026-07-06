import { PROJECT_NAV_ITEMS } from "@/lib/sidebar-config";
import Image from "next/image";
import Link from "next/link";

export type SiteTopNavBrand = {
  logoSrc: string;
  siteName: string;
};

const PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "Dashboards", href: "/dashboard/hip-3" },
  { label: "Projects", href: "/projects" },
];

const DASHBOARD_CHANNELS = [
  { label: "HIP-3", href: "/dashboard/hip-3" },
  { label: "HIP-4", href: "/dashboard/hip-4" },
  { label: "HyperEVM TVL", href: "/dashboard/hyperevm-tvl" },
  { label: "Hyper ETF", href: "/dashboard/hype-etf" },
  { label: "Hyper 回购", href: "/dashboard/hype-buyback" },
  { label: "HYPE Funding", href: "/dashboard/hype-funding" },
];

function isPrimaryActive(activeHref: string, href: string) {
  if (href === "/") return activeHref === "/";
  if (href === "/dashboard/hip-3") return activeHref.startsWith("/dashboard");
  if (href === "/projects") return activeHref.startsWith("/projects") || activeHref.startsWith("/categories");
  return activeHref === href;
}

function isProjectsSectionActive(activeHref: string) {
  return activeHref.startsWith("/projects") || activeHref.startsWith("/categories");
}

export function SiteTopNav({ activeHref, brand }: { activeHref: string; brand: SiteTopNavBrand }) {
  return (
    <>
      <div className="sticky top-0 z-40 px-4 pt-4">
        <nav className="top-nav-stage mx-auto">
          <Link className="top-nav-brand" href="/">
            <Image
              alt="HyperEVM Hub logo"
              className="h-8 w-8 rounded-[9px] border border-[color:var(--line)] bg-[#062d29] object-cover"
              height={32}
              src={brand.logoSrc}
              width={32}
            />
            <span className="truncate text-[16px] font-semibold text-[color:var(--text)]">{brand.siteName}</span>
          </Link>

          <div className="lamp-nav">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} className={`lamp-link ${isPrimaryActive(activeHref, item.href) ? "lamp-link-active" : ""}`} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {activeHref.startsWith("/dashboard") ? (
        <div className="app-container mt-3 flex justify-center">
          <div className="lamp-nav lamp-nav-secondary">
            {DASHBOARD_CHANNELS.map((channel) => (
              <Link
                key={channel.href}
                className={`lamp-link lamp-link-secondary ${activeHref === channel.href ? "lamp-link-active" : ""}`}
                href={channel.href}
              >
                {channel.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {isProjectsSectionActive(activeHref) ? (
        <div className="app-container mt-3 flex justify-center">
          <div className="lamp-nav lamp-nav-secondary">
            {PROJECT_NAV_ITEMS.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                className={`lamp-link lamp-link-secondary ${activeHref === item.href ? "lamp-link-active" : ""}`}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
