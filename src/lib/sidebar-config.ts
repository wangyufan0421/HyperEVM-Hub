export const SIDEBAR_BRAND_NAME = "HyperEVM Hub";

export const DASHBOARD_NAV_ITEMS = [
  { label: "HYPE ETF", href: "/dashboard/hype-etf" },
  { label: "HYPE 回购", href: "/dashboard/hype-buyback" },
  { label: "HyperEVM TVL 排行", href: "/dashboard/hyperevm-tvl" },
  { label: "HIP-3 数据面板", href: "/dashboard/hip-3" },
  { label: "HIP-4 数据面板", href: "/dashboard/hip-4" },
] as const;

export const SIDEBAR_CATEGORIES = [
  "DeFi",
  "DEX",
  "Bridge",
  "NFT",
  "Wallet",
  "Infra",
  "Stable",
  "HIP-3",
  "HIP-4",
] as const;
